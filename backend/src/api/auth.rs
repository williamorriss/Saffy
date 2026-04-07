use crate::{error::AppError, AppState, ORIGIN};
use anyhow::anyhow;
use axum::{
    extract::{Path, Query, State},
    response::{IntoResponse, Redirect, Response},
    Json,
};
use chrono::{DateTime, Utc};
use http::{request::Parts};
use quick_xml::de::from_str;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, query_as, query, query_scalar};
use tower_sessions::Session as TowerSession;
use url::Url;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;
use std::collections::HashMap;
use base64::prelude::*;

const CAS_ORIGIN: &str = "https://auth.bath.ac.uk";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthSession(pub UserSession);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession { pub id: Uuid }

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserSchema {
    pub id: Uuid,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

impl IntoResponse for AuthSession {
    fn into_response(self) -> Response {
        Json(self).into_response()
    }
}

impl<S> axum::extract::FromRequestParts<S> for AuthSession
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        TowerSession::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::Unauthorized("Failed to retrieve session".to_string()))?
            .get::<Uuid>("id")
            .await
            .ok()
            .flatten()
            .map_or_else(
                || Err(AppError::Unauthorized("session error".to_string())),
                |id| Ok(AuthSession(UserSession { id })))
    }
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(logout))
        .routes(routes!(login))
        .routes(routes!(cas_callback))
        .routes(routes!(get_session))
        .routes(routes!(delete_user))
}

#[utoipa::path(
    get,
    path = "/api/auth/login",
    responses(
        (status = 303, description = "Redirect to CAS auth"),
        (status = BAD_REQUEST, description = "Malformed URL redirect"),
        (status = INTERNAL_SERVER_ERROR, description = "Internal server error")
    ),
    params(
        ("redirect" = String, Query, description = "Url to redirect to after login")
    )
)]
#[axum::debug_handler]
pub async fn login(Query(query): Query<HashMap<String, String>>) -> Result<Redirect, AppError> {
    let redirect = query.get("redirect")
        .ok_or_else(|| AppError::BadRequest("Malformed redirect Url".to_string()))?;

    let redirect64 = BASE64_URL_SAFE.encode(Url::parse(redirect)?.as_str());

    let cas_url = Url::parse_with_params(
        &format!("{CAS_ORIGIN}/login"),
        &[("service", format!("{ORIGIN}/api/auth/cas/{redirect64}"))],
    ).map_err(|e| AppError::Internal(e.into()))?;

    Ok(Redirect::to(cas_url.as_str()))
}

#[utoipa::path(
    get,
    path = "/api/auth/logout",
    responses(
        (status = 303, description = "Redirect to CAS logout"),
    )
)]
#[axum::debug_handler]
pub async fn logout(
    AuthSession(_): AuthSession,
    session: TowerSession,
) -> Result<Redirect, AppError> {
    tracing::info!("Executing DELETE /auth/session");
    session.flush().await?;
    Ok(Redirect::to(&format!("{CAS_ORIGIN}/logout")))
}

#[utoipa::path(
    get,
    path = "/api/auth/session",
    responses(
        (status = 200, description = "User", body = UserSchema),
        (status = 404, description = "User not found"),
    )
)]
#[axum::debug_handler]
pub async fn get_session(
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
) -> Result<Json<UserSchema>, AppError> {
    query_as!(
        UserSchema,
        r#"SELECT id, username, created_at FROM users WHERE id = $1"#,
        session.id
    )
        .fetch_one(&state.db)
        .await
        .map(Json)
        .map_err(AppError::from)
}

#[utoipa::path(
    get,
    path = "/api/auth/cas/{redirect64}",
    responses(
        (status = 301, description = "Redirect to redirect url"),
        (status = NOT_FOUND, description = "Auth ID not recognised"),
        (status = BAD_REQUEST, description = "Malformed URL redirect"),
        (status = INTERNAL_SERVER_ERROR, description = "Internal server error")
    ),
    params(
        ("auth_id" = Uuid, Path, description = "Issued ID upon entering the login endpoint")
    )
)]
#[axum::debug_handler]
pub async fn cas_callback(
    Path(redirect64): Path<String>,
    Query(query): Query<HashMap<String, String>>,
    session: TowerSession,
    State(state): State<AppState>,
) -> Result<Redirect, AppError> {
    let redirect = String::from_utf8(
        BASE64_URL_SAFE.decode(&redirect64)
            .map_err(|_| AppError::BadRequest("Invalid encoding".to_string()))?
    ).map_err(|_| AppError::BadRequest("Invalid UTF".to_string()))?;

    let redirect_url = Url::parse(&redirect)
        .map_err(|_| AppError::BadRequest("Invalid URL".to_string()))?;

    let xml = get_cas_response(&redirect64, &query).await?;
    let username = parse_xml_response(&xml)?;

    let id = match get_user_id(&username, &state.db).await {
        Ok(id) => id,
        Err(sqlx::Error::RowNotFound) => new_user_id(&username, &state.db)
            .await
            .map_err(AppError::from)?,
        Err(err) => Err(AppError::DbError(err))?,
    };

    session.insert("id", id).await?;
    session.save().await?;

    Ok(Redirect::to(redirect_url.as_str()))
}

#[utoipa::path(
    get,
    path = "/api/auth/delete",
)]
#[axum::debug_handler]
pub async fn delete_user(
    tower_session: TowerSession,
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
) -> Result<Redirect, AppError> {
    query!(r#"DELETE FROM Users WHERE id = $1"#, session.id)
        .execute(&state.db)
        .await?;

    tower_session.flush().await?;
    Ok(Redirect::to(&format!("{CAS_ORIGIN}/logout")))
}

fn parse_xml_response(body: &str) -> Result<String, AppError> {
    #[derive(Debug, Deserialize)]
    struct AuthenticationFailure { text: String }

    #[derive(Debug, Deserialize)]
    struct AuthenticationSuccess { user: String }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct CasServiceResponse {
        authentication_success: Option<AuthenticationSuccess>,
        authentication_failure: Option<AuthenticationFailure>,
    }
    let result = from_str::<CasServiceResponse>(body)
        .map_err(|err| AppError::Internal(err.into()))?;

    result.authentication_success.map_or_else(
        || result.authentication_failure.map_or_else(
            || Err(AppError::Internal(anyhow!("XML response parsed but not found"))),
            |xml| Err(AppError::BadRequest(xml.text))),
        |res| Ok(res.user))
}

async fn get_cas_response(redirect64: &str, params: &HashMap<String, String>) -> Result<String, AppError> {
    let ticket = params.get("ticket")
        .ok_or_else(|| AppError::BadRequest("Missing ticket".to_string()))?;

    let cas_url = Url::parse_with_params(
        &format!("{CAS_ORIGIN}/serviceValidate"),
        &[
            ("service", &format!("{ORIGIN}/api/auth/cas/{redirect64}")),
            ("ticket", ticket),
        ],
    )?;

    reqwest::Client::new()
        .get(cas_url)
        .send()
        .await
        .map_err(|err| AppError::Internal(err.into()))?
        .text()
        .await
        .map_err(|err| AppError::Internal(err.into()))
}

async fn new_user_id(username: &str, db: &PgPool) -> Result<Uuid, sqlx::Error> {
    query_scalar!(r#"INSERT INTO users(username) VALUES($1) RETURNING id"#, username)
        .fetch_one(db)
        .await
}

async fn get_user_id(username: &str, db: &PgPool) -> Result<Uuid, sqlx::Error> {
    query_scalar!(r#"SELECT id FROM users WHERE username = $1"#, username)
        .fetch_one(db)
        .await
}
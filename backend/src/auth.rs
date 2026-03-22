use crate::{AppError, AppState, ORIGIN};
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
use sqlx::{PgPool, query, query_scalar};
use tower_sessions::Session as TowerSession;
use url::Url;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;
use std::collections::HashMap;

const CAS_ORIGIN: &str = "https://auth.bath.ac.uk";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthSession(pub Session);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session { pub id: Uuid }

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct User {
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
        tracing::debug!("Authenticating user");

        TowerSession::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::Unauthorized("Failed to retrieve session".to_string()))?
            .get::<Uuid>("id")
            .await
            .ok()
            .flatten()
            .map_or_else(
                || Err(AppError::Unauthorized("session error".to_string())),
                |id| Ok(AuthSession(Session { id })))
    }
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(logout))
        .routes(routes!(login))
        .routes(routes!(cas_callback))
        .routes(routes!(get_session))
}

#[utoipa::path(
    get,
    path = "/login",
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
pub async fn login(
    Query(query): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<Redirect, AppError> {
    tracing::info!("Executing POST /auth/login");

    let redirect = Url::parse(
        query.get("redirect")
            .ok_or_else(|| AppError::BadRequest("Malformed redirect Url".to_string()))?
    )?;

    let auth_id = Uuid::new_v4();
    let cas_url = Url::parse_with_params(
        &format!("{CAS_ORIGIN}/login"),
        &[("service", format!("{ORIGIN}/auth/cas/{auth_id}"))],
    ).map_err(|e| AppError::Internal(e.into()))?;

    state.auth_cache.insert(auth_id, redirect).await;
    Ok(Redirect::to(cas_url.as_str()))
}

#[utoipa::path(
    get,
    path = "/logout",
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
    path = "/session",
    responses(
        (status = 200, description = "User", body = User),
        (status = NOT_FOUND, description = "User not found"),
    )
)]
#[axum::debug_handler]
async fn get_session(
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
) -> Result<Json<User>, AppError> {
    tracing::info!("Executing GET /auth/session");
    Ok(Json(get_user(session.id, &state.db).await.map_err(AppError::from)?))
}

#[utoipa::path(
    get,
    path = "/cas/{auth_id}",
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
async fn cas_callback(
    Path(state_id): Path<Uuid>,
    Query(query): Query<HashMap<String, String>>,
    session: TowerSession,
    State(state): State<AppState>,
) -> Result<Redirect, AppError> {
    tracing::info!("Executing GET /auth/cas/{}", state_id);

    let redirect_url = state.auth_cache.get(&state_id).await
        .ok_or_else(|| AppError::NotFound("State ID not found in cache".to_string()))?;

    tracing::debug!("Found redirect: {}", redirect_url);

    state.auth_cache.invalidate(&state_id).await;
    let xml = get_cas_response(&state_id, &query).await?;
    let username = parse_xml_response(&xml)?;

    let id = match get_user_id(&username, &state.db).await {
        Ok(id) => id,
        Err(sqlx::Error::RowNotFound) => new_user_id(&username, &state.db)
            .await
            .map_err(AppError::from)?,
        Err(err) => Err(AppError::DbError(err))?,
    };

    tracing::info!("Session ID: {}", id);
    session.insert("id", id).await?;
    session.save().await?;

    let redirect_origin = Url::parse_with_params(redirect_url.as_str(), &[("auth", "true")])?;
    Ok(Redirect::to(redirect_origin.as_str()))
}

fn parse_xml_response(body: &str) -> Result<String, AppError> {
    #[derive(Debug, Deserialize)]
    struct AuthenticationFailure {
        #[serde(rename = "@code")]
        _code: String,
        #[serde(rename = "$text")]
        message: String,
    }

    #[derive(Debug, Deserialize)]
    struct AuthenticationSuccess {
        user: String,
        #[serde(rename = "proxyGrantingTicket")]
        _ticket: Option<String>,
    }

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
            |xml| Err(AppError::BadRequest(xml.message))),
        |res| Ok(res.user))
}

async fn get_user(id: Uuid, db: &PgPool) -> Result<User, sqlx::Error> {
    let result = query!(r#"SELECT id, username, created_at FROM users WHERE id = $1"#, id)
        .fetch_one(db)
        .await?;

    Ok(User {
        id: result.id,
        username: result.username,
        created_at: result.created_at.and_utc(),
    })
}

async fn get_cas_response(auth_id: &Uuid, params: &HashMap<String, String>) -> Result<String, AppError> {
    let ticket = params.get("ticket")
        .ok_or_else(|| AppError::BadRequest("Missing ticket".to_string()))?;

    let cas_url = Url::parse_with_params(
        &format!("{CAS_ORIGIN}/serviceValidate"),
        &[
            ("service", &format!("{ORIGIN}/auth/cas/{auth_id}")),
            ("ticket", ticket),
        ],
    )?;

    tracing::debug!("CAS validate url: {}", cas_url.as_str());

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
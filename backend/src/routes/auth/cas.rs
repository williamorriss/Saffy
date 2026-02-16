use std::collections::HashMap;
use serde::Deserialize;
use axum::{
    extract::{Query},
    response::{Redirect},
};

use http::{StatusCode};

use tower_sessions::Session;
use quick_xml::de::from_str;
use crate::{AppState, ORIGIN};
use axum::extract::State;
use crate::utils::ResultTrace;
use sqlx::{query_scalar, PgPool};
use url::Url;
use crate::routes::auth::CAS_ORIGIN;
use axum::extract::Path;
use uuid::Uuid;

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

impl CasServiceResponse {
    fn into_result(self) -> Result<AuthenticationSuccess, Option<AuthenticationFailure>> {
        self.authentication_success.ok_or(self.authentication_failure)
    }
}
#[axum::debug_handler]
pub async fn on_request_get(Path(state_id): Path<Uuid>, Query(query): Query<HashMap<String, String>>, session: Session, State(state): State<AppState>) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/cas endpoint");
    let redirect_url = state.auth_cache.get(&state_id).await.ok_or(StatusCode::BAD_REQUEST)?;
    tracing::debug!("Found redirect: {}", redirect_url);
    state.auth_cache.invalidate(&state_id).await;

    let xml = get_cas_response(&state_id, &query).await?;
    let username = parse_xml_response(&xml)?;
    let id = match get_user_id(&username, &state.db).await {
        Ok(id) => id,
        Err(err) => {match err {
            sqlx::Error::RowNotFound => new_user_id(&username, &state.db).await.server_err("Could not make new user")?,
            _ => Err(err).server_err("Critical db error whilst getting userID")?
        }}
    };

    session.insert("id", id)
        .await
        .server_err("Failed to insert userID into session")?;

    session.save()
        .await
        .server_err("Failed to save session")?;


    let redirect_origin = Url::parse_with_params(redirect_url.as_str(), &[("auth", "true")]).server_err("Failed to parse url")?;

    Ok(Redirect::to(redirect_origin.as_str()))
}

async fn new_user_id(username: &str, db: &PgPool) -> Result<i32, sqlx::Error> {
    query_scalar!("INSERT INTO users(username) VALUES($1) RETURNING id", username)
        .fetch_one(db)
        .await
}

async fn get_user_id(username: &str, db: &PgPool) -> Result<i32, sqlx::Error> {
    query_scalar!("SELECT id FROM users WHERE username = $1", username)
        .fetch_one(db)
        .await
}
fn parse_xml_response(body: &str) -> Result<String, StatusCode> {
   Ok(from_str::<CasServiceResponse>(body)
       .map_err(|_| {
           tracing::warn!("Failed to parse xml response");
           StatusCode::BAD_REQUEST
       })?
       .into_result()
       .map_err(|failure| {
           match failure {
               Some(fail) => tracing::warn!("CAS xml response returned authentication error:\n{:?}", fail.message),
               None => tracing::warn!("CAS xml response was empty or not parsed")
           }
           StatusCode::BAD_REQUEST
       })?
       .user)
}

async fn get_cas_response(auth_id: &Uuid, params: &HashMap<String, String>) -> Result<String, StatusCode> {
    let client = reqwest::Client::new();
    let ticket = params.get("ticket").ok_or(StatusCode::BAD_REQUEST)?;

    let cas_url = Url::parse_with_params(
        &format!("{}/serviceValidate", CAS_ORIGIN),
        &[
            ("service", &format!("{}/auth/cas/{}",ORIGIN, auth_id.to_string())),
            ("ticket", ticket),
        ]).server_err("Could not make CAS URL")?;

    tracing::debug!("CAS validate url: {}", cas_url.as_str());

    client.get(cas_url)
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?
        .text()
        .await
        .server_err("Failed to get cas response")
}
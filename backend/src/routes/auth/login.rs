use std::collections::HashMap;
use axum::extract::Query;
use axum::response::Redirect;
use http::StatusCode;
use url::Url;
use crate::{AppState, ORIGIN};
use crate::routes::auth::CAS_ORIGIN;
use crate::utils::ResultTrace;
use uuid;
use axum::extract::State;


#[axum::debug_handler]
pub async fn on_request_get(Query(query): Query<HashMap<String, String>>, State(state): State<AppState>) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/login endpoint");
    let redirect = Url::parse(&query.get("redirect").ok_or_else(|| StatusCode::BAD_REQUEST)?).server_err("Could not parse redirect URL")?;
    let auth_id = uuid::Uuid::new_v4();

    let cas_url = Url::parse_with_params(
        &format!("{}/login",CAS_ORIGIN),
        &[("service", format!("{}/auth/cas/{}", ORIGIN, auth_id))],
    ).server_err("Failed to create cas login url")?;

    state.auth_cache.insert(auth_id, redirect).await;
    Ok(Redirect::permanent(cas_url.as_str()))
}
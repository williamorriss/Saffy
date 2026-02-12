use axum::extract::State;
use tower_sessions::Session;
use http::{StatusCode};
use axum::response::Redirect;
use auth::AuthenticatedUser;
use crate::AppState;
use crate::routes::auth;
use crate::utils::ResultTrace;

pub async fn on_request_post(AuthenticatedUser(_): AuthenticatedUser, session: Session, State(state): State<AppState>) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/logout endpoint");
    session.flush()
        .await
        .server_err("Failed to flush session")?;

    let logout_url = state.config.cas.origin
        .join("logout")
        .server_err("Failed to make cas logout uri")?;

    Ok(Redirect::permanent(logout_url.as_str()))
}
use tower_sessions::Session;
use http::StatusCode;
use axum::response::Redirect;
use crate::routes::auth::CAS_ORIGIN;
use crate::routes::AuthenticatedUser;
use crate::utils::ResultTrace;

pub async fn on_request_post(AuthenticatedUser(_): AuthenticatedUser, session: Session) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/logout endpoint");
    session.flush()
        .await
        .server_err("Failed to flush session")?;

    Ok(Redirect::permanent(&format!("{}/logout", CAS_ORIGIN)))
}
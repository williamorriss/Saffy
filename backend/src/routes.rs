use axum::response::{IntoResponse, Response};
use axum::{Json, Router};
use http::request::Parts;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use tower_sessions::Session;
use crate::AppState;
use crate::utils::ResultTrace;

pub mod auth;
pub mod api;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct AuthenticatedUser(pub User);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct User {
    pub(crate) id: i32,
}

impl IntoResponse for AuthenticatedUser {
    fn into_response(self) -> Response {
        Json(self).into_response()
    }
}

impl<S> axum::extract::FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let session = Session::from_request_parts(parts, state)
            .await
            .map_err(|_| (StatusCode::UNAUTHORIZED).into_response())?;

        let id = session
            .get::<i32>("id")
            .await
            .server_err("Failed to get session")
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to get session").into_response())?
            .ok_or_else(|| {
                tracing::warn!("No username found for session");
                StatusCode::UNAUTHORIZED.into_response()
            })?;

        Ok(AuthenticatedUser(User { id }))
    }
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .merge(api::routes())
        .merge(auth::routes())
}
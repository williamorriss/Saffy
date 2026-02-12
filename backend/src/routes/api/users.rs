
use crate::routes::auth::AuthenticatedUser;
use axum::Json;
use axum::http::StatusCode;
use crate::models::Username;

#[axum::debug_handler]
pub async fn on_request_get_me(AuthenticatedUser(user): AuthenticatedUser) -> Json<Username> {
    Json(Username { username: user.username })
}
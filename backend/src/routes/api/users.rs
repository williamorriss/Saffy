
use crate::routes::auth::AuthenticatedUser;
use axum::Json;
use axum::http::StatusCode;
use sqlx::PgPool;
use crate::AppState;
use crate::models::Username;
use crate::utils::ResultTrace;
use axum::extract::State;

#[axum::debug_handler]
pub async fn on_request_get_me(AuthenticatedUser(user): AuthenticatedUser,  State(state): State<AppState>) -> Result<Json<Username>, StatusCode> {
    let username = get_username(user.id, &state.db)
        .await
        .server_err("Could not make new user")?;

    Ok(Json(Username { username: username }))
}

async fn get_username(id: i32, db: &PgPool) -> Result<String, sqlx::Error> {
    sqlx::query_scalar!("SELECT username FROM users WHERE id = $1", id)
        .fetch_one(db)
        .await
}
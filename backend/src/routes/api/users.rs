use crate::routes::AuthenticatedUser;
use crate::models::user::User;
use axum::Json;
use axum::http::StatusCode;
use sqlx::PgPool;
use crate::AppState;
use crate::utils::ResultTrace;
use axum::extract::State;

#[axum::debug_handler]
pub async fn on_request_get_me(AuthenticatedUser(user): AuthenticatedUser,  State(state): State<AppState>) -> Result<Json<User>, StatusCode> {
    Ok(Json(get_user(user.id, &state.db)
        .await
        .server_err("Could not make new user")?))
}

async fn get_user(id: i32, db: &PgPool) -> Result<User, sqlx::Error> {
    sqlx::query_as!(User, "SELECT id,username,created_at FROM users WHERE id = $1", id)
        .fetch_one(db)
        .await
}
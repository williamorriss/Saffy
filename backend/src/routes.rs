use axum::Router;
use crate::AppState;

pub mod auth;
pub mod api;

pub fn routes() -> Router<AppState> {
    Router::new()
        .merge(api::routes())
        .merge(auth::routes())
}
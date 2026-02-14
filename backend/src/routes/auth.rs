mod login;
mod logout;
mod cas;

use axum::routing::any;
use axum::Router;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/login", any(login::on_request_get))
        .route("/auth/cas", any(cas::on_request_get))
        .route("/auth/logout", any(logout::on_request_post))
}
mod login;
mod logout;
mod cas;

use axum::routing::any;


use axum::Router;
use crate::AppState;
pub const CAS_ORIGIN: &str = "https://auth.bath.ac.uk";

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/login", any(login::on_request_get))
        .route("/auth/cas/{auth_id}", any(cas::on_request_get))
        .route("/auth/logout", any(logout::on_request_post))
}
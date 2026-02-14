mod issues;

use axum::routing::get;

mod users;

use axum::Router;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/users/me", get(users::on_request_get_me))
        .nest("/api/issues", issues::routes())
}
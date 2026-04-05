pub mod issues;
pub mod auth;

use utoipa_axum::router::OpenApiRouter;
use issues::routes as issue_routes;
use auth::routes as auth_routes;
use crate::AppState;

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .merge(auth_routes())
        .merge(issue_routes())
}
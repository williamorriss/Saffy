pub mod issues;
pub mod auth;
pub mod locations;
mod tags;

use utoipa_axum::router::OpenApiRouter;
use issues::routes as issue_routes;
use auth::routes as auth_routes;
use locations::routes as locations_routes;
use crate::AppState;

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .merge(auth_routes())
        .merge(issue_routes())
        .merge(locations_routes())
}
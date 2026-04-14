pub mod issues;
pub mod auth;
pub mod locations;
pub mod tags;
use http::StatusCode;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;
use issues::routes as issue_routes;
use auth::routes as auth_routes;
use locations::routes as locations_routes;
use tags::routes as tags_routes;
use crate::AppState;

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(health))
        .merge(auth_routes())
        .merge(issue_routes())
        .merge(locations_routes())
        .merge(tags_routes())
}

#[utoipa::path(
    get,
    path = "/api/health",
    responses(
        (status = 200, description = "I'm OK"),
    )
)]
#[axum::debug_handler]
pub async fn health() -> StatusCode {
    StatusCode::OK
}
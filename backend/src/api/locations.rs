use axum::extract::State;
use axum::Json;
use serde::Serialize;
use sqlx::query_as;
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;
use sqlx::FromRow;
use uuid::Uuid;
use crate::AppState;
use crate::error::AppError;

#[derive(Debug, FromRow, Serialize, ToSchema)]
pub struct LocationSchema {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub department: String,
    pub url: String
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_locations))
}

#[utoipa::path(
    get,
    path = "/api/locations",
    responses(
        (status = 200, description = "All api.issues", body = Vec<LocationSchema>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not fetch tags")
    ),
)]
#[axum::debug_handler]
pub async fn get_locations(State(state): State<AppState>) -> Result<Json<Vec<LocationSchema>>, AppError> {
    query_as!(LocationSchema,
        r#"SELECT id, name, description, department, url FROM locations"#
    ).fetch_all(&state.db).await
        .map(Json)
        .map_err(AppError::from)

}
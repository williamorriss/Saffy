use axum::extract::State;
use axum::Json;
use serde::Serialize;
use sqlx::query_as;
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;
use uuid::Uuid;
use crate::AppState;
use crate::error::AppError;

#[derive(Debug, Serialize, ToSchema)]
pub struct LocationView {
    id: Uuid,
    name: String,
    description: String,
}

#[derive(sqlx::FromRow)]
struct LocationRow {
    id: Uuid,
    name: String,
    description: String,
}

impl From<LocationRow> for LocationView {
    fn from(row: LocationRow) -> Self {
        LocationView {
            id: row.id,
            name: row.name,
            description: row.description
        }
    }
}


pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_locations))
}

#[utoipa::path(
    get,
    path = "/api/locations",
    responses(
        (status = 200, description = "All api.issues", body = Vec<LocationView>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
pub async fn get_locations(State(state): State<AppState>) -> Result<Json<Vec<LocationView>>, AppError> {
    query_as!(LocationRow, r#"SELECT id, name, description FROM locations"#)
        .fetch_all(&state.db)
        .await
        .map(|rows| Json(rows.into_iter().map(LocationView::from).collect()))
        .map_err(AppError::from)

}
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
pub struct TagSchema {
    id: Uuid,
    name: String,
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_tags))
}

#[utoipa::path(
    get,
    path = "/api/tags",
    responses(
        (status = 200, description = "All tags", body = Vec<TagSchema>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not fetch tags")
    ),
)]
#[axum::debug_handler]
pub async fn get_tags(State(state): State<AppState>) -> Result<Json<Vec<TagSchema>>, AppError> {
    query_as!(TagSchema,
        r#"SELECT id, name FROM tags"#
    ).fetch_all(&state.db).await
        .map(Json)
        .map_err(AppError::from)

}
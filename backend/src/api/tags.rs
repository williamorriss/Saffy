use axum::extract::State;
use axum::Json;
use serde::Serialize;
use sqlx::{query_as, PgPool};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;
use sqlx::FromRow;
use crate::AppState;
use crate::error::AppError;

#[derive(Debug, FromRow, Serialize, ToSchema)]
pub struct TagSchema {
    pub name: String,
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
#[axum::debug_handler(state = AppState)]
pub async fn get_tags(State(db): State<PgPool>) -> Result<Json<Vec<TagSchema>>, AppError> {
    query_as!(TagSchema,
        r#"SELECT name FROM tags"#
    ).fetch_all(&db).await
        .map(Json)
        .map_err(AppError::from)

}
use axum::extract::State;
use axum::Json;
use sqlx::query;
use crate::AppState;
use utoipa_axum::routes;

use serde::{Serialize, Deserialize};
use chrono::{DateTime, NaiveDateTime, Utc};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;
use crate::error::AppError;
use uuid::Uuid;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub id: Uuid,
    pub issue_id: Uuid,
    pub reporter: Uuid,
    pub description: Option<String>,
    pub opened_at: DateTime<Utc>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub id: i32,
    pub latitude: f32,
    pub longitude: f32,
    pub level: i32,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateIssue {
    pub description: Option<String>,
    pub location_id: i32,
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_issues))
}

#[utoipa::path(
    get,
    path = "/api/reports",
    responses(
        (status = 200, description = "List of entries", body = Vec<Report>),
        (status = NOT_FOUND, description = "No issues"),
        (status = INTERNAL_SERVER_ERROR, description = "Internal server error")
    ),
    params(
        ("redirect" = String, Query, description = "Url to redirect to after login")
    )
)]
#[axum::debug_handler]
async fn get_issues(State(state): State<AppState>) -> Result<Json<Vec<Report>>, AppError> {
    let db_issues = query!("
        SELECT id, issue_id, reporter, description, created_at, closed_at
        FROM reports ORDER BY reports.created_at")
        .fetch_all(&state.db)
        .await
        .map_err(|err| match err {
            sqlx::Error::RowNotFound => AppError::NotFound("No entries found".to_string()),
            _ => AppError::Internal(err.into())
        })?;

    let issues = db_issues.into_iter()
        .map(|row| {
            Report {
                id: row.id,
                issue_id: row.issue_id,
                reporter: row.reporter,
                description: row.description,
                opened_at: row.created_at.and_utc(),
                closed_at: row.closed_at.map(|t: NaiveDateTime| t.and_utc()),
            }
        })
        .collect();

    Ok(Json(issues))
}

// #[utoipa::path(
//     post,
//     path = "/api/issues",
//     responses(
//         (status = 200, description = "Made new issue"),
//         (status = INTERNAL_SERVER_ERROR, description = "Internal server error")
//     ),
//     request_body(content = CreateIssue, content_type = "application/json"),
// )]
// #[axum::debug_handler]
// async fn on_request_post(
//     AuthSession(_): AuthSession,
//     State(state): State<AppState>,
//     Json(new_issue): Json<CreateIssue>
// ) -> Result<StatusCode,AppError> {
//     tracing::info!("Creating new issue: {:?}", new_issue.description);
//     let mut transaction = (state.db).begin()
//         .await
//         .map_err(AppError::from)?;
//
//     // let location_id: i32 = make_location(&new_issue.location, &mut transaction)
//     //     .await
//     //     .server_err("Failed to create location")?;
//
//     make_issues(new_issue.location_id, new_issue, &mut transaction)
//         .await
//         .map_err(AppError::from)?;
//
//     transaction.commit()
//         .await
//         .map_err(AppError::from)?;
//
//     Ok(StatusCode::CREATED)
// }

// async fn make_location(location: &CreateLocation, transaction: &mut Transaction<'_, Postgres>) -> Result<i32, sqlx::Error> {
//     query_scalar!("INSERT INTO locations(longitude, latitude, level, description) VALUES ($1, $2, $3, $4) RETURNING id",
//         location.longitude,
//         location.latitude,
//         location.level,
//         location.description)
//         .fetch_one(transaction.as_mut())
//         .await
// }

// async fn make_issues(location_id: i32, new_issue: CreateIssue, transaction: &mut Transaction<'_, Postgres>) -> Result<PgQueryResult, sqlx::Error> {
//     query!("INSERT INTO issues(description, location_id) VALUES ($1, $2)", new_issue.description, location_id)
//         .execute(transaction.as_mut())
//         .await
// }
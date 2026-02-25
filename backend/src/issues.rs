use axum::extract::{Path, State};
use axum::Json;
use sqlx::{query, query_scalar, PgPool, Postgres, Transaction};
use crate::{AppState, AuthSession};
use utoipa_axum::routes;

use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use http::StatusCode;
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
    pub created_at: DateTime<Utc>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateReport {
    pub issue_id: Uuid,
    description: String,
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
    pub title: Option<String>,
    pub description: Option<String>,
    pub location_uuid: Uuid,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Issue {
    pub id: Uuid,
    pub title: Option<String>,
    pub description: Option<String>,
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(post_issue, get_issues))
        .routes(routes!(post_report, get_issue))
}

#[utoipa::path(
    post,
    path = "/api/issues",
    request_body = CreateIssue,
    responses(
        (status = 201, description = "New issue created"),
        (status = 500, description = "Failed to create new issue")
    ),
)]
#[axum::debug_handler]
async fn post_issue(
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
    Json(new_issue): Json<CreateIssue>) -> Result<StatusCode, AppError> {
    tracing::info!("Creating new issue: {:?}", new_issue.description);
    let mut transaction = state.db.begin().await?;
    let issue_id = make_issue(&mut transaction, &new_issue).await?;
    let _report_uuid = make_initial_report(&mut transaction, session.id, issue_id, &new_issue).await?;
    transaction.commit().await?;
    Ok(StatusCode::CREATED)
}

async fn make_issue(transaction: &mut Transaction<'_, Postgres>, new_issue: &CreateIssue) -> Result<Uuid, sqlx::Error> {
    query_scalar!(r#"INSERT INTO issues (title, description,  location_id) VALUES ($1, $2, $3) RETURNING id"#,
        new_issue.title,
        new_issue.description,
        new_issue.location_uuid
    ).fetch_one(transaction.as_mut()).await
}

async fn make_initial_report(transaction: &mut Transaction<'_, Postgres>, user_uuid: Uuid, issue_uuid: Uuid, issue: &CreateIssue) -> Result<Uuid, sqlx::Error> {
    query_scalar!(r#"INSERT INTO reports (issue_id, reporter_id, description) VALUES ($1, $2, $3) RETURNING id"#,
        issue_uuid,
        user_uuid,
        issue.description
    ).fetch_one(transaction.as_mut()).await
}

#[utoipa::path(
    get,
    path = "/api/issues",
    responses(
        (status = 200, description = "All issues", body = Vec<Issue>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
async fn get_issues(State(state): State<AppState>) -> Result<Json<Vec<Issue>>, AppError> {
    let issues = get_all_issues(&state.db).await?;
    Ok(Json(issues))
}

async fn get_all_issues(db: &PgPool) -> Result<Vec<Issue>, sqlx::Error>  {
   query!(r#"
        SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues
        LEFT JOIN (
            SELECT issue_id, MIN(created_at) as earliest_report
            FROM reports
            GROUP BY issue_id
        ) earliest_reports ON issues.id = earliest_reports.issue_id
        ORDER BY earliest_reports.earliest_report DESC
   "#).fetch_all(db)
       .await
       .map(|rows| {
           rows.into_iter().map(|row| {
               Issue {
                   id: row.id,
                   title: row.title,
                   description: row.description,
               }
           }).collect()
       })
}

#[utoipa::path(
    get,
    path = "/api/issues/{id}",
    params(
        ("id" = Uuid, Path, description = "Issue uuid")
    ),
    responses(
        (status = 200, description = "All reports for issue", body = Vec<Report>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
async fn get_issue(Path(issue_id): Path<Uuid>, State(state): State<AppState>) -> Result<Json<Vec<Report>>, AppError> {
    let reports = get_all_reports(issue_id, &state.db).await?;
    Ok(Json(reports))
}

async fn get_all_reports(issue_id: Uuid, db: &PgPool) -> Result<Vec<Report>, sqlx::Error>  {
    query!(r#"
            SELECT id, reporter_id, description, created_at, closed_at FROM reports WHERE issue_id = $1
            ORDER BY created_at
        "#, issue_id).fetch_all(db)
        .await
        .map(|rows| {
            rows.into_iter().map(|row| {
                Report {
                    id: row.id,
                    issue_id,
                    reporter: row.reporter_id,
                    description: row.description,
                    created_at: row.created_at.and_utc(),
                    closed_at: row.closed_at.map(|time| time.and_utc()),
                }
            }).collect()
        })
}

#[utoipa::path(
    post,
    path = "/api/issues/{id}",
    params(("id" = Uuid, Path, description = "Issue uuid")),
    request_body = CreateReport,
    responses(
        (status = 201, description = "Created new report"),
        (status = 500, description = "Failed to create new report")
    ),
)]
#[axum::debug_handler]
async fn post_report(AuthSession(session): AuthSession, State(state): State<AppState>, Path(issue_id): Path<Uuid>, Json(report): Json<CreateReport> ) -> Result<StatusCode, AppError> {
    let report_id = create_report(issue_id, session.id, report, &state.db).await?;
    tracing::debug!("Created report {:?}", report_id);
    Ok(StatusCode::CREATED)
}

async fn create_report(issue_id: Uuid, reporter_id: Uuid, report: CreateReport, db: &PgPool) -> Result<Uuid, sqlx::Error> {
    query_scalar!("INSERT INTO reports (issue_id, reporter_id, description) VALUES ($1, $2, $3) RETURNING id",
        issue_id,
        reporter_id,
        report.description
    ).fetch_one(db).await
}
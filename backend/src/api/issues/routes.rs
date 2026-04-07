use axum::extract::{Path, State};
use axum::Json;
use sqlx::{query_as, query_file_as};
use crate::api::auth::AuthSession;
use crate::AppState;
use utoipa_axum::routes;
use axum::extract::Query;
use utoipa_axum::router::OpenApiRouter;
use crate::error::AppError;
use uuid::Uuid;
use super::models::{IssueSchema, CreateIssue, IssueQuery, IssueQueryShow, IssueQueryOrder, ReportSchema, CreateIssueResponse, CreateReport};

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_issues))
        .routes(routes!(get_issue, post_issue))
        .routes(routes!(post_report))
}

#[utoipa::path(
    post,
    path = "/api/issues",
    request_body = CreateIssue,
    responses(
        (status = 201, description = "New issue created", body=CreateIssueResponse),
        (status = 500, description = "Failed to create new issue")
    ),
)]
#[axum::debug_handler]
async fn post_issue(
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
    Json(new_issue): Json<CreateIssue>
) -> Result<Json<CreateIssueResponse>, AppError> {
    let mut transaction = state.db.begin().await?;
    let issue = query_as!(
        IssueSchema,
        r#"INSERT INTO issues (title, description,  location_id) VALUES ($1, $2, $3) RETURNING id, title, location_id, description"#,
        new_issue.title,
        new_issue.description,
        new_issue.location_uuid
    ).fetch_one(transaction.as_mut()).await?;

    let report = query_as!(
        ReportSchema,
        r#"INSERT INTO reports (issue_id, reporter_id, description) VALUES ($1, $2, $3) RETURNING id, issue_id, reporter_id, description, created_at, closed_at"#,
        issue.id,
        session.id,
        new_issue.description
    ).fetch_one(transaction.as_mut()).await?;

    transaction.commit().await?;
    Ok(Json(CreateIssueResponse { issue, report}))
}

#[utoipa::path(
    get,
    path = "/api/issues",
    params(IssueQuery),
    responses(
        (status = 200, description = "All api.issues", body = Vec<IssueSchema>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
async fn get_issues(request_query: Query<IssueQuery>, State(state): State<AppState>) -> Result<Json<Vec<IssueSchema>>, AppError> {
    let issue_query = request_query.0;
    let (show_open, show_closed) = match issue_query.show {
        IssueQueryShow::Closed => (false, true),
        IssueQueryShow::Open => (true, false),
        IssueQueryShow::All => (true, true),
    };
    match issue_query.ordering {
        IssueQueryOrder::NewestFirst => query_file_as!(
                IssueSchema,
                "sql/newest_issues.sql",
                show_open,
                show_closed,
                issue_query.date_before,
                issue_query.date_after,
            ).fetch_all(&state.db).await,
        IssueQueryOrder::Relevance => query_file_as!(
                IssueSchema,
                "sql/relevant_issues.sql",
                issue_query.search.to_owned().unwrap_or("".to_string()),
                show_open,
                show_closed,
                issue_query.date_before,
                issue_query.date_after,
            ).fetch_all(&state.db).await,
        _ => todo!(),
    }
        .map(Json)
        .map_err(AppError::from)
}

#[utoipa::path(
    get,
    path = "/api/issues/{id}",
    params(
        ("id" = Uuid, Path, description = "Issue uuid")
    ),
    responses(
        (status = 200, description = "All reports for issue", body = Vec<ReportSchema>),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
async fn get_issue(Path(issue_id): Path<Uuid>, State(state): State<AppState>) -> Result<Json<Vec<ReportSchema>>, AppError> {
    query_as!(
        ReportSchema,
        r#"
            SELECT id, issue_id, reporter_id, description, created_at, closed_at FROM reports WHERE issue_id = $1
            ORDER BY created_at
        "#,
        issue_id
    ).fetch_all(&state.db).await
        .map(Json)
        .map_err(AppError::from)
}

#[utoipa::path(
    post,
    path = "/issues/{id}",
    params(("id" = Uuid, Path, description = "Issue uuid")),
    request_body = CreateReport,
    responses(
        (status = 201, description = "Created new report", body=ReportSchema),
        (status = 500, description = "Failed to create new report")
    ),
)]
#[axum::debug_handler]
async fn post_report(
    AuthSession(session): AuthSession,
    State(state): State<AppState>,
    Path(issue_id): Path<Uuid>,
    Json(new_report): Json<CreateReport>
) -> Result<Json<ReportSchema>, AppError> {
    query_as!(
        ReportSchema,
        r#"INSERT INTO reports (issue_id, reporter_id, description) VALUES ($1, $2, $3) RETURNING id, issue_id, reporter_id, description, created_at, closed_at"#,
        issue_id,
        session.id,
        new_report.description
    ).fetch_one(&state.db).await
        .map(Json)
        .map_err(AppError::from)
}
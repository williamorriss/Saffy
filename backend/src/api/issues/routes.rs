use axum::extract::{Path, State};
use axum::Json;
use sqlx::{query, query_as, query_file_as};
use crate::api::auth::AuthSession;
use crate::AppState;
use utoipa_axum::routes;
use axum::extract::Query;
use utoipa_axum::router::OpenApiRouter;
use crate::error::AppError;
use uuid::Uuid;
use super::models::{IssueSchema, CreateIssue, IssueQuery, IssueQueryShow, IssueQueryOrder, ReportSchema, CreateIssueResponse, CreateReport};

#[derive(Debug, sqlx::FromRow)]
pub struct IssueRow {
    pub issue_id: Uuid,
    pub issue_title: Option<String>,
    pub issue_description: Option<String>,
    // locations
    pub location_id: Option<Uuid>,
    pub location_name: Option<String>,
    pub location_department: Option<String>,
    pub location_url: Option<String>,
    pub location_description: Option<String>,
    // tags
    pub tags: Vec<String>,
}

pub fn routes() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(routes!(get_issues))
        .routes(routes!(get_issue))
        .routes(routes!(post_report))
        .routes(routes!(post_issue))
        .routes(routes!(get_reports))
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
    let issue_id: Uuid = query!(
        r#"INSERT INTO issues (title, description, location_id) VALUES ($1, $2, $3) RETURNING id"#,
        new_issue.title,
        new_issue.description,
        new_issue.location_id
    ).fetch_one(transaction.as_mut()).await?.id;

    query!(r#"
        WITH tag_ids AS (SELECT id FROM tags WHERE name = ANY($1::text[]))
        INSERT INTO issue_tags(issue_id, tag_id)
        SELECT $2, id FROM tag_ids
        "#,
        &new_issue.tag_names[..],
        issue_id
    ).execute(transaction.as_mut()).await?;

    let report = query_as!(
        ReportSchema,
        r#"INSERT INTO reports (issue_id, reporter_id, description) VALUES ($1, $2, $3) RETURNING id, issue_id, reporter_id, description, created_at, closed_at"#,
        issue_id,
        session.id,
        new_issue.description
    ).fetch_one(transaction.as_mut()).await?;

    transaction.commit().await?;

    let issue = query_as!(
        IssueRow,
        r#"SELECT issue_id AS "issue_id!", issue_title, issue_description, location_id, location_name, location_department, location_url, location_description, tags AS "tags!" FROM full_issues fi WHERE issue_id = $1"#,
        issue_id
    ).fetch_one(&state.db).await.map(IssueSchema::from)?;

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
async fn get_issues(Query(issue_query): Query<IssueQuery>, State(state): State<AppState>) -> Result<Json<Vec<IssueSchema>>, AppError> {
    let (show_open, show_closed) = match issue_query.show {
        IssueQueryShow::Closed => (false, true),
        IssueQueryShow::Open => (true, false),
        IssueQueryShow::All => (true, true),
    };
    Ok(Json(match issue_query.ordering {
        IssueQueryOrder::NewestFirst => query_file_as!(
            IssueRow,
            "sql/newest.sql",
            issue_query.location_id,
            &issue_query.tags[..],
            show_open,
            show_closed,
            issue_query.date_before,
            issue_query.date_after
        ).fetch_all(&state.db).await,
        IssueQueryOrder::Relevance => query_file_as!(
            IssueRow,
            "sql/relevant.sql",
            issue_query.location_id,
            &issue_query.tags[..],
            show_open,
            show_closed,
            issue_query.date_before,
            issue_query.date_after,
            issue_query.search.to_owned().unwrap_or("".to_string()),
        ).fetch_all(&state.db).await,
        _ => todo!(),
    }?
        .into_iter()
        .map(IssueSchema::from)
        .collect::<Vec<_>>()))
}

#[utoipa::path(
    get,
    path = "/api/issues/{id}",
    params(
        ("id" = Uuid, Path, description = "Issue uuid")
    ),
    responses(
        (status = 200, description = "All reports for issue", body = IssueSchema),
        (status = INTERNAL_SERVER_ERROR, description = "Could not make new issue")
    ),
)]
#[axum::debug_handler]
async fn get_issue(Path(issue_id): Path<Uuid>, State(state): State<AppState>) -> Result<Json<IssueSchema>, AppError> {
    query_as!(
        IssueRow,
        // ! operator used since issue id never null (primary key) and tags never null (return empty list by default)
        r#"SELECT issue_id AS "issue_id!", issue_title, issue_description, location_id, location_name, location_department, location_url, location_description, tags AS "tags!" FROM full_issues fi WHERE issue_id = $1"#,
        issue_id
    ).fetch_one(&state.db).await
        .map(IssueSchema::from)
        .map(Json)
        .map_err(AppError::from)
}

#[utoipa::path(
    post,
    path = "/api/issues/{id}/reports",
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
    if new_report.description == "" {
        return Err(AppError::BadRequest("empty description".to_string()));
    }

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


#[utoipa::path(
    get,
    path = "/api/issues/{id}/reports",
    params(("id" = Uuid, Path, description = "Issue uuid")),
    responses(
        (status = 201, description = "Created new report", body=Vec<ReportSchema>),
        (status = 500, description = "Failed to create new report")
    ),
)]
#[axum::debug_handler]
async fn get_reports(
    AuthSession(_session): AuthSession,
    State(state): State<AppState>,
    Path(issue_id): Path<Uuid>,
) -> Result<Json<Vec<ReportSchema>>, AppError> {
    query_as!(
        ReportSchema,
        r#"SELECT id, issue_id, reporter_id, description, created_at, closed_at FROM reports WHERE issue_id = $1 ORDER BY created_at"#,
        issue_id,
    ).fetch_all(&state.db).await
        .map(Json)
        .map_err(AppError::from)
}
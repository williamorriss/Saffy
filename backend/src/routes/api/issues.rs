use axum::extract::State;
use axum::Router;
use axum::Json;
use axum::routing::{get, post};
use http::StatusCode;
use sqlx::{query, Postgres, Transaction};
use crate::AppState;
use crate::models::issues::{Location, Issue, CreateIssue};
use crate::utils::ResultTrace;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(on_request_get))
        .route("/", post(on_request_post))
}

#[axum::debug_handler]
async fn on_request_get(State(state): State<AppState>) -> Result<Json<Vec<Issue>>, StatusCode> {
    let db_issues = query!("
        SELECT
            issues.id,
            issues.description As issue_description,
            issues.opened_at,
            issues.closed_at,
            locations.id As location_id,
            locations.latitude,
            locations.longitude,
            locations.level,
            locations.description AS location_description
        FROM issues
        INNER JOIN locations ON issues.location_id = locations.id
        ORDER BY issues.opened_at")
        .fetch_all(&state.db)
        .await
        .server_err("Failed to get issues")?;

    let issues = db_issues.into_iter()
        .map(|row| {Issue {
            id: row.id,
            description: row.issue_description,
            opened_at: row.opened_at,
            closed_at: row.closed_at,
            location: Location {
                id: row.location_id,
                latitude: row.latitude,
                longitude: row.longitude,
                level: row.level,
                description: row.location_description
            },
        }})
        .collect();

    Ok(Json(issues))
}


#[axum::debug_handler]
async fn on_request_post(State(state): State<AppState>, Json(new_issue): Json<CreateIssue>,) -> Result<StatusCode,StatusCode> {
    tracing::info!("Creating new issue: {:?}", new_issue.description);
    let mut transaction = (state.db).begin()
        .await
        .server_err("Failed to create transaction")?;

    // let location_id: i32 = make_location(&new_issue.location, &mut transaction)
    //     .await
    //     .server_err("Failed to create location")?;

    make_issues(new_issue.location_id, new_issue, &mut transaction).await.server_err("Failed to create issue")?;

    transaction.commit()
        .await
        .server_err("Failed to commit transaction")?;

    Ok(StatusCode::CREATED)
}

// async fn make_location(location: &CreateLocation, transaction: &mut Transaction<'_, Postgres>) -> Result<i32, sqlx::Error> {
//     query_scalar!("INSERT INTO locations(longitude, latitude, level, description) VALUES ($1, $2, $3, $4) RETURNING id",
//         location.longitude,
//         location.latitude,
//         location.level,
//         location.description)
//         .fetch_one(transaction.as_mut())
//         .await
// }

async fn make_issues(location_id: i32, new_issue: CreateIssue, transaction: &mut Transaction<'_, Postgres>) -> Result<(), sqlx::Error> {
    query!("INSERT INTO issues(description, location_id) VALUES ($1, $2)", new_issue.description, location_id)
        .execute(transaction.as_mut())
        .await
        .map(|_| ())
}
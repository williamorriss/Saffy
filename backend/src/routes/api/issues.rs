use axum::extract::State;
use axum::Router;
use axum::Json;
use axum::routing::{get, post};
use http::StatusCode;
use sqlx::{query, query_as, query_scalar, Postgres, Transaction};
use crate::AppState;
use crate::models::issues::{IssueThumbnail, NewIssue, NewLocation};
use crate::utils::ResultTrace;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(on_request_get))
        .route("/", post(on_request_post))
}

#[axum::debug_handler]
async fn on_request_get(State(state): State<AppState>) -> Result<Json<Vec<IssueThumbnail>>, StatusCode> {
    let issues = query_as!(IssueThumbnail, "SELECT id, description, opened_at FROM issues ORDER BY opened_at")
        .fetch_all(&state.db)
        .await
        .server_err("Failed to get issues")?;

    Ok(Json(issues))
}

#[axum::debug_handler]
async fn on_request_post(State(state): State<AppState>, Json(new_issue): Json<NewIssue>,) -> Result<StatusCode,StatusCode> {
    let mut transaction = (&state.db).begin()
        .await
        .server_err("Failed to create transaction")?;


    let location_id: i32 = make_location(&new_issue.location, &mut transaction)
        .await
        .server_err("Failed to create location")?;

    make_issues(location_id, new_issue, &mut transaction).await.server_err("Failed to create issue")?;

    transaction.commit()
        .await
        .server_err("Failed to commit transaction")?;

    Ok(StatusCode::CREATED)
}

async fn make_location(location: &NewLocation, transaction: &mut Transaction<'_, Postgres>) -> Result<i32, sqlx::Error> {
    query_scalar!("INSERT INTO locations(longitude, latitude, level, description) VALUES ($1, $2, $3, $4) RETURNING id",
        location.longitude,
        location.latitude,
        location.level,
        location.description)
        .fetch_one(transaction.as_mut())
        .await
}

async fn make_issues(location_id: i32, new_issue: NewIssue, transaction: &mut Transaction<'_, Postgres>) -> Result<(), sqlx::Error> {
    query!("INSERT INTO issues(description, location_id) VALUES ($1, $2)", new_issue.description, location_id)
        .execute(transaction.as_mut())
        .await
        .map(|_| ())
}
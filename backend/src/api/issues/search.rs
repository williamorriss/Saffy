use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{query, query_file_as, PgPool};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;
use crate::error::AppError;
use crate::api::issues::{IssueView, ReportView};
use crate::api::issues::search::IssueQueryOrder::{NewestFirst, OldestFirst, RecentlyUpdated, Relevance};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(try_from = "String")]
pub enum IssueQueryOrder {
    OldestFirst,
    NewestFirst,
    Relevance,
    RecentlyUpdated,
}

impl TryFrom<String> for IssueQueryOrder {
    type Error = AppError;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.to_lowercase().as_str() {
            "oldestfirst" => Ok(OldestFirst),
            "newestfirst" => Ok(NewestFirst),
            "relevance" => Ok(Relevance),
            "recentlyupdated" => Ok(RecentlyUpdated),
            _ => Err(AppError::BadRequest("Invalid `order` parameter".to_string())),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(try_from = "String")]
pub enum IssueQueryShow {
    Open,
    Closed,
    All
}

impl TryFrom<String> for IssueQueryShow {
    type Error = AppError;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.to_lowercase().as_str() {
            "open" => Ok(IssueQueryShow::All),
            "closed" => Ok(IssueQueryShow::Closed),
            "all" => Ok(IssueQueryShow::Open),
            _ => Err(AppError::BadRequest("Invalid `show` parameter".to_string())),
        }
    }
}

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query, rename_all = "camelCase")]
#[serde(default)]
#[serde(rename_all = "camelCase")]
pub struct IssueQuery {
    search: Option<String>,
    #[param(required = false)]
    show: IssueQueryShow,
    location: Option<Uuid>,
    date_after: Option<DateTime<Utc>>,
    date_before: Option<DateTime<Utc>>,
    #[param(required = false)]
    ordering: IssueQueryOrder,
}

// Used so different branches of query eval to same record type
#[derive(sqlx::FromRow)]
struct IssueRow {
    id: Uuid,
    title: Option<String>,
    description: Option<String>,
    location_id: Option<Uuid>,
}

impl From<IssueRow> for IssueView {
    fn from(row: IssueRow) -> Self {
        IssueView {
            id: row.id,
            title: row.title,
            description: row.description,
        }
    }
}

impl Default for IssueQuery {
    fn default() -> Self {
        Self {
            search: None,
            location: None,
            show: IssueQueryShow::Open,
            date_after: None,
            date_before: None,
            ordering: NewestFirst,
        }
    }
}

impl IssueQuery {
    pub async fn query(self, db: &PgPool) -> Result<Vec<IssueView>, AppError> {
        let (show_open, show_closed) = match self.show {
            IssueQueryShow::Closed => (false, true),
            IssueQueryShow::Open => (true, false),
            IssueQueryShow::All => (true, true),
        };
        let date_before = self.date_before.map(|date| date.naive_utc());
        let date_after = self.date_after.map(|date| date.naive_utc());
        let records = match self.ordering {
            NewestFirst => query_file_as!(
                IssueRow,
                "sql/newest_issues.sql",
                show_open,
                show_closed,
                date_before,
                date_after,
            ).fetch_all(db).await,
            // OldestFirst => self.oldest(db).await,
            // RecentlyUpdated => self.recent(db).await,
            Relevance => query_file_as!(
                IssueRow,
                "sql/relevant_issues.sql",
                self.search.to_owned().unwrap_or("".to_string()),
                show_open,
                show_closed,
                date_before,
                date_after,
            ).fetch_all(db).await,
            _ => todo!(),
        };

        records
            .map(|rows|
                rows.into_iter().map(IssueView::from).collect()
            )
            .map_err(AppError::from)
    }
}


pub async fn get_all_reports(issue_id: Uuid, db: &PgPool) -> Result<Vec<ReportView>, sqlx::Error> {
    query!(r#"
        SELECT id, reporter_id, description, created_at, closed_at FROM reports WHERE issue_id = $1
        ORDER BY created_at
    "#, issue_id).fetch_all(db).await
        .map(|rows| {
            rows.into_iter().map(|row| {
                ReportView {
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
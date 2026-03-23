use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{query, PgPool, Row};
use utoipa::{IntoParams, ToSchema};
use utoipa::openapi::KnownFormat::Duration;
use uuid::Uuid;
use crate::AppError;
use crate::issues::{Issue, Report};
use crate::issues::search::IssueQueryOrder::{NewestFirst, OldestFirst, RecentlyUpdated, Relevance};

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
    // filters: Option<Vec<String>>, //todo implement
    #[param(required = false)]
    show: IssueQueryShow,
    location: Option<Uuid>,
    #[param(required = false)]
    date_after: DateTime<Utc>,
    #[param(required = false)]
    date_before: DateTime<Utc>,
    #[param(required = false)]
    ordering: IssueQueryOrder,
}

impl Default for IssueQuery {
    fn default() -> Self {
        Self {
            search: None,
            // filters: None,
            location: None,
            show: IssueQueryShow::Open,
            date_after: DateTime::<Utc>::UNIX_EPOCH,
            date_before: Utc::now() + std::time::Duration::from_hours(24),
            ordering: NewestFirst,
        }
    }
}

impl IssueQuery {
    pub async fn query(self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        match self.ordering {
            NewestFirst => self.newest(db).await,
            // OldestFirst => self.oldest(db).await,
            // RecentlyUpdated => self.recent(db).await,
            Relevance => self.relevance(db).await,
            _ => todo!(),
        }
    }

    async fn newest(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        use IssueQueryShow as Show;
        let show = match self.show {
            Show::All => "TRUE",
            Show::Closed => "closed_at IS NOT NULL",
            Show::Open => "closed_at IS NULL",
        };

        let sql = format!(r"
            SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues
            INNER JOIN (
                SELECT issue_id, MIN(created_at) as earliest_report
                FROM reports
                WHERE {show} AND created_at BETWEEN $1 AND $2
                GROUP BY issue_id
            ) r ON issues.id = r.issue_id
            GROUP BY r.earliest_report, issues.id
            ORDER BY r.earliest_report DESC
        ");

        tracing::debug!("sql:\n{}", sql);

        query(&sql)
            .bind(self.date_after)
            .bind(self.date_before)
            .fetch_all(db)
            .await
            .map(|rows| {
                rows.into_iter().map(|row| {
                    Issue {
                        id: row.get(0),
                        title: row.get(1),
                        description: row.get(2),
                    }
                }).collect()
            })
            .map_err(AppError::from)
    }
    async fn relevance(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        use IssueQueryShow as Show;
        let show = match self.show {
            Show::All => "TRUE",
            Show::Closed => "closed_at IS NOT NULL",
            Show::Open => "closed_at IS NULL",
        };

        let sql = format!(r"
            SELECT
                issues.id,
                issues.title,
                issues.description,
                issues.location_id,
                ts_rank_cd(
                    setweight(to_tsvector('english', issues.title), 'A') ||
                    setweight(to_tsvector('english', issues.description), 'B') ||
                    setweight(to_tsvector('english', r.combined_description), 'C'),
                    to_tsquery('english', $1)
                ) AS rank
            FROM issues
            LEFT JOIN (
                SELECT issue_id, MIN(created_at) AS earliest_report, string_agg(description, ' ') AS combined_description
                FROM reports
                WHERE {show} AND created_at BETWEEN $2 AND $3
                GROUP BY issue_id
            ) r ON issues.id = r.issue_id
            ORDER BY rank DESC
        ");

        tracing::debug!("sql:\n{}", sql);

        query(&sql)
            .bind(self.search.to_owned().unwrap_or("".to_string()))
            .bind(self.date_after)
            .bind(self.date_before)
            .fetch_all(db)
            .await
            .map(|rows| {
                rows.into_iter().map(|row| {
                    Issue {
                        id: row.get(0),
                        title: row.get(1),
                        description: row.get(2),
                    }
                }).collect()
            })
            .map_err(AppError::from)
    }




    // fn relevance_search<'q>(self) -> Option<DBQueryString<'q>> {
    //     let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
    //         "SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues"
    //     );
    // }
}


pub async fn get_all_reports(issue_id: Uuid, db: &PgPool) -> Result<Vec<Report>, sqlx::Error>  {
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
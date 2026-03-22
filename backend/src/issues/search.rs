use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{query, PgPool, Row};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;
use crate::AppError;
use crate::issues::Issue;
use crate::issues::search::IssueQueryOrder::{NewestFirst, OldestFirst, RecentlyUpdated, Relevance};

#[derive(Serialize, Deserialize, ToSchema)]
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
            "oldest" => Ok(OldestFirst),
            "newest" => Ok(NewestFirst),
            "relevance" => Ok(Relevance),
            "recent" => Ok(RecentlyUpdated),
            _ => Err(AppError::BadRequest("Invalid `order` parameter".to_string())),
        }
    }

}

#[derive(Deserialize, IntoParams)]
#[into_params(parameter_in = Query, rename_all = "camelCase")]
#[serde(default)]
#[serde(rename_all = "camelCase")]
pub struct IssueQuery {
    search: Option<String>,
    // filters: Option<Vec<String>>, //todo implement
    show_open: bool,
    show_closed: bool,
    location: Option<Uuid>,
    date_after: DateTime<Utc>,
    date_before: DateTime<Utc>,
    ordering: IssueQueryOrder,
}

impl Default for IssueQuery {
    fn default() -> Self {
        Self {
            search: None,
            // filters: None,
            location: None,
            show_open: true,
            show_closed: false,
            date_after: DateTime::<Utc>::MIN_UTC,
            date_before: DateTime::<Utc>::MAX_UTC,
            ordering: NewestFirst,
        }
    }
}

impl IssueQuery {
    pub async fn query(self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        if !self.show_open && !self.show_closed {
            return Err(AppError::NotFound("Logically Empty".to_string()));
        }

        match self.ordering {
            NewestFirst => self.newest(db).await,
            // OldestFirst => self.oldest(db).await,
            // RecentlyUpdated => self.recent(db).await,
            Relevance => self.relevance(db).await,
            _ => todo!(),
        }
    }

    async fn newest(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        let show = self.show_clause("r");
        let sql = format!(r"
            SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues
            LEFT JOIN (
                SELECT issue_id, closed_at, MIN(created_at) as earliest_report
                FROM reports
                GROUP BY issue_id
            ) earliest_reports ON issues.id = earliest_reports.issue_id
            WHERE (r.earliest_report BETWEEN $1 AND $2) AND ({show})
            ORDER BY r.earliest_report DESC
        ");


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

    // async fn oldest(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
    //     let show = self.show_clause("r");
    //     let sql = format!(r"
    //         SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues
    //         LEFT JOIN (
    //             SELECT issue_id, closed_at, MIN(created_at) as earliest_report
    //             FROM reports
    //             GROUP BY issue_id
    //         ) earliest_reports ON issues.id = earliest_reports.issue_id
    //         WHERE (r.earliest_report BETWEEN $1 AND $2) AND ({show})
    //         ORDER BY r.earliest_report ASC
    //     ");
    //
    //     query(&sql)
    //         .bind(self.date_after)
    //         .bind(self.date_before)
    //         .fetch_all(db)
    //         .await
    //         .map(|rows| {
    //             rows.into_iter().map(|row| {
    //                 Issue {
    //                     id: row.get(0),
    //                     title: row.get(1),
    //                     description: row.get(2),
    //                 }
    //             }).collect()
    //         })
    //         .map_err(AppError::from)
    // }

    // async fn recent<'q>(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
    //     let show = self.show_clause("r");
    //     let sql = format!(r"
    //         SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues
    //         LEFT JOIN (
    //             SELECT issue_id, closed_at, MIN(created_at) as earliest_report, MAX(created_at) as latest_report
    //             FROM reports
    //             GROUP BY issue_id
    //         ) r ON issues.id = r.issue_id
    //         WHERE (r.earliest_report BETWEEN $1 AND $2) AND ({show})
    //         ORDER BY r.latest_report DESC
    //     ");
    //
    //     query(&sql)
    //         .bind(self.date_after)
    //         .bind(self.date_before)
    //         .fetch_all(db)
    //         .await
    //         .map(|rows| {
    //             rows.into_iter().map(|row| {
    //                 Issue {
    //                     id: row.get(0),
    //                     title: row.get(1),
    //                     description: row.get(2),
    //                 }
    //             }).collect()
    //         })
    //         .map_err(AppError::from)
    // }

    async fn relevance(&self, db: &PgPool) -> Result<Vec<Issue>, AppError> {
        let show = self.show_clause("r");
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
                SELECT
                    issue_id,
                    closed_at,
                    MIN(created_at) AS earliest_report,
                    string_agg(description, ' ') AS combined_description
                FROM reports
                GROUP BY issue_id, closed_at
            ) r ON issues.id = r.issue_id
            WHERE (r.earliest_report BETWEEN $2 AND $3) AND ({show})
            ORDER BY rank DESC
        ");

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

    fn show_clause(&self, var: &str) -> String {
        let show_open = if self.show_open {
            format!("{var}.closed_at IS NULL")
        } else {
            "FALSE".to_string()
        };

        let show_closed = if self.show_closed {
            format!("{var}.closed_at IS NOT NULL")
        } else {
            "FALSE".to_string()
        };

        format!("{show_open} OR {show_closed}")
    }




    // fn relevance_search<'q>(self) -> Option<DBQueryString<'q>> {
    //     let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
    //         "SELECT issues.id, issues.title, issues.description, issues.location_id FROM issues"
    //     );
    // }
}
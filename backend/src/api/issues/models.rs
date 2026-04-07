use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;
use sqlx::FromRow;
use crate::error::AppError;


// issues

#[derive(Debug, FromRow, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct IssueSchema {
    pub id: Uuid,
    pub location_id: Option<Uuid>,
    pub title: Option<String>,
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
pub struct CreateIssueResponse {
    pub report: ReportSchema,
    pub issue: IssueSchema,
}

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query, rename_all = "camelCase")]
#[serde(default)]
#[serde(rename_all = "camelCase")]
pub struct IssueQuery {
    pub search: Option<String>,
    #[param(required = false)]
    pub show: IssueQueryShow,
    pub location: Option<Uuid>,
    pub date_after: Option<DateTime<Utc>>,
    pub date_before: Option<DateTime<Utc>>,
    #[param(required = false)]
    pub ordering: IssueQueryOrder,
}

impl Default for IssueQuery {
    fn default() -> Self {
        Self {
            search: None,
            location: None,
            show: IssueQueryShow::Open,
            date_after: None,
            date_before: None,
            ordering: IssueQueryOrder::NewestFirst,
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
            "oldestfirst" => Ok(IssueQueryOrder::OldestFirst),
            "newestfirst" => Ok(IssueQueryOrder::NewestFirst),
            "relevance" => Ok(IssueQueryOrder::Relevance),
            "recentlyupdated" => Ok(IssueQueryOrder::RecentlyUpdated),
            _ => Err(AppError::BadRequest("Invalid `order` parameter".to_string())),
        }
    }
}


// reports

#[derive(Debug, FromRow, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReportSchema {
    pub id: Uuid,
    pub issue_id: Uuid,
    pub reporter_id: Uuid,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateReport {
    pub description: String,
}
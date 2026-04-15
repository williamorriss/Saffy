use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;
use sqlx::FromRow;
use crate::api::locations::LocationSchema;
use crate::error::AppError;
use crate::api::tags::TagSchema;
use super::routes::IssueRow;

// issues

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct IssueSchema {
    pub id: Uuid,
    pub location: Option<LocationSchema>,
    pub tags: Vec<TagSchema>,
    pub title: Option<String>,
    pub description: Option<String>,
}

impl From<IssueRow> for IssueSchema {

    fn from(row: IssueRow) -> IssueSchema {
        let location = if
            let Some(location_id) = row.location_id &&
            let Some(location_name) = row.location_name &&
            let Some(location_description) = row.location_description &&
            let Some(location_department) = row.location_department &&
            let Some(location_url) = row.location_url {
                Some(LocationSchema {
                    id: location_id,
                    name: location_name,
                    description: location_description,
                    department: location_department,
                    url: location_url
                })
            } else {
                None
            };

        let tags: Vec<_> = row.tags.map_or(vec![], |tags| tags.into_iter().map(|tag| TagSchema {name:tag}).collect());

        IssueSchema {
            id: row.issue_id,
            title: row.issue_title,
            description: row.issue_description,
            location, tags
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateIssue {
    pub title: String,
    pub description: String,
    pub location_id: Option<Uuid>,
    pub tag_names: Vec<String>, // tag schema not used since we just want tag names
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateIssueResponse {
    pub report: ReportSchema,
    pub issue: IssueSchema,
}

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query, rename_all = "camelCase")]
#[serde(default, rename_all = "camelCase")]
pub struct IssueQuery {
    pub search: Option<String>,
    #[param(required = false)]
    pub show: IssueQueryShow,
    pub location_id: Option<Uuid>,
    pub date_after: Option<DateTime<Utc>>,
    pub date_before: Option<DateTime<Utc>>,
    #[param(required = false)]
    pub ordering: IssueQueryOrder,
    #[serde(deserialize_with = "deserialize_tags")]
    pub tags: Vec<Uuid>,
}

fn deserialize_tags<'de, D>(deserializer: D) -> Result<Vec<Uuid>, D::Error>
where D: Deserializer<'de>
{
    let s = String::deserialize(deserializer)?;
    if s.is_empty() { return Ok(vec![]); }
    s.split(',')
        .map(|s| s.trim().parse::<Uuid>().map_err(serde::de::Error::custom))
        .collect()
}

impl Default for IssueQuery {
    fn default() -> Self {
        Self {
            search: None,
            location_id: None,
            show: IssueQueryShow::Open,
            date_after: None,
            date_before: None,
            ordering: IssueQueryOrder::NewestFirst,
            tags: vec![]
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
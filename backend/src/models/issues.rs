use serde::{Serialize, Deserialize};
use chrono::NaiveDateTime;
use ts_rs::TS;


#[derive(Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, rename_all = "camelCase")]
pub struct Issue {
    pub id: i32,
    pub description: Option<String>,
    pub opened_at: NaiveDateTime,
    pub closed_at: Option<NaiveDateTime>,
    pub location: Location,
}

#[derive(Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, rename_all = "camelCase")]
pub struct Location {
    pub id: i32,
    pub latitude: f32,
    pub longitude: f32,
    pub level: i32,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, rename_all = "camelCase")]
pub struct CreateIssue {
    pub description: Option<String>,
    pub location_id: i32,
}
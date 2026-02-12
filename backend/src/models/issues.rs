use serde::{Serialize, Deserialize};
use chrono::NaiveDateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueThumbnail {
    pub id: i32,
    pub description: Option<String>,
    pub opened_at: NaiveDateTime,
    // pub closed_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewLocation {
    pub level: i32,
    pub latitude: f32,
    pub longitude: f32,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewIssue {
    pub id: i32,
    pub description: Option<String>,
    pub location: NewLocation,
}
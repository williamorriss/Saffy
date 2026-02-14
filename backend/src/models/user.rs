use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = crate::RUST_TYPES, rename_all="camelCase")]
pub struct User {
    pub id: i32,
    pub username: String,
    pub created_at: NaiveDateTime,
}
use axum::{response::{IntoResponse, Response}, http::StatusCode, Json};
use serde_json::json;
use crate::error::AppError::DbError;

pub enum AppError {
    NotFound(String),
    // Unauthorized,
    Internal(anyhow::Error),
    BadRequest(String),
    DbError(sqlx::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => {
                tracing::debug!("{} not found", msg);
                (StatusCode::NOT_FOUND, msg)
            },
            // AppError::Unauthorized => {
            //     tracing::trace!("Unauthorized");
            //     (StatusCode::UNAUTHORIZED, "Unauthorized".to_string())
            // },
            AppError::BadRequest(msg) => {
                tracing::debug!("BadRequest: {}", msg);
                (StatusCode::BAD_REQUEST, msg)
            },
            AppError::Internal(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
            AppError::DbError(e) => {
                match e {
                    sqlx::Error::RowNotFound => {
                        tracing::debug!("{} not found", e);
                        (StatusCode::NOT_FOUND, "Item not found".to_string())
                    },
                    _ => {
                        tracing::error!("Database error: {:?}", e);
                        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
                    }
                }
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e)
    }
}

impl From<tower_sessions::session::Error> for AppError {
    fn from(e: tower_sessions::session::Error) -> Self {
        AppError::Internal(e.into())
    }
}

impl From<url::ParseError> for AppError {
    fn from(e: url::ParseError) -> Self {
        AppError::BadRequest(e.to_string())
    }
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        DbError(e)
    }
}
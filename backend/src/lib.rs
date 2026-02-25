pub mod issues;
pub mod auth;

pub mod error;

pub use auth::AuthSession;
pub use error::AppError;


use issues::{CreateIssue, Issue, CreateReport, Report};
use auth::User;

pub const PORT: u16 = 8000;
pub const ADDRESS: &str = "127.0.0.1";

pub const ORIGIN: &str = "https://localhost:8000";

#[derive(Debug, Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub auth_cache: std::sync::Arc<moka::future::Cache<uuid::Uuid, url::Url>>,
}


#[derive(utoipa::OpenApi)]
#[openapi(
    info(
        title = "knowle",
        version = "-10.0.0",
        description = "knowle dev api",
        contact(name = "will", email = "wvam20@bath.ac.uk"),
    ),
    components(schemas(User, Report, Issue, CreateIssue, CreateReport)),
)]
pub struct ApiDoc;
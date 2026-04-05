pub mod error;
pub mod api;

use utoipauto::utoipauto;

pub const PORT: u16 = 8000;
pub const ADDRESS: &str = "127.0.0.1";

pub const ORIGIN: &str = "http://localhost:8000";

#[derive(Debug, Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
}

#[utoipauto]
#[derive(utoipa::OpenApi)]
#[openapi(
    info(
        title = "knowle",
        version = "-0.3.6",
        description = "knowle dev api",
        contact(name = "will", email = "wvam20@bath.ac.uk"),
    ),
)]
pub struct ApiDoc;
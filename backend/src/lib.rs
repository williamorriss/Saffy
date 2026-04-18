use std::env::var;
use sqlx::PgPool;
use axum::extract::FromRef;

pub mod error;
pub mod api;

use utoipauto::utoipauto;

#[derive(Debug, Clone, FromRef)]
pub struct AppState {
    pub db: PgPool,
    pub config: AppConfig
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub address: String,
    pub origin: String,
    pub jwt_key: String,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<AppConfig>  {
        Ok(AppConfig {
            port: var("PORT")?.parse::<u16>()?,
            address: var("ADDRESS")?,
            origin: var("ORIGIN")?,
            jwt_key: var("JWT_KEY")?,
        })
    }
}


#[utoipauto]
#[derive(utoipa::OpenApi)]
#[openapi(
    info(
        title = "Saffy",
        version = "-0.3.6",
        description = "saffy dev api",
        contact(name = "will", email = "wvam20@bath.ac.uk"),
    ),
)]
pub struct ApiDoc;

pub async fn make_db_connection() -> anyhow::Result<PgPool> {
    let db_url = dotenvy::var("DATABASE_URL")?;

    Ok(sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?)
}
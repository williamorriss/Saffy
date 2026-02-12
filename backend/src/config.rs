use serde::Deserialize;
use std::path::PathBuf;
use toml::from_str;
use url::Url;
use anyhow::Result;
use dotenv::{dotenv,var};
use sqlx::postgres::{PgPoolOptions, PgPool};

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub cas: CasConfig,
    pub frontend: FrontendConfig,
    pub database: DatabaseConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
    pub host: String,
    pub origin: Url,
    pub key_location: PathBuf,
    pub cert_location: PathBuf,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CasConfig {
    pub origin: Url,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FrontendConfig {
    pub dist: PathBuf,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub max_connections: u32,
}

pub fn get_config() -> Result<Config> {
    Ok(from_str(&std::fs::read_to_string("config.toml")?)?)
}

pub async fn get_db_connection(config: &Config) -> Result<PgPool> {
    dotenv()?;
    let db_url = var("DATABASE_URL")?;
    Ok(PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(db_url.as_str())
        .await?)
}
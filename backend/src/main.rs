mod routes;
mod models;

mod utils;

use axum::Router;
use axum_server::tls_rustls::RustlsConfig;
use http::HeaderValue;
use tower_http::{
    services::{ServeDir, ServeFile},
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer};
use std::fmt::Debug;

use std::net::SocketAddr;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::EnvFilter;
use std::sync::Arc;
use moka::future::Cache;
use url::Url;
use uuid::Uuid;

const PORT: u16 = 8000;
const ADDRESS: &str = "127.0.0.1";

const ORIGIN: &str = "https://localhost:8000";


#[derive(Debug, Clone)]
pub struct AppState {
    db: PgPool,
    auth_cache: Arc<Cache<Uuid, Url>>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv()?;

    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env()).init();
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("Failed to initialize TLS certificate");

    let db_pool = make_db_connection().await?;
    let app = app(&db_pool)?;
    tracing::trace!("Created router:\n{:#?}", app);

    let tls_config = RustlsConfig::from_pem_file("cert.pem", "key.pem")
        .await?;

    let address = format!("{}:{}", ADDRESS, PORT).parse::<SocketAddr>()?;

    println!("Serving on {}", ORIGIN);

    axum_server::bind_rustls(address, tls_config)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

async fn make_db_connection() -> anyhow::Result<PgPool> {
    let db_url = dotenvy::var("DATABASE_URL")?;

    Ok(PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?)
}

fn app(db_pool: &PgPool) -> anyhow::Result<Router> {
    let auth_cache = Cache::builder()
        .time_to_live(std::time::Duration::from_secs(600))
        .max_capacity(10_000)
        .build();

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(true)
        .with_expiry(Expiry::OnInactivity(time::Duration::seconds(3600)));

    let backend_origin = ORIGIN.parse::<HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", backend_origin);

    let dev_origin = "https://localhost:5173".parse::<HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", dev_origin);

    let cors = CorsLayer::new()
        .allow_origin(backend_origin)
        .allow_origin(dev_origin)
        .allow_methods(Any);

    Ok(Router::new()
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .merge(routes::routes())
        .layer(session_layer)
        .fallback_service(
            ServeDir::new("static").not_found_service(ServeFile::new("static/index.html")))
        .with_state(AppState {db: db_pool.clone(), auth_cache: Arc::new(auth_cache)}))
}
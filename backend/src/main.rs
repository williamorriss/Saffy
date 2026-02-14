mod routes;
mod models;

mod utils;

mod config;

use axum::Router;
use axum_server::tls_rustls::RustlsConfig;
use http::{HeaderValue};
use tower_http::{
    services::{ServeDir, ServeFile},
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer};
use std::fmt::Debug;
use time::Duration;

use std::net::SocketAddr;
use sqlx::PgPool;
use tracing_subscriber::EnvFilter;
use crate::config::{get_config, get_db_connection, Config};
use crate::utils::ResultTrace;

pub use config::RUST_TYPES;

#[derive(Debug, Clone)]
pub struct AppState {
    config: Config,
    db: PgPool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env()).init();

    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    let config = get_config()
        .server_err("Failed to read config.toml")
        .unwrap();

    let db_pool = get_db_connection(&config).await.unwrap();

    let app = app(&config, &db_pool);
    tracing::trace!("Created router:\n{:#?}", app);

    let tls_config = RustlsConfig::from_pem_file(&config.server.cert_location, &config.server.key_location)
        .await
        .unwrap();

    let addr = format!("{}:{}", config.server.host, config.server.port)
        .parse::<SocketAddr>()
        .expect("Invalid socket address");

    tracing::info!("Serving on {:?}", config.server.origin.as_str());

    axum_server::bind_rustls(addr, tls_config)
        .serve(app.into_make_service())
        .await
        .unwrap();

}

fn app(config: &Config, db_pool: &PgPool) -> Router<()> {
    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(true)
        .with_expiry(Expiry::OnInactivity(Duration::seconds(3600)));


    let allow_origin = config.server.origin.as_str().parse::<HeaderValue>().unwrap();
    tracing::debug!("Cors allow origin {:?}", allow_origin);

    let cors = CorsLayer::new()
        .allow_origin(allow_origin)
        .allow_methods(Any);

    Router::new()
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .merge(routes::routes())
        .layer(session_layer)
        .fallback_service(
            ServeDir::new(config.frontend.dist.clone()).not_found_service(ServeFile::new(config.frontend.dist.clone().join("index.html"))))
        .with_state(AppState {config: config.clone(), db: db_pool.clone()})
}
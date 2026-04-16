use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;
use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, ACCEPT};
use http::Method;
use utoipa_swagger_ui::SwaggerUi;
use backend::{AppConfig, AppState, make_db_connection};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter(tracing_subscriber::EnvFilter::from_default_env()).init();

    let config = AppConfig::from_env().expect("Failed to parse env");
    let app = make_router(&config).await?;
    let address = format!("{}:{}", config.address, config.port)
        .parse::<std::net::SocketAddr>()?;
    println!("Serving on {}", config.origin);
    println!("Documentation at {}/swagger-ui", config.origin);
    axum_server::bind(address)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

async fn make_router(config: &AppConfig) -> anyhow::Result<axum::Router<()>> {
    let state = AppState {
        config: config.to_owned(),
        db: make_db_connection().await?
    };

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(true)
        .with_expiry(Expiry::OnInactivity(time::Duration::seconds(3600)));

    let origin = state.config.origin.parse::<http::HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", origin);

    let frontend = state.config.frontend_origin.parse::<http::HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", frontend);

    let cors = CorsLayer::new()
        .allow_origin([origin, frontend])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, COOKIE, ACCEPT])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_credentials(true);

    let (router, api) = OpenApiRouter::with_openapi(backend::ApiDoc::openapi())
        .merge(backend::api::routes())
        .split_for_parts();

    Ok(router
        .layer(TraceLayer::new_for_http())
        .with_state(state)
        .layer(session_layer)
        .fallback_service(
            ServeDir::new("static").not_found_service(ServeFile::new("static/index.html")))
        .layer(cors)
        .merge(SwaggerUi::new("/swagger-ui")
            .url("/openapi.json", api)))
}
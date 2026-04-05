use sqlx::PgPool;
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv()?;

    tracing_subscriber::fmt().with_env_filter(tracing_subscriber::EnvFilter::from_default_env()).init();
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("Failed to initialize TLS certificate");

    let db_pool = make_db_connection().await?;
    let app = app(&db_pool)?;

    // let tls_config = axum_server::tls_rustls::RustlsConfig::from_pem_file("cert.pem", "key.pem")
    //     .await?;

    let address = format!("{}:{}", backend::ADDRESS, backend::PORT).parse::<std::net::SocketAddr>()?;

    println!("Serving on {}", backend::ORIGIN);

    //axum_server::bind_rustls(address, tls_config)
    axum_server::bind(address)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

async fn make_db_connection() -> anyhow::Result<PgPool> {
    let db_url = dotenvy::var("DATABASE_URL")?;

    Ok(sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?)
}

fn app(db_pool: &PgPool) -> anyhow::Result<axum::Router<()>> {
    use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer};
    use tower_http::{
        cors::CorsLayer,
        services::{ServeDir, ServeFile},
        trace::TraceLayer,
    };
    use http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, ACCEPT};
    use http::Method;

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(true)
        .with_expiry(Expiry::OnInactivity(time::Duration::seconds(3600)));

    let backend_origin = backend::ORIGIN.parse::<http::HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", backend_origin);

    let dev_origin = "http://localhost:5173".parse::<http::HeaderValue>()?;
    tracing::debug!("Cors allow origin {:?}", dev_origin);

    let cors = CorsLayer::new()
        .allow_origin([backend_origin, dev_origin])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, COOKIE, ACCEPT])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_credentials(true);

    let (router, api) = OpenApiRouter::with_openapi(backend::ApiDoc::openapi())
        .merge(backend::api::routes())
        .split_for_parts();

    Ok(router
        .layer(TraceLayer::new_for_http())
        .with_state(backend::AppState {db: db_pool.clone()})
        .layer(session_layer)
        .fallback_service(
            ServeDir::new("static").not_found_service(ServeFile::new("static/index.html")))
        .layer(cors)
        .route("/openapi.json", axum::routing::get(move || async move { axum::Json(api)})))
}
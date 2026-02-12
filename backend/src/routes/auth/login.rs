use axum::extract::State;
use axum::response::Redirect;
use http::StatusCode;
use crate::AppState;
use crate::utils::ResultTrace;

pub async fn on_request_get(State(state): State<AppState>) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/login endpoint");
    let cas_callback = state.config.server.origin.join("auth/cas")
        .server_err("Failed to build cas callback")?;
    
    let mut cas_url = state.config.cas.origin.join("login")
        .server_err("Failed to build cas url")?;
    
    cas_url.query_pairs_mut()
        .append_pair("service", cas_callback.as_str());
        
    Ok(Redirect::permanent(cas_url.as_str()))
}
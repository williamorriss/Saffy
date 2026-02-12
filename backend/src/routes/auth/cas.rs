use std::collections::HashMap;
use serde::Deserialize;
use axum::{
    extract::{Query},
    response::{Redirect},
};

use http::{StatusCode};

use tower_sessions::Session;
use quick_xml::de::from_str;
use crate::AppState;
use axum::extract::State;
use crate::config::Config;
use crate::utils::ResultTrace;
use axum::http::Uri;

#[derive(Debug, Deserialize)]
struct AuthenticationFailure {
    #[serde(rename = "@code")]
    _code: String,
    #[serde(rename = "$text")]
    message: String,
}

#[derive(Debug, Deserialize)]
struct AuthenticationSuccess {
    user: String,
    #[serde(rename = "proxyGrantingTicket")]
    _ticket: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CasServiceResponse {
    authentication_success: Option<AuthenticationSuccess>,
    authentication_failure: Option<AuthenticationFailure>,
}

impl CasServiceResponse {
    fn into_result(self) -> Result<AuthenticationSuccess, Option<AuthenticationFailure>> {
        self.authentication_success.ok_or(self.authentication_failure)
    }
}

pub async fn on_request_get(Query(params): Query<HashMap<String, String>>, session: Session, State(state): State<AppState>) -> Result<Redirect, StatusCode> {
    tracing::info!("Executing api/auth/cas endpoint");
    let xml = get_cas_response(&params, &state.config).await?;
    let username = parse_xml_response(&xml)?;
    session.insert("username", username)
        .await
        .server_err("Failed to insert username into session")?;

    session.save()
        .await
        .server_err("Failed to save session")?;

    Ok(Redirect::to("/?auth=true"))

}

fn parse_xml_response(body: &str) -> Result<String, StatusCode> {
   Ok(from_str::<CasServiceResponse>(body)
       .map_err(|_| {
           tracing::warn!("Failed to parse xml response");
           StatusCode::BAD_REQUEST
       })?
       .into_result()
       .map_err(|failure| {
           match failure {
               Some(fail) => tracing::warn!("CAS xml response returned authentication error:\n{:?}", fail.message),
               None => tracing::warn!("CAS xml response was empty or not parsed")
           }
           StatusCode::BAD_REQUEST
       })?
       .user)
}

async fn get_cas_response(params: &HashMap<String, String>, config: &Config) -> Result<String, StatusCode> {
    let client = reqwest::Client::new();
    let ticket = &params.get("ticket").ok_or(StatusCode::BAD_REQUEST)?;

    let mut cas_url = config.cas.origin.join("serviceValidate").expect("Failed to build cas url");
    let cas_callback = config.server.origin.join("auth/cas").expect("Failed to build cas callback");

    cas_url.query_pairs_mut()
        .append_pair("service", cas_callback.as_str())
        .append_pair("ticket", ticket);

    Ok(client.get(cas_url)
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?
        .text()
        .await
        .server_err("Failed to get cas response")?)
}
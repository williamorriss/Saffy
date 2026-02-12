use std::fmt::Debug;
use http::StatusCode;

pub trait ResultTrace<T,E> {

    fn server_err(self, msg: &str) -> Result<T, StatusCode>;
}

impl<T, E: Debug> ResultTrace<T,E> for Result<T, E> {
    fn server_err(self, msg: &str) -> Result<T, StatusCode> {
        self.map_err(|e| {
            tracing::error!("{}\n{:?}", msg, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
    }
}
use std::path::PathBuf;
use serde::Deserialize;
use toml::from_str;
use url::Url;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub cas: CasConfig,
    pub frontend: FrontendConfig
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

pub fn get_config() -> Result<Config, std::io::Error> {
    let config_file = std::fs::read_to_string("config.toml")?;
    from_str(&config_file)
        .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidInput, err.to_string()))


}
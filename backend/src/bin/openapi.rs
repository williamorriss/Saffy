use utoipa::OpenApi;

use backend::ApiDoc;

fn main() {
    let spec = ApiDoc::openapi().to_pretty_json().unwrap();
    std::fs::write("../openapi.json", spec).unwrap();
}
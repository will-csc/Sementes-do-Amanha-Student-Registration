use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct User {
  pub id: i64,
  pub name: Option<String>,
  pub email: String,
  pub role: String,
  pub status: String,
}

use axum::Json;
use crate::models::user::User;
use crate::services;

pub async fn list_users() -> Json<Vec<User>> {
  let users = services::user_service::list_users().await;
  Json(users)
}

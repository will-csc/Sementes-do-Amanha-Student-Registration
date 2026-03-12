use axum::Json;
use serde::{Deserialize, Serialize};

use crate::services;

#[derive(Deserialize)]
pub struct LoginRequest {
  pub email: String,
  pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
  pub token: String,
}

pub async fn login(Json(payload): Json<LoginRequest>) -> Json<LoginResponse> {
  let token = services::auth_service::login(payload.email, payload.password).await;
  Json(LoginResponse { token })
}

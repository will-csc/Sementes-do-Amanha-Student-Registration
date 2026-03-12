use axum::{
  routing::{get, post},
  Router,
};

use crate::handlers;

#[derive(Clone)]
pub struct AppState {
  pub db: sqlx::PgPool,
}

pub fn create_router(state: AppState) -> Router {
  let cors = tower_http::cors::CorsLayer::new()
    .allow_origin(tower_http::cors::Any)
    .allow_methods(tower_http::cors::Any)
    .allow_headers(tower_http::cors::Any);

  Router::new()
    .route("/health", get(handlers::health::health))
    .route("/login", post(handlers::auth::login))
    .route("/users", get(handlers::users::list_users))
    .route("/stats/students", get(handlers::students::get_students_stats))
    .route("/stats/admin", get(handlers::students::get_admin_stats))
    .route(
      "/students",
      get(handlers::students::list_students).post(handlers::students::create_student),
    )
    .route("/student-audit-events", get(handlers::students::list_audit_events))
    .route(
      "/students/:id",
      get(handlers::students::get_student)
        .put(handlers::students::update_student)
        .delete(handlers::students::delete_student),
    )
    .route("/students/:id/contract", get(handlers::students::download_student_contract))
    .layer(cors)
    .with_state(state)
}

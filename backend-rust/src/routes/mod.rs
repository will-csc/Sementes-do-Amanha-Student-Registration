use axum::{
    body::Body,
    extract::{connect_info::ConnectInfo, MatchedPath},
    http::Request,
    middleware::Next,
    response::Response,
    routing::{get, post},
    Router,
};

use crate::handlers;
use std::net::SocketAddr;
use std::time::Instant;

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
        .route("/documents", get(handlers::documents::list_documents))
        .route(
            "/documents/:slug/emit",
            post(handlers::documents::emit_document),
        )
        .route(
            "/documents/:slug/emitir",
            post(handlers::documents::emit_document),
        )
        .route("/users", get(handlers::users::list_users))
        .route(
            "/stats/students",
            get(handlers::students::get_students_stats),
        )
        .route("/stats/admin", get(handlers::students::get_admin_stats))
        .route(
            "/students",
            get(handlers::students::list_students).post(handlers::students::create_student),
        )
        .route(
            "/student-audit-events",
            get(handlers::students::list_audit_events),
        )
        .route(
            "/students/:id",
            get(handlers::students::get_student)
                .put(handlers::students::update_student)
                .delete(handlers::students::delete_student),
        )
        .route(
            "/students/:id/contract",
            get(handlers::students::download_student_contract),
        )
        .layer(cors)
        .layer(axum::middleware::from_fn(log_requests))
        .with_state(state)
}

async fn log_requests(req: Request<Body>, next: Next) -> Response {
    let start = Instant::now();

    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let matched = req
        .extensions()
        .get::<MatchedPath>()
        .map(|m| m.as_str().to_string())
        .unwrap_or_else(|| path.clone());
    let remote = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|c| c.0.to_string())
        .unwrap_or_else(|| "-".to_string());

    let res = next.run(req).await;
    let status = res.status();
    let ok = status.is_success() || status.is_redirection();
    let ms = start.elapsed().as_millis();

    if ok {
        tracing::info!(%remote, %method, route = %matched, %path, status = status.as_u16(), ms);
    } else {
        tracing::warn!(%remote, %method, route = %matched, %path, status = status.as_u16(), ms);
    }

    res
}

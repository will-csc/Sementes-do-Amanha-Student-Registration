use std::net::SocketAddr;

mod config;
mod handlers;
mod models;
mod repository;
mod routes;
mod services;
mod utils;

#[tokio::main]
async fn main() {
  config::init_tracing();
  config::load_env();

  let pool = config::create_pg_pool().await;
  let state = routes::AppState { db: pool };
  let app = routes::create_router(state);
  let port = config::server_port();

  let addr = SocketAddr::from(([0, 0, 0, 0], port));
  tracing::info!("listening on http://{addr}");

  let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
  axum::serve(listener, app).await.expect("serve");
}

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn load_env() {
  let _ = dotenvy::dotenv();
}

pub fn init_tracing() {
  tracing_subscriber::registry()
    .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
    .with(tracing_subscriber::fmt::layer())
    .init();
}

pub fn server_port() -> u16 {
  std::env::var("PORT")
    .ok()
    .and_then(|v| v.parse::<u16>().ok())
    .unwrap_or(3000)
}

pub async fn create_pg_pool() -> sqlx::PgPool {
  let primary = std::env::var("DATABASE_URL").expect("DATABASE_URL is required");
  let fallback = std::env::var("DATABASE_URL_FALLBACK")
    .ok()
    .or_else(|| std::env::var("LOCAL_DATABASE_URL").ok());

  let opts = || sqlx::postgres::PgPoolOptions::new().max_connections(10);

  match opts().connect(&primary).await {
    Ok(pool) => pool,
    Err(primary_err) => {
      if let Some(fallback_url) = fallback {
        tracing::warn!("falha ao conectar no banco (DATABASE_URL). Tentando fallback (DATABASE_URL_FALLBACK/LOCAL_DATABASE_URL).");
        opts()
          .connect(&fallback_url)
          .await
          .unwrap_or_else(|fallback_err| {
            panic!(
              "failed to connect to database (primary error: {primary_err}; fallback error: {fallback_err})"
            )
          })
      } else {
        panic!("failed to connect to database (primary error: {primary_err})")
      }
    }
  }
}

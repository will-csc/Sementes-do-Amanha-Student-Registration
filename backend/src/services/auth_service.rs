use crate::utils;

pub async fn login(email: String, _password: String) -> String {
  let id = utils::id::next_id();
  format!("dev-token:{id}:{email}")
}

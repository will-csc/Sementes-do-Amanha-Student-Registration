use crate::models::user::User;
use crate::repository;

pub async fn list_users() -> Vec<User> {
    repository::user_repository::list_users().await
}

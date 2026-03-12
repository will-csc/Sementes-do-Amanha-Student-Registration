use sqlx::PgPool;

use crate::models::student::{Student, StudentAuditEvent, StudentDraft, StudentListItem};
use crate::repository;

pub async fn list_students(pool: &PgPool) -> Result<Vec<StudentListItem>, sqlx::Error> {
  repository::students_repository::list_students(pool).await
}

pub async fn get_student(pool: &PgPool, id: i64) -> Result<Option<Student>, sqlx::Error> {
  repository::students_repository::get_student(pool, id).await
}

pub async fn create_student(pool: &PgPool, draft: StudentDraft, by_email: &str) -> Result<Student, sqlx::Error> {
  repository::students_repository::create_student(pool, draft, by_email).await
}

pub async fn update_student(pool: &PgPool, id: i64, draft: StudentDraft, by_email: &str) -> Result<Option<Student>, sqlx::Error> {
  repository::students_repository::update_student(pool, id, draft, by_email).await
}

pub async fn delete_student(pool: &PgPool, id: i64, by_email: &str) -> Result<bool, sqlx::Error> {
  repository::students_repository::delete_student(pool, id, by_email).await
}

pub async fn list_audit_events(pool: &PgPool, limit: i64) -> Result<Vec<StudentAuditEvent>, sqlx::Error> {
  repository::students_repository::list_audit_events(pool, limit).await
}

pub async fn get_students_stats(pool: &PgPool) -> Result<(i64, i64, i64), sqlx::Error> {
  repository::students_repository::get_students_stats(pool).await
}

pub async fn get_admin_stats(pool: &PgPool) -> Result<(i64, i64, i64, i64), sqlx::Error> {
  repository::students_repository::get_admin_stats(pool).await
}

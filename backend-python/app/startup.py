from datetime import datetime, timezone

from sqlalchemy import inspect

from app.database import db
from app.models.users import User


DEFAULT_ADMIN_EMAIL = "adm@sementesdoamanha.com"
DEFAULT_ADMIN_PASSWORD = "Sny-305nv"
DEFAULT_ADMIN_NAME = "Administrador"


def _has_column(table_name, column_name):
    inspector = inspect(db.engine)
    return column_name in {column["name"] for column in inspector.get_columns(table_name)}


def _ensure_column(table_name, column_name, sql_definition):
    if _has_column(table_name, column_name):
        return
    with db.engine.begin() as connection:
        connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {sql_definition}")


def _sql_definitions():
    dialect = db.engine.dialect.name
    is_postgres = dialect == "postgresql"

    return {
        "status": "TEXT NOT NULL DEFAULT 'pending'",
        "approved_at": "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME",
        "rejected_at": "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME",
        "foto_crianca": "TEXT",
        "beneficio_outros": "TEXT",
        "ativo": "BOOLEAN NOT NULL DEFAULT TRUE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 1",
        "unidade": "TEXT",
    }


def ensure_schema():
    db.create_all()
    sql = _sql_definitions()

    _ensure_column("users", "status", sql["status"])
    _ensure_column("users", "approved_at", sql["approved_at"])
    _ensure_column("users", "rejected_at", sql["rejected_at"])

    _ensure_column("students", "foto_crianca", sql["foto_crianca"])
    _ensure_column("students", "beneficio_outros", sql["beneficio_outros"])
    _ensure_column("students", "ativo", sql["ativo"])
    _ensure_column("students", "unidade", sql["unidade"])


def ensure_default_admin():
    existing = User.query.filter(User.email == DEFAULT_ADMIN_EMAIL, User.deleted_at.is_(None)).first()
    if existing:
        return

    now = datetime.now(timezone.utc)
    admin = User(
        name=DEFAULT_ADMIN_NAME,
        email=DEFAULT_ADMIN_EMAIL,
        role="admin",
        status="approved",
        approved_at=now,
        last_login_at=now,
    )
    admin.set_password(DEFAULT_ADMIN_PASSWORD)
    db.session.add(admin)
    db.session.commit()

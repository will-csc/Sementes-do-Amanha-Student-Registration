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
        "locomocao": "TEXT",
        "locomocao_acompanhante": "TEXT",
        "origem_encaminhamento": "TEXT",
        "contato_conjuge_frequencia": "TEXT",
        "faixa_renda": "TEXT",
        "beneficio_outros": "TEXT",
        "ativo": "BOOLEAN NOT NULL DEFAULT TRUE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 1",
        "unidade": "TEXT",
        "evasao_escolar": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "evasao_escolar_motivo": "TEXT",
        "evasao_escolar_tempo": "TEXT",
        "tem_bronquite": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "tem_falta_ar": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "acompanhamento_odontologico": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "acompanhamento_odontologico_local": "TEXT",
        "acompanhamento_odontologico_tempo": "TEXT",
        "tratamento_oftalmologico": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "tratamento_oftalmologico_local": "TEXT",
        "usa_oculos": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "usa_lentes": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "restricao_fisica": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "restricao_fisica_descricao": "TEXT",
        "permanece_sozinha_em_casa": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "frequencia_interacao": "TEXT",
        "situacao_prioritaria": "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0",
        "observacoes_gerais": "TEXT",
    }


def ensure_schema():
    db.create_all()
    sql = _sql_definitions()

    _ensure_column("users", "status", sql["status"])
    _ensure_column("users", "approved_at", sql["approved_at"])
    _ensure_column("users", "rejected_at", sql["rejected_at"])

    _ensure_column("students", "foto_crianca", sql["foto_crianca"])
    _ensure_column("students", "locomocao", sql["locomocao"])
    _ensure_column("students", "locomocao_acompanhante", sql["locomocao_acompanhante"])
    _ensure_column("students", "origem_encaminhamento", sql["origem_encaminhamento"])
    _ensure_column("students", "contato_conjuge_frequencia", sql["contato_conjuge_frequencia"])
    _ensure_column("students", "faixa_renda", sql["faixa_renda"])
    _ensure_column("students", "beneficio_outros", sql["beneficio_outros"])
    _ensure_column("students", "ativo", sql["ativo"])
    _ensure_column("students", "unidade", sql["unidade"])
    _ensure_column("students", "evasao_escolar", sql["evasao_escolar"])
    _ensure_column("students", "evasao_escolar_motivo", sql["evasao_escolar_motivo"])
    _ensure_column("students", "evasao_escolar_tempo", sql["evasao_escolar_tempo"])
    _ensure_column("students", "tem_bronquite", sql["tem_bronquite"])
    _ensure_column("students", "tem_falta_ar", sql["tem_falta_ar"])
    _ensure_column("students", "acompanhamento_odontologico", sql["acompanhamento_odontologico"])
    _ensure_column("students", "acompanhamento_odontologico_local", sql["acompanhamento_odontologico_local"])
    _ensure_column("students", "acompanhamento_odontologico_tempo", sql["acompanhamento_odontologico_tempo"])
    _ensure_column("students", "tratamento_oftalmologico", sql["tratamento_oftalmologico"])
    _ensure_column("students", "tratamento_oftalmologico_local", sql["tratamento_oftalmologico_local"])
    _ensure_column("students", "usa_oculos", sql["usa_oculos"])
    _ensure_column("students", "usa_lentes", sql["usa_lentes"])
    _ensure_column("students", "restricao_fisica", sql["restricao_fisica"])
    _ensure_column("students", "restricao_fisica_descricao", sql["restricao_fisica_descricao"])
    _ensure_column("students", "permanece_sozinha_em_casa", sql["permanece_sozinha_em_casa"])
    _ensure_column("students", "frequencia_interacao", sql["frequencia_interacao"])
    _ensure_column("students", "situacao_prioritaria", sql["situacao_prioritaria"])
    _ensure_column("students", "observacoes_gerais", sql["observacoes_gerais"])


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

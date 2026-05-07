from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.database import db
from app.models.users import User

bp = Blueprint("users", __name__, url_prefix="/users")


def _serialize_user(user):
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status or "pending",
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
        "approvedAt": user.approved_at.isoformat() if user.approved_at else None,
        "rejectedAt": user.rejected_at.isoformat() if user.rejected_at else None,
    }


def _normalized_email(value):
    return (value or "").strip().lower()


@bp.route("", methods=["GET"])
def list_users():
    users = User.query.filter(User.deleted_at.is_(None)).order_by(User.created_at.desc(), User.id.desc()).all()
    return jsonify([_serialize_user(user) for user in users])


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = _normalized_email(data.get("email"))
    password = data.get("password")
    if not email or not password:
        return jsonify({"error":"email e password são obrigatórios"}), 400
    if User.query.filter(User.email == email, User.deleted_at.is_(None)).first():
        return jsonify({"error":"email já cadastrado"}), 400

    role = "admin" if email == "adm@sementesdoamanha.com" else "user"
    status = "approved" if role == "admin" else "pending"
    now = datetime.now(timezone.utc)

    u = User(
        email=email,
        name=(data.get("name") or "").strip() or None,
        role=role,
        status=status,
        approved_at=now if status == "approved" else None,
    )
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    message = "Usuário cadastrado e aprovado." if status == "approved" else "Usuário cadastrado. Aguarde aprovação."
    return jsonify({"user": _serialize_user(u), "message": message}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = _normalized_email(data.get("email"))
    u = User.query.filter(User.email == email, User.deleted_at.is_(None)).first()
    if not u or not u.check_password(data.get("password","")):
        return jsonify({"error":"credenciais inválidas"}), 401

    status = u.status or "pending"
    if status != "approved":
        message = "Conta aguardando aprovação do administrador." if status == "pending" else "Conta rejeitada. Fale com o administrador."
        return jsonify({"error": message, "status": status}), 403

    u.last_login_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message":"login ok", "user": _serialize_user(u)})


@bp.route("/<int:id>/approve", methods=["PATCH"])
def approve_user(id):
    u = User.query.get_or_404(id)
    if u.deleted_at is not None:
        return jsonify({"error":"Usuário não encontrado"}), 404

    now = datetime.now(timezone.utc)
    u.status = "approved"
    u.approved_at = u.approved_at or now
    u.rejected_at = None
    db.session.commit()
    return jsonify({"message":"Usuário aprovado", "user": _serialize_user(u)})


@bp.route("/<int:id>/reject", methods=["PATCH"])
def reject_user(id):
    u = User.query.get_or_404(id)
    if u.deleted_at is not None:
        return jsonify({"error":"Usuário não encontrado"}), 404

    now = datetime.now(timezone.utc)
    u.status = "rejected"
    u.rejected_at = u.rejected_at or now
    u.approved_at = None
    db.session.commit()
    return jsonify({"message":"Usuário rejeitado", "user": _serialize_user(u)})


@bp.route("/<int:id>", methods=["DELETE"])
def delete_user(id):
    u = User.query.get_or_404(id)
    if u.deleted_at is not None:
        return jsonify({"error":"Usuário não encontrado"}), 404

    if _normalized_email(u.email) == "adm@sementesdoamanha.com":
        return jsonify({"error":"A conta administradora padrão não pode ser excluída"}), 400

    u.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message":"Usuário deletado"}), 200

# app/routes/users.py
from flask import Blueprint, jsonify, request
from app.database import db
from app.models.users import User

bp = Blueprint("users", __name__, url_prefix="/users")

@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email, password = data.get("email"), data.get("password")
    if not email or not password:
        return jsonify({"error":"email e password são obrigatórios"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error":"email já cadastrado"}), 400
    u = User(email=email, name=data.get("name"), role=data.get("role","user"))
    u.set_password(password)
    db.session.add(u); db.session.commit()
    return jsonify({"id": u.id, "message":"Usuário cadastrado"}), 201

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    u = User.query.filter_by(email=data.get("email")).first()
    if not u or not u.check_password(data.get("password","")):
        return jsonify({"error":"credenciais inválidas"}), 401
    return jsonify({"message":"login ok", "user":{"id":u.id,"email":u.email,"role":u.role}})

@bp.route("/<int:id>", methods=["DELETE"])
def delete_user(id):

    u = User.query.get_or_404(id)

    if not u:
        return jsonify({"error":"Usuário não encontrado"}), 404

    db.session.delete(u)
    db.session.commit()
    return jsonify({"message":"Usuário deletado"}), 200
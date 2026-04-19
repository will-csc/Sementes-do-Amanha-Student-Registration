# app/routes/main.py
from flask import Blueprint, jsonify

bp = Blueprint("main", __name__)

@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Sementes do Amanhã API"}), 200

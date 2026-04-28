from flask import Blueprint, jsonify, request
from app.database import db
from app.models.transport import StudentTransporte

bp = Blueprint("transport", __name__, url_prefix="/transport")

@bp.route("/<int:student_id>", methods=["GET"])
def get_transp(student_id):
    t = StudentTransporte.query.filter_by(student_id=student_id).first()
    if not t:
        return jsonify({
            "student_id": student_id,
            "utiliza_van": None,
            "endereco_rota": None,
            "observacoes": None
        })
    return jsonify({
        "student_id": student_id,
        "utiliza_van": t.utiliza_van,
        "endereco_rota": t.endereco_rota,
        "observacoes": t.observacoes
    })

@bp.route("/<int:student_id>", methods=["PUT", "PATCH"])
def upsert_transp(student_id):
    data = request.get_json() or {}
    utiliza_van = data.get("utiliza_van")

    if utiliza_van and utiliza_van not in ("Sim", "Não", "Lista de espera"):
        return jsonify({"error": "utiliza_van inválido (Sim|Não|Lista de espera)"}), 400

    t = StudentTransporte.query.filter_by(student_id=student_id).first()
    if t is None:
        t = StudentTransporte(student_id=student_id)
        db.session.add(t)

    for k in ("utiliza_van", "endereco_rota", "observacoes"):
        if k in data:
            setattr(t, k, data[k])

    db.session.commit()
    return jsonify({"message": "Transporte salvo"})

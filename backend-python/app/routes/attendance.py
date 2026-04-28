from flask import Blueprint, jsonify, request
from app.database import db
from app.models.students import Student
from app.models.attendance import StudentAttendance
from app.services.turma import calcular_turma
from sqlalchemy import func, case, extract
from dateutil import parser

bp = Blueprint("attendance", __name__, url_prefix="/attendance")


@bp.route("/call", methods=["GET"])
def call():
    turma = request.args.get("turma")
    data_str = request.args.get("data")

    if not turma or not data_str:
        return jsonify({"error": "turma e data são obrigatórios"}), 400

    data = parser.parse(data_str).date()

    alunos = Student.query.order_by(Student.nome_completo.asc()).all()
    alunos = [s for s in alunos if s.data_nascimento and calcular_turma(s.data_nascimento) == turma]
    ids = [s.id for s in alunos] or [-1]

    marcacoes = {
        a.student_id: a.status
        for a in StudentAttendance.query.filter(
            StudentAttendance.data == data,
            StudentAttendance.student_id.in_(ids)
        ).all()
    }

    return jsonify([
        {
            "id": s.id,
            "nome": s.nome_completo,
            "status": marcacoes.get(s.id)
        }
        for s in alunos
    ])


@bp.route("", methods=["POST"])
def marcar():
    payload = request.get_json() or {}

    if "data" not in payload or "marcacoes" not in payload:
        return jsonify({"error": "data e marcacoes são obrigatórios"}), 400

    data = parser.parse(payload["data"]).date()

    for m in payload["marcacoes"]:
        sid = m["student_id"]
        status = m["status"]

        if status not in ("Presença", "Falta"):
            return jsonify({"error": "status inválido (Presença|Falta)"}), 400

        att = StudentAttendance.query.filter_by(student_id=sid, data=data).first()

        if att:
            att.status = status
        else:
            db.session.add(StudentAttendance(student_id=sid, data=data, status=status))

    db.session.commit()
    return jsonify({"message": "Frequência registrada"}), 201


@bp.route("/monthly", methods=["GET"])
def monthly():
    try:
        mes = int(request.args.get("mes"))
        ano = int(request.args.get("ano"))
    except (TypeError, ValueError):
        return jsonify({"error": "mes e ano são obrigatórios (inteiros)"}), 400

    alunos = Student.query.all()
    ids = [s.id for s in alunos] or [-1]

    agreg = db.session.query(
        StudentAttendance.student_id,
        func.count(StudentAttendance.id).label("total"),
        func.sum(
            case(
                (StudentAttendance.status == "Presença", 1),
                else_=0
            )
        ).label("presencas")
    ).filter(
        StudentAttendance.student_id.in_(ids),
        extract("month", StudentAttendance.data) == mes,
        extract("year", StudentAttendance.data) == ano
    ).group_by(StudentAttendance.student_id).all()

    mapa = {
        r.student_id: {
            "total": r.total,
            "pres": int(r.presencas or 0)
        }
        for r in agreg
    }

    res = []
    for s in alunos:
        tot = mapa.get(s.id, {}).get("total", 0)
        pres = mapa.get(s.id, {}).get("pres", 0)
        perc = round((pres / tot) * 100, 2) if tot else 0.0

        res.append({
            "id": s.id,
            "nome": s.nome_completo,
            "total_aulas": tot,
            "presencas": pres,
            "percentual_presenca": perc
        })

    res.sort(key=lambda x: x["nome"])
    return jsonify(res)

import os
import re
from datetime import datetime

from dateutil import parser
from flask import Blueprint, jsonify, request, send_file
from sqlalchemy import func, text

from app.database import db
from app.models.students import (
    Student,
    StudentAuditEvent,
    StudentBeneficio,
    StudentInteracaoSocial,
    StudentLocalLazer,
    StudentMembroFamiliar,
    StudentPessoaAutorizada,
    StudentResponsavelLegal,
    StudentServicoUtilizado,
)
from app.models.transport import StudentTransporte
from app.models.users import User
from app.services.document_service import preencher_documento

bp = Blueprint("students", __name__, url_prefix="/students")
stats_bp = Blueprint("student_stats", __name__)
audit_bp = Blueprint("student_audit", __name__)


DATE_FIELDS = {"data_nascimento"}
BOOL_FIELDS = {
    "tem_problema_saude",
    "tem_restricoes",
    "usa_medicamentos",
    "tem_alergias",
    "tem_deficiencia",
    "tem_supervisao",
    "termo_responsabilidade",
    "autorizacao_imagem",
}
INT_FIELDS = {"idade"}
RELATED_LIST_FIELDS = {
    "responsaveis_legais",
    "membros_familiares",
    "pessoas_autorizadas",
    "beneficios",
    "interacao_social",
    "locais_lazer",
    "servicos_utilizados",
}
ALLOWED_FIELDS = {
    "nome_completo",
    "data_nascimento",
    "idade",
    "naturalidade",
    "raca_cor",
    "sexo",
    "rg",
    "cpf",
    "nis",
    "certidao_termo",
    "certidao_folha",
    "certidao_livro",
    "endereco_cep",
    "endereco_logradouro",
    "endereco_numero",
    "endereco_complemento",
    "endereco_bairro",
    "endereco_cidade",
    "endereco_uf",
    "nome_pai",
    "nome_mae",
    "cras_referencia",
    "estado_civil_pais",
    "contato_conjuge_nome",
    "contato_conjuge_telefone",
    "tipo_domicilio",
    "renda_familiar",
    "escola_nome",
    "escola_serie",
    "escola_ano",
    "escola_professor",
    "escola_periodo",
    "historico_escolar",
    "ubs_referencia",
    "tem_problema_saude",
    "problema_saude_descricao",
    "tem_restricoes",
    "restricoes_descricao",
    "usa_medicamentos",
    "medicamentos_descricao",
    "tem_alergias",
    "alergias_descricao",
    "acompanhamentos",
    "tem_deficiencia",
    "deficiencia_descricao",
    "tem_supervisao",
    "supervisao_descricao",
    "atividades_extras",
    "termo_responsabilidade",
    "autorizacao_imagem",
    "autorizacao_saida",
}


def _camel_to_snake(value):
    if not isinstance(value, str):
        return value
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    return value.replace("-", "_").lower()


def _snake_to_camel(value):
    if not isinstance(value, str) or "_" not in value:
        return value
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


def _convert_keys(value, key_fn):
    if isinstance(value, dict):
        return {key_fn(k): _convert_keys(v, key_fn) for k, v in value.items()}
    if isinstance(value, list):
        return [_convert_keys(item, key_fn) for item in value]
    return value


def _string_or_none(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return str(value)


def _actor_headers():
    user_id = request.headers.get("X-User-Id", type=int)
    email = request.headers.get("X-User-Email", type=str) or "api@local"
    return {
        "created_by_user_id": user_id,
        "created_by_email": email,
        "updated_by_user_id": user_id,
        "updated_by_email": email,
    }


def _actor_email():
    return request.headers.get("X-User-Email", type=str) or "api@local"


def _parse_bool(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "sim", "yes"}:
            return True
        if lowered in {"false", "0", "nao", "não", "no"}:
            return False
    return value


def _get_request_payload():
    return _convert_keys(request.get_json(silent=True) or {}, _camel_to_snake)


def _normalize_student_payload(data):
    normalized = {}

    for key, value in data.items():
        if key not in ALLOWED_FIELDS:
            continue

        if value == "":
            value = None

        if key in DATE_FIELDS and value:
            value = parser.parse(value).date()
        elif key in BOOL_FIELDS:
            value = _parse_bool(value)
        elif key in INT_FIELDS and value is not None:
            value = int(value)

        normalized[key] = value

    return normalized


def _normalize_related_payload(payload):
    normalized = _convert_keys(payload, _camel_to_snake)

    for index, item in enumerate(normalized.get("responsaveis_legais", []), start=1):
        if not isinstance(item, dict):
            continue
        item["posicao"] = index
        if item.get("data_nascimento"):
            item["data_nascimento"] = parser.parse(item["data_nascimento"]).date()
        else:
            item["data_nascimento"] = None

    return normalized


def _insert_related(student_id, payload):
    normalized = _normalize_related_payload(payload)

    for item in normalized.get("responsaveis_legais", []):
        db.session.add(StudentResponsavelLegal(student_id=student_id, **item))

    for item in normalized.get("membros_familiares", []):
        db.session.add(StudentMembroFamiliar(student_id=student_id, **item))

    for item in normalized.get("pessoas_autorizadas", []):
        db.session.add(StudentPessoaAutorizada(student_id=student_id, **item))

    for beneficio in {item for item in normalized.get("beneficios", []) if item}:
        db.session.add(StudentBeneficio(student_id=student_id, beneficio=beneficio))

    for item in {value for value in normalized.get("interacao_social", []) if value}:
        db.session.add(StudentInteracaoSocial(student_id=student_id, item=item))

    for item in {value for value in normalized.get("locais_lazer", []) if value}:
        db.session.add(StudentLocalLazer(student_id=student_id, item=item))

    for item in {value for value in normalized.get("servicos_utilizados", []) if value}:
        db.session.add(StudentServicoUtilizado(student_id=student_id, item=item))


def _replace_related(student_id, payload):
    StudentResponsavelLegal.query.filter_by(student_id=student_id).delete()
    StudentMembroFamiliar.query.filter_by(student_id=student_id).delete()
    StudentPessoaAutorizada.query.filter_by(student_id=student_id).delete()
    StudentBeneficio.query.filter_by(student_id=student_id).delete()
    StudentInteracaoSocial.query.filter_by(student_id=student_id).delete()
    StudentLocalLazer.query.filter_by(student_id=student_id).delete()
    StudentServicoUtilizado.query.filter_by(student_id=student_id).delete()
    _insert_related(student_id, payload)


def _serialize_value(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _serialize_student_summary(student):
    return {
        "id": str(student.id),
        "nomeCompleto": student.nome_completo,
        "idade": student.idade,
        "nomeMae": student.nome_mae,
        "escolaNome": student.escola_nome,
        "sexo": student.sexo,
        "cpf": student.cpf,
    }


def _load_student_graph(student_id):
    student = Student.query.get_or_404(student_id)
    responsaveis = (
        StudentResponsavelLegal.query.filter_by(student_id=student_id)
        .order_by(StudentResponsavelLegal.posicao.asc(), StudentResponsavelLegal.id.asc())
        .all()
    )
    membros = StudentMembroFamiliar.query.filter_by(student_id=student_id).order_by(StudentMembroFamiliar.id.asc()).all()
    autorizadas = (
        StudentPessoaAutorizada.query.filter_by(student_id=student_id)
        .order_by(StudentPessoaAutorizada.id.asc())
        .all()
    )
    beneficios = StudentBeneficio.query.filter_by(student_id=student_id).all()
    interacao = StudentInteracaoSocial.query.filter_by(student_id=student_id).all()
    lazer = StudentLocalLazer.query.filter_by(student_id=student_id).all()
    servicos = StudentServicoUtilizado.query.filter_by(student_id=student_id).all()
    transporte = StudentTransporte.query.filter_by(student_id=student_id).first()
    return student, responsaveis, membros, autorizadas, beneficios, interacao, lazer, servicos, transporte


def _serialize_student_full(
    student,
    responsaveis,
    membros,
    autorizadas,
    beneficios,
    interacao,
    lazer,
    servicos,
    transporte,
):
    payload = {
        "id": str(student.id),
        "nome_completo": student.nome_completo,
        "data_nascimento": _serialize_value(student.data_nascimento),
        "idade": student.idade,
        "naturalidade": student.naturalidade,
        "raca_cor": student.raca_cor,
        "sexo": student.sexo,
        "rg": student.rg,
        "cpf": student.cpf,
        "nis": student.nis,
        "certidao_termo": student.certidao_termo,
        "certidao_folha": student.certidao_folha,
        "certidao_livro": student.certidao_livro,
        "endereco_cep": student.endereco_cep,
        "endereco_logradouro": student.endereco_logradouro,
        "endereco_numero": student.endereco_numero,
        "endereco_complemento": student.endereco_complemento,
        "endereco_bairro": student.endereco_bairro,
        "endereco_cidade": student.endereco_cidade,
        "endereco_uf": student.endereco_uf,
        "nome_pai": student.nome_pai,
        "nome_mae": student.nome_mae,
        "cras_referencia": student.cras_referencia,
        "estado_civil_pais": student.estado_civil_pais,
        "contato_conjuge_nome": student.contato_conjuge_nome,
        "contato_conjuge_telefone": student.contato_conjuge_telefone,
        "tipo_domicilio": student.tipo_domicilio,
        "renda_familiar": student.renda_familiar,
        "escola_nome": student.escola_nome,
        "escola_serie": student.escola_serie,
        "escola_ano": student.escola_ano,
        "escola_professor": student.escola_professor,
        "escola_periodo": student.escola_periodo,
        "historico_escolar": student.historico_escolar,
        "ubs_referencia": student.ubs_referencia,
        "tem_problema_saude": student.tem_problema_saude,
        "problema_saude_descricao": student.problema_saude_descricao,
        "tem_restricoes": student.tem_restricoes,
        "restricoes_descricao": student.restricoes_descricao,
        "usa_medicamentos": student.usa_medicamentos,
        "medicamentos_descricao": student.medicamentos_descricao,
        "tem_alergias": student.tem_alergias,
        "alergias_descricao": student.alergias_descricao,
        "acompanhamentos": student.acompanhamentos,
        "tem_deficiencia": student.tem_deficiencia,
        "deficiencia_descricao": student.deficiencia_descricao,
        "tem_supervisao": student.tem_supervisao,
        "supervisao_descricao": student.supervisao_descricao,
        "atividades_extras": student.atividades_extras,
        "termo_responsabilidade": student.termo_responsabilidade,
        "autorizacao_imagem": student.autorizacao_imagem,
        "autorizacao_saida": student.autorizacao_saida,
        "created_at": _serialize_value(student.created_at),
        "created_by_user_id": _string_or_none(student.created_by_user_id),
        "created_by_email": student.created_by_email,
        "updated_at": _serialize_value(student.updated_at),
        "updated_by_user_id": _string_or_none(student.updated_by_user_id),
        "updated_by_email": student.updated_by_email,
        "responsaveis_legais": [
            {
                "id": str(item.id),
                "posicao": item.posicao,
                "nome": item.nome,
                "data_nascimento": _serialize_value(item.data_nascimento),
                "rg": item.rg,
                "cpf": item.cpf,
                "celular": item.celular,
                "operadora": item.operadora,
                "whatsapp": item.whatsapp,
                "fixo": item.fixo,
                "parentesco": item.parentesco,
            }
            for item in responsaveis
        ],
        "membros_familiares": [
            {
                "id": str(item.id),
                "nome": item.nome,
                "parentesco": item.parentesco,
                "profissao": item.profissao,
                "renda": item.renda,
            }
            for item in membros
        ],
        "pessoas_autorizadas": [
            {
                "id": str(item.id),
                "nome": item.nome,
                "documento": item.documento,
                "parentesco": item.parentesco,
                "telefone": item.telefone,
            }
            for item in autorizadas
        ],
        "beneficios": [item.beneficio for item in beneficios],
        "interacao_social": [item.item for item in interacao],
        "locais_lazer": [item.item for item in lazer],
        "servicos_utilizados": [item.item for item in servicos],
        "transporte": (
            {
                "utiliza_van": transporte.utiliza_van,
                "endereco_rota": transporte.endereco_rota,
                "observacoes": transporte.observacoes,
            }
            if transporte
            else None
        ),
    }
    return _convert_keys(payload, _snake_to_camel)


def _fetch_serialized_student(student_id):
    graph = _load_student_graph(student_id)
    return _serialize_student_full(*graph)


def _insert_audit_event(student_id, student_name, action, changed_fields=None):
    db.session.add(
        StudentAuditEvent(
            student_id=student_id,
            student_name=student_name,
            action=action,
            by_user_id=request.headers.get("X-User-Id", type=int),
            by_email=_actor_email(),
            changed_fields=changed_fields or None,
        )
    )


def _changed_fields(before, after):
    ignored = {"createdAt", "createdByUserId", "createdByEmail", "updatedAt", "updatedByUserId", "updatedByEmail"}
    return sorted(key for key in after.keys() if key not in ignored and before.get(key) != after.get(key))


def _document_filename(student_name, student_cpf):
    date_part = datetime.now().strftime("%Y-%m-%d")
    first_name = (student_name or "Aluno").strip().split()[0]
    safe_first_name = re.sub(r'[<>:"/\\|?*]+', "", first_name).strip() or "Aluno"
    safe_cpf = re.sub(r"[^\d]+", "", student_cpf or "")
    return f"{date_part} {safe_first_name} - {safe_cpf or 'sem-cpf'}.docx"


def _document_context(student_payload):
    context = {}
    snake_payload = _convert_keys(student_payload, _camel_to_snake)

    for key, value in snake_payload.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            context[key] = "" if value is None else value
            context[_snake_to_camel(key)] = "" if value is None else value

    responsaveis = snake_payload.get("responsaveis_legais") or []
    for index, responsavel in enumerate(responsaveis[:2], start=1):
        if not isinstance(responsavel, dict):
            continue
        for key, value in responsavel.items():
            marker = f"responsavel_{index}_{key}"
            context[marker] = "" if value is None else value
            context[_snake_to_camel(marker)] = "" if value is None else value

    context.setdefault("nome_aluno", snake_payload.get("nome_completo") or "")
    context.setdefault("cpf_aluno", snake_payload.get("cpf") or "")
    return context


@bp.route("", methods=["POST"])
def create_student():
    data = _get_request_payload()

    if not (data.get("nome_completo") or "").strip():
        return jsonify({"error": "nomeCompleto e obrigatorio"}), 400

    normalized = _normalize_student_payload(data)
    normalized.update(_actor_headers())

    try:
        student = Student(**normalized)
        db.session.add(student)
        db.session.flush()

        _insert_related(student.id, data)
        _insert_audit_event(student.id, student.nome_completo, "create")

        db.session.commit()
        return jsonify(_fetch_serialized_student(student.id)), 201
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": f"erro ao criar aluno: {exc}"}), 500


@bp.route("", methods=["GET"])
def list_students():
    q = Student.query

    nome = request.args.get("nome") or request.args.get("nomeCompleto")
    escola = request.args.get("escola_nome") or request.args.get("escolaNome")
    bairro = request.args.get("endereco_bairro") or request.args.get("enderecoBairro")

    if nome:
        q = q.filter(Student.nome_completo.ilike(f"%{nome}%"))
    if cpf := request.args.get("cpf"):
        q = q.filter(Student.cpf == cpf)
    if escola:
        q = q.filter(Student.escola_nome == escola)
    if bairro:
        q = q.filter(Student.endereco_bairro == bairro)

    rows = q.order_by(Student.id.desc()).limit(200).all()
    return jsonify([_serialize_student_summary(student) for student in rows])


@bp.route("/<int:student_id>", methods=["GET"])
def get_student(student_id):
    return jsonify(_fetch_serialized_student(student_id))


@bp.route("/<int:student_id>", methods=["PATCH", "PUT"])
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = _get_request_payload()
    normalized = _normalize_student_payload(data)

    try:
        before = _fetch_serialized_student(student_id)

        for key, value in normalized.items():
            if hasattr(student, key):
                setattr(student, key, value)

        if any(key in data for key in RELATED_LIST_FIELDS):
            _replace_related(student_id, data)

        student.updated_by_user_id = request.headers.get("X-User-Id", type=int)
        student.updated_by_email = _actor_email()

        db.session.flush()
        after = _fetch_serialized_student(student_id)
        changed_fields = _changed_fields(before, after)
        if changed_fields:
            _insert_audit_event(student_id, after.get("nomeCompleto") or student.nome_completo, "update", changed_fields)

        db.session.commit()
        return jsonify(after)
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": f"erro ao atualizar aluno: {exc}"}), 500


@bp.route("/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)

    try:
        db.session.delete(student)
        db.session.commit()
        return ("", 204)
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": f"erro ao excluir aluno: {exc}"}), 500


@bp.route("/<int:student_id>/contract", methods=["GET"])
def download_contract(student_id):
    try:
        student_payload = _fetch_serialized_student(student_id)
        filename = _document_filename(student_payload.get("nomeCompleto") or "", student_payload.get("cpf") or "")
        file_buffer = preencher_documento("termo_de_responsabilidade.docx", _document_context(student_payload))

        storage_dir = os.getenv("CONTRACTS_DIR", "storage/contracts")
        os.makedirs(storage_dir, exist_ok=True)
        full_path = os.path.join(storage_dir, filename)
        with open(full_path, "wb") as output_file:
            output_file.write(file_buffer.getbuffer())
        file_buffer.seek(0)

        return send_file(
            file_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as exc:
        return jsonify({"error": f"erro ao gerar contrato: {exc}"}), 500


@audit_bp.route("/student-audit-events", methods=["GET"])
def list_audit_events():
    rows = (
        StudentAuditEvent.query.order_by(StudentAuditEvent.at.desc(), StudentAuditEvent.id.desc()).limit(1000).all()
    )
    return jsonify(
        [
            {
                "id": str(item.id),
                "studentId": str(item.student_id),
                "studentName": item.student_name,
                "action": item.action,
                "at": _serialize_value(item.at),
                "byEmail": item.by_email,
                "changedFields": item.changed_fields,
            }
            for item in rows
        ]
    )


@stats_bp.route("/stats/students", methods=["GET"])
def get_students_stats():
    total_students = db.session.query(func.count(Student.id)).scalar() or 0
    schools = (
        db.session.query(func.count(func.distinct(Student.escola_nome)))
        .filter(Student.escola_nome.isnot(None))
        .filter(func.btrim(Student.escola_nome) != "")
        .scalar()
        or 0
    )
    this_month = (
        db.session.query(func.count(Student.id))
        .filter(Student.created_at >= func.date_trunc("month", func.now()))
        .scalar()
        or 0
    )
    return jsonify({"totalStudents": total_students, "schools": schools, "thisMonth": this_month})


@stats_bp.route("/stats/admin", methods=["GET"])
def get_admin_stats():
    try:
        approved_accounts = db.session.execute(
            text("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND COALESCE(status, 'approved') = 'approved'")
        ).scalar_one()
    except Exception:
        approved_accounts = db.session.query(func.count(User.id)).filter(User.deleted_at.is_(None)).scalar() or 0

    try:
        pending_accounts = db.session.execute(
            text("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND COALESCE(status, 'approved') = 'pending'")
        ).scalar_one()
    except Exception:
        pending_accounts = 0

    alunos_adicionados = (
        db.session.query(func.count(StudentAuditEvent.id)).filter(StudentAuditEvent.action == "create").scalar() or 0
    )
    alteracoes_em_alunos = (
        db.session.query(func.count(StudentAuditEvent.id)).filter(StudentAuditEvent.action == "update").scalar() or 0
    )

    return jsonify(
        {
            "approvedAccounts": approved_accounts,
            "pendingAccounts": pending_accounts,
            "alunosAdicionados": alunos_adicionados,
            "alteracoesEmAlunos": alteracoes_em_alunos,
        }
    )

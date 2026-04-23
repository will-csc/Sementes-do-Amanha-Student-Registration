from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento, mapear_student_para_word

bp = Blueprint("documents", __name__, url_prefix="/documents")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DOCS_DIR = BASE_DIR / "docs" / "forms"

DOCUMENTS = {
    "ficha_acolhimento": {
        "filename": "ficha_de_acolhimento.docx",
        "label": "Ficha de Acolhimento"
    }
}


def marcar_booleano(dados, campo_front, campo_doc):
    valor = dados.get(campo_front)

    dados[f"{campo_doc}_sim"] = "X" if valor == "sim" else ""
    dados[f"{campo_doc}_nao"] = "X" if valor == "nao" else ""


def marcar_unico(dados, campo, opcoes):
    valor = dados.get(campo)

    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if valor == opcao else ""


def marcar_multiplos(dados, campo, opcoes):
    valores = dados.get(campo, [])

    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if opcao in valores else ""


@bp.route("/<slug>/emitir", methods=["POST"])
def emitir_word(slug):
    meta = DOCUMENTS.get(slug)
    if not meta:
        abort(404)

    dados_front = request.json
    dados_word = mapear_student_para_word(dados_front)

    dados = {**dados_front, **dados_word}

    try:
        # ===== RADIO =====
        marcar_unico(dados, "origem", [
            "demanda", "conselho", "pais", "internet", "cras", "outros"
        ])

        marcar_unico(dados, "tipo_domicilio", [
            "proprio", "alugado", "cedido", "outros"
        ])

        marcar_unico(dados, "estado_civil", [
            "casado", "uniao_estavel", "separados",
            "divorciados", "viuvo", "outro"
        ])

        marcar_unico(dados, "vai", [
            "sozinho", "acompanhado"
        ])

        # ===== BOOLEANOS =====
        marcar_booleano(dados, "contato_conjuge", "contato_conjuge")
        marcar_booleano(dados, "recebe_beneficio", "recebe_beneficio")

        # ===== CHECKBOX =====
        marcar_multiplos(dados, "beneficios", [
            "bolsa_familia", "renda_cidada", "bpc", "eventuais"
        ])

        caminho = DOCS_DIR / meta["filename"]
        arquivo = preencher_documento(str(caminho), dados)

        return send_file(
            arquivo,
            as_attachment=True,
            download_name=f"{slug}.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento, mapear_student_para_word

bp = Blueprint("documents", __name__, url_prefix="/documents")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DOCS_DIR = BASE_DIR / "docs" / "forms"

DOCUMENTS = {
    "ficha_acolhimento": {
        "filename": "ficha_de_acolhimento.docx",
    }
}


def marcar_booleano(dados, campo):
    valor = dados.get(campo)
    dados[f"{campo}_sim"] = "X" if valor == "sim" else ""
    dados[f"{campo}_nao"] = "X" if valor == "nao" else ""


def marcar_unico(dados, campo, opcoes):
    valor = dados.get(campo)
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if valor == opcao else ""


# 🔥 NOVA FUNÇÃO (corrige prefixo tipo servico_ e atendimento_)
def marcar_multiplos_prefixo(dados, campo, prefixo, opcoes):
    valores = dados.get(campo, [])
    for opcao in opcoes:
        dados[f"{prefixo}_{opcao}"] = "X" if opcao in valores else ""


def marcar_multiplos(dados, campo, opcoes):
    valores = dados.get(campo, [])
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if opcao in valores else ""


@bp.route("/<slug>/emitir", methods=["POST"])
def emitir_word(slug):
    meta = DOCUMENTS.get(slug)
    if not meta:
        abort(404)

    dados_front = request.get_json()
    if not dados_front:
        return jsonify({"error": "JSON inválido"}), 400

    dados_word = mapear_student_para_word(dados_front)
    dados = {**dados_front, **dados_word}

    try:
        # ===== BÁSICOS =====
        marcar_unico(dados, "origem", ["demanda","conselho","pais","internet","cras","outros"])
        marcar_unico(dados, "tipo_domicilio", ["proprio","alugado","cedido","outros"])

        # 🔥 FIX ESTADO CIVIL
        marcar_unico(dados, "estado_civil", [
            "casado","uniao","separado","divorciado","viuvo","outro"
        ])

        marcar_unico(dados, "vai", ["sozinho","acompanhado"])

        marcar_booleano(dados, "contato_conjuge")
        marcar_booleano(dados, "recebe_beneficio")

        marcar_multiplos(dados, "beneficios", ["bolsa_familia","renda_cidada","bpc","eventuais"])

        # ===== ESCOLAR =====
        marcar_booleano(dados, "matriculado")
        marcar_booleano(dados, "parou_escola")

        # ===== SAÚDE =====
        marcar_booleano(dados, "problema_saude")
        marcar_booleano(dados, "restricao_alimentar")
        marcar_booleano(dados, "restricao_fisica")
        marcar_booleano(dados, "bronquite")
        marcar_booleano(dados, "falta_ar")
        marcar_booleano(dados, "odontologico")
        marcar_booleano(dados, "deficiencia")
        marcar_booleano(dados, "oftalmologico")
        marcar_booleano(dados, "usa_oculos")

        # 🔥 ATENDIMENTO (PREFIXO CORRETO)
        marcar_multiplos_prefixo(dados, "atendimentos", "atendimento", [
            "ubs","caps","hospital","ser","outros"
        ])

        # ===== CONVÍVIO =====
        marcar_booleano(dados, "fica_sozinho")

        # Frequência (nunca, raramente, sempre)
        valor_freq = dados.get("interage_frequencia")
        for opcao in ["nunca", "raramente", "sempre"]:
            dados[f"interage_{opcao}"] = "X" if valor_freq == opcao else ""

        # Com quem (familia, amigos, parentes)
        valores_com = dados.get("interage_com", [])
        for opcao in ["familia", "amigos", "parentes"]:
            dados[f"interage_{opcao}"] = "X" if opcao in valores_com else ""

        marcar_multiplos(dados, "onde", [
            "casa","parentes","rua","pracas","redes",
            "telefone","festas","religioso","passeios","outros"
        ])

        # ===== ATIVIDADES =====
        marcar_booleano(dados, "outras_atividades")
        marcar_multiplos(dados, "atividade", ["esportes","cultura","nucleo","ong","outros"])

        # 🔥 SERVIÇOS (PREFIXO CORRETO)
        marcar_multiplos_prefixo(dados, "servicos", "servico", [
            "cras","creas","creas_medidas","forum","conselho","fundacao",
            "centro_dia","saica","ilpi","centro_pop","seas",
            "delegacia","delegacia_mulher","centro_mulher",
            "pronto_socorro","caps","sistema_prisional","egresso"
        ])

        marcar_booleano(dados, "situacao_prioritaria")

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
from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento, mapear_student_para_word
from zipfile import ZipFile
import tempfile
from datetime import datetime

bp = Blueprint("documents", __name__, url_prefix="/documents")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DOCS_DIR = BASE_DIR / "docs" / "forms"

DOCUMENTS = {
    "ficha_acolhimento": {
        "filename": "ficha_de_acolhimento.docx",
    },
    "termo_saida": {
        "filename": "termo_de_autorizacao_saida_desacompanhada.docx",
    },
    "termo_responsabilidade": {
        "filename": "termo_de_responsabilidade.docx",
    },
    "termo_imagem": {
        "filename": "termo_uso_de_imagem.docx",
    }
}

# Mantivemos apenas as funções necessárias para os outros termos (imagem e saída)
def marcar_unico(dados, campo, opcoes):
    valor = dados.get(campo)
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if valor == opcao else ""

def completar_dados(dados):
    dados["nome_crianca"] = dados.get("nomeCompleto", "")
    dados["nome_responsavel"] = dados.get("nomeMae") or dados.get("nomePai") or ""
    dados["rg_responsavel"] = dados.get("rg_responsavel", "")
    dados["cpf_responsavel"] = dados.get("cpf_responsavel", "")
    dados["endereco_responsavel"] = dados.get("enderecoLogradouro", "")
    dados["nacionalidade_crianca"] = dados.get("nacionalidade_crianca", "brasileira")
    dados["idade_crianca"] = dados.get("idade", "")
    dados["periodo_atividades"] = dados.get("periodo_escolar", "")

    meses_pt = {
        1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
        5: "maio", 6: "junho", 7: "julho", 8: "agosto",
        9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
    }
    
    hoje = datetime.now()
    dados["dia"] = hoje.strftime("%d")
    dados["mes"] = meses_pt[hoje.month]
    dados["ano"] = hoje.strftime("%Y")

    responsaveis = dados.get("pessoasAutorizadas", []) or []
    for i in range(5):
        if i < len(responsaveis):
            dados[f"resp_{i+1}_nome"] = responsaveis[i].get("nome", "")
            dados[f"resp_{i+1}_parentesco"] = responsaveis[i].get("parentesco", "")
        else:
            dados[f"resp_{i+1}_nome"] = ""
            dados[f"resp_{i+1}_parentesco"] = ""


@bp.route("/<slug>/emitir", methods=["POST"])
def emitir_word(slug):
    meta = DOCUMENTS.get(slug)
    if not meta:
        abort(404)

    dados_front = request.get_json()
    if not dados_front:
        return jsonify({"error": "JSON inválido"}), 400

    # O service mapear_student_para_word já resolve todos os booleanos e checkboxes da Ficha!
    dados_word = mapear_student_para_word(dados_front)
    dados = {**dados_front, **dados_word}

    try:
        # Preenche as marcações exclusivas dos Termos de Imagem e Saída
        marcar_unico(dados, "autorizacao_saida", ["autoriza", "nao_autoriza"])
        marcar_unico(dados, "autorizacao_imagem", ["autoriza", "nao_autoriza"])

        completar_dados(dados)

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


@bp.route("/emitir_todos", methods=["POST"])
def emitir_todos():
    dados_front = request.get_json()
    if not dados_front:
        return jsonify({"error": "JSON inválido"}), 400

    # O service já resolve as variáveis complexas
    dados_word = mapear_student_para_word(dados_front)
    dados = {**dados_front, **dados_word}

    try:
        # Preenche as marcações exclusivas dos Termos de Imagem e Saída
        marcar_unico(dados, "autorizacao_saida", ["autoriza", "nao_autoriza"])
        marcar_unico(dados, "autorizacao_imagem", ["autoriza", "nao_autoriza"])

        completar_dados(dados)

        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")

        with ZipFile(temp_zip.name, "w") as zipf:
            for slug, meta in DOCUMENTS.items():
                caminho = DOCS_DIR / meta["filename"]
                buffer = preencher_documento(str(caminho), dados)
                zipf.writestr(f"{slug}.docx", buffer.getvalue())

        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name="documentos.zip",
            mimetype="application/zip"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
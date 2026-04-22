from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento

bp = Blueprint("documents", __name__, url_prefix="/documents")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = BASE_DIR / "docs" / "forms"

DOCUMENTS = {
    "ficha_acolhimento": {
        "filename": "ficha_de_acolhimento.docx",
        "label": "Ficha de Acolhimento"
    },
    "termo_autorizacao_saida": {
        "filename": "termo_de_autorizacao_saida_desacompanhada.docx",
        "label": "Termo de Autorização de Saída Desacompanhada"
    },
    "termo_responsabilidade": {
        "filename": "termo_de_responsabilidade.docx",
        "label": "Termo de Responsabilidade"
    },
    "termo_uso_imagem": {
        "filename": "termo_uso_de_imagem.docx",
        "label": "Termo de Uso de Imagem"
    },
}

@bp.route("", methods=["GET"])
def list_documents():
    return jsonify([
        {
            "slug": slug,
            "label": meta["label"],
            "filename": meta["filename"],
            "download_url": f"/documents/{slug}/emitir"
        }
        for slug, meta in DOCUMENTS.items()
    ])

@bp.route("/<slug>/emit", methods=["POST"])
@bp.route("/<slug>/emitir", methods=["POST"])
def emitir_word(slug):
    meta = DOCUMENTS.get(slug)
    if not meta:
        abort(404)

    dados_do_formulario = request.json 

    try:

        valor_front = dados_do_formulario.get("autorizacaoSaida")

        if valor_front == "sim":
            dados_do_formulario["autorizacao_saida"] = "autoriza"
        elif valor_front == "nao":
            dados_do_formulario["autorizacao_saida"] = "nao_autoriza"

        marcar_opcoes(dados_do_formulario, "autorizacao_saida", ["autoriza", "nao_autoriza"])

        caminho_arquivo = DOCS_DIR / meta["filename"]
        arquivo_word = preencher_documento(str(caminho_arquivo), dados_do_formulario)

        return send_file(
            arquivo_word,
            as_attachment=True,
            download_name=f"{slug}_preenchido.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def marcar_opcoes(dados, campo, opcoes):
    valor = dados.get(campo)
    for opcao in opcoes:
        chave = f"{campo}_{opcao}"
        dados[chave] = "X" if valor == opcao else ""

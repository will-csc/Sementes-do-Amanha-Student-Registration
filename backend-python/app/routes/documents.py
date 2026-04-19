from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento

bp = Blueprint("documents", __name__, url_prefix="/documents")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = BASE_DIR / "docs"

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
        arquivo_word = preencher_documento(meta["filename"], dados_do_formulario)

        return send_file(
            arquivo_word,
            as_attachment=True,
            download_name=f"{slug}_preenchido.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from flask import Blueprint, jsonify, abort, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento, mapear_student_para_word
from zipfile import ZipFile
import tempfile
import os
from datetime import datetime
from io import BytesIO

bp = Blueprint("documents", __name__, url_prefix="/documents")

# Localização dos templates .docx
# Subimos níveis para garantir que encontre a pasta 'docs' na raiz do projeto
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

def marcar_unico(dados, campo, opcoes):
    """Transforma valores de rádio/select em 'X' para o Word."""
    valor = dados.get(campo)
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if valor == opcao else ""

def completar_dados(dados):
    """Garante que campos derivados e datas estejam preenchidos."""
    dados["nome_crianca"] = dados.get("nome_completo") or dados.get("nomeCompleto", "")
    dados["nome_responsavel"] = dados.get("nome_mae") or dados.get("nome_pai") or ""
    
    meses_pt = {
        1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
        5: "maio", 6: "junho", 7: "julho", 8: "agosto",
        9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
    }
    
    hoje = datetime.now()
    dados["dia"] = hoje.strftime("%d")
    dados["mes"] = meses_pt[hoje.month]
    dados["ano"] = hoje.strftime("%Y")

    autorizados = dados.get("pessoas_autorizadas") or dados.get("pessoasAutorizadas") or []
    for i in range(5):
        if i < len(autorizados):
            dados[f"resp_{i+1}_nome"] = autorizados[i].get("nome", "")
            dados[f"resp_{i+1}_parentesco"] = autorizados[i].get("parentesco", "")
        else:
            dados[f"resp_{i+1}_nome"] = ""
            dados[f"resp_{i+1}_parentesco"] = ""

@bp.route("/emitir_todos", methods=["POST", "OPTIONS"])
def emitir_todos():
    if request.method == "OPTIONS":
        return "", 200

    dados_front = request.get_json(silent=True)
    if not dados_front:
        return jsonify({"error": "Dados não enviados"}), 400

    try:
        dados_word = mapear_student_para_word(dados_front)
        dados = {**dados_front, **dados_word}
        
        marcar_unico(dados, "autorizacao_saida", ["sim", "nao", "somente-com-responsavel"])
        marcar_unico(dados, "autorizacao_imagem", ["autoriza", "nao_autoriza"])
        completar_dados(dados)

        memory_file = BytesIO()
        with ZipFile(memory_file, 'w') as zf:
            for slug, meta in DOCUMENTS.items():
                caminho_template = DOCS_DIR / meta["filename"]
                
                if caminho_template.exists():
                    # Chamada corrigida aqui também para manter o padrão
                    doc_buffer = preencher_documento(str(caminho_template), dados)
                    zf.writestr(f"{slug}.docx", doc_buffer.getvalue())
                else:
                    print(f"Aviso: Template não encontrado em {caminho_template}")

        memory_file.seek(0)
        
        return send_file(
            memory_file,
            as_attachment=True,
            download_name="documentos_aluno.zip",
            mimetype="application/zip"
        )

    except Exception as e:
        import traceback
        print("--- ERRO NO BACKEND ---")
        traceback.print_exc() # Isso vai mostrar a linha exata e o arquivo Word culpado
        return jsonify({"error": str(e)}), 500

@bp.route("/<slug>", methods=["POST", "OPTIONS"])
def emitir_word(slug):
    if request.method == "OPTIONS":
        return "", 200

    target_slug = "ficha_acolhimento" if slug == "emitir_word" else slug
    meta = DOCUMENTS.get(target_slug)
    
    if not meta:
        return jsonify({"error": f"Documento '{target_slug}' não encontrado"}), 404

    dados_front = request.get_json(silent=True)
    if not dados_front:
        return jsonify({"error": "Dados não enviados"}), 400

    try:
        dados_word = mapear_student_para_word(dados_front)
        dados = {**dados_front, **dados_word}
        
        marcar_unico(dados, "autorizacao_saida", ["sim", "nao", "somente-com-responsavel"])
        marcar_unico(dados, "autorizacao_imagem", ["autoriza", "nao_autoriza"])
        completar_dados(dados)

        caminho_template = DOCS_DIR / meta["filename"]
        
        # IMPORTANTE: Passando caminho e dados para a função
        output = preencher_documento(str(caminho_template), dados)

        return send_file(
            output,
            as_attachment=True,
            download_name=f"{target_slug}.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        print(f"Erro ao gerar documento: {str(e)}")
        return jsonify({"error": str(e)}), 500


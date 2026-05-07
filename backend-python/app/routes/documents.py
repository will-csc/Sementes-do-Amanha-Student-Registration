from flask import Blueprint, jsonify, request, send_file
from pathlib import Path
from app.services.document_service import preencher_documento, mapear_student_para_word
from zipfile import ZipFile
from datetime import datetime
from io import BytesIO

bp = Blueprint("documents", __name__, url_prefix="/documents")

def _resolve_docs_dir():
    project_root = Path(__file__).resolve().parents[2]
    candidates = [
        project_root / "docs" / "forms",
        project_root / "app" / "docs" / "forms",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


DOCS_DIR = _resolve_docs_dir()
TERMOS_PATH = DOCS_DIR / "termos.txt"

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


def _template_path(filename):
    caminho_template = DOCS_DIR / filename
    if not caminho_template.exists():
        raise FileNotFoundError(f"Template não encontrado em '{caminho_template}'")
    return caminho_template


def _parse_terms_file():
    if not TERMOS_PATH.exists():
        return {}

    sections = {}
    current_key = None
    buffer = []

    with TERMOS_PATH.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.rstrip()
            normalized = line.strip().lower()
            if normalized.startswith("termo "):
                if current_key:
                    sections[current_key] = "\n".join(item for item in buffer if item.strip()).strip()
                current_key = normalized.replace("termo ", "", 1).replace(" ", "_")
                buffer = []
                continue
            buffer.append(line)

    if current_key:
        sections[current_key] = "\n".join(item for item in buffer if item.strip()).strip()

    if "saida" in sections and "pessoas_autorizadas" not in sections:
        sections["pessoas_autorizadas"] = sections["saida"]

    return sections

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

    autoriza_imagem = dados.get("autorizacaoImagem")
    if autoriza_imagem is None:
        autoriza_imagem = dados.get("autorizacao_imagem")
    dados["autorizacao_imagem_autoriza"] = "X" if autoriza_imagem is True else ""
    dados["autorizacao_imagem_nao_autoriza"] = "X" if autoriza_imagem is False else ""

    autorizados = dados.get("pessoas_autorizadas") or dados.get("pessoasAutorizadas") or []
    for i in range(5):
        if i < len(autorizados):
            dados[f"resp_{i+1}_nome"] = autorizados[i].get("nome", "")
            dados[f"resp_{i+1}_parentesco"] = autorizados[i].get("parentesco", "")
        else:
            dados[f"resp_{i+1}_nome"] = ""
            dados[f"resp_{i+1}_parentesco"] = ""


@bp.route("/termos", methods=["GET"])
def listar_termos():
    return jsonify(_parse_terms_file())

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
                caminho_template = _template_path(meta["filename"])
                doc_buffer = preencher_documento(str(caminho_template), dados)
                zf.writestr(f"{slug}.docx", doc_buffer.getvalue())

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

        caminho_template = _template_path(meta["filename"])
        
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


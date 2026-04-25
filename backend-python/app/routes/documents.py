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


def marcar_booleano(dados, campo):
    valor = dados.get(campo)
    dados[f"{campo}_sim"] = "X" if valor == "sim" else ""
    dados[f"{campo}_nao"] = "X" if valor == "nao" else ""


def marcar_unico(dados, campo, opcoes):
    valor = dados.get(campo)
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if valor == opcao else ""


def marcar_multiplos_prefixo(dados, campo, prefixo, opcoes):
    valores = dados.get(campo, [])
    for opcao in opcoes:
        dados[f"{prefixo}_{opcao}"] = "X" if opcao in valores else ""


def marcar_multiplos(dados, campo, opcoes):
    valores = dados.get(campo, [])
    for opcao in opcoes:
        dados[f"{campo}_{opcao}"] = "X" if opcao in valores else ""


def completar_dados(dados):
    dados["nome_crianca"] = dados.get("nomeCompleto", "")
    dados["nome_responsavel"] = dados.get("nomeMae") or dados.get("nomePai") or ""
    dados["rg_responsavel"] = dados.get("rg_responsavel", "")
    dados["cpf_responsavel"] = dados.get("cpf_responsavel", "")
    dados["endereco_responsavel"] = dados.get("enderecoLogradouro", "")
    dados["nacionalidade_crianca"] = dados.get("nacionalidade_crianca", "brasileira")
    dados["idade_crianca"] = dados.get("idade", "")
    dados["periodo_atividades"] = dados.get("periodo_escolar", "")

    hoje = datetime.now()
    dados["dia"] = hoje.strftime("%d")
    dados["mes"] = hoje.strftime("%B")
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

    dados_word = mapear_student_para_word(dados_front)
    dados = {**dados_front, **dados_word}

    try:
        marcar_unico(dados, "origem", ["demanda","conselho","pais","internet","cras","outros"])
        marcar_unico(dados, "tipo_domicilio", ["proprio","alugado","cedido","outros"])
        marcar_unico(dados, "estado_civil", ["casado","uniao","separado","divorciado","viuvo","outro"])
        marcar_unico(dados, "vai", ["sozinho","acompanhado"])

        marcar_booleano(dados, "contato_conjuge")
        marcar_booleano(dados, "recebe_beneficio")

        marcar_multiplos(dados, "beneficios", ["bolsa_familia","renda_cidada","bpc","eventuais"])

        marcar_booleano(dados, "matriculado")
        marcar_booleano(dados, "parou_escola")

        marcar_booleano(dados, "problema_saude")
        marcar_booleano(dados, "restricao_alimentar")
        marcar_booleano(dados, "restricao_fisica")
        marcar_booleano(dados, "bronquite")
        marcar_booleano(dados, "falta_ar")
        marcar_booleano(dados, "odontologico")
        marcar_booleano(dados, "deficiencia")
        marcar_booleano(dados, "oftalmologico")
        marcar_booleano(dados, "usa_oculos")

        marcar_multiplos_prefixo(dados, "atendimentos", "atendimento", [
            "ubs","caps","hospital","ser","outros"
        ])

        marcar_booleano(dados, "fica_sozinho")

        valor_freq = str(dados.get("interage_frequencia", "")).lower()
        for opcao in ["nunca", "raramente", "sempre"]:
            dados[f"interage_{opcao}"] = "X" if valor_freq == opcao else ""

        valores_com = [str(x).lower() for x in dados.get("interage_com", [])]
        for opcao in ["familia", "amigos", "parentes"]:
            dados[f"interage_{opcao}"] = "X" if opcao in valores_com else ""

        marcar_multiplos(dados, "onde", [
            "casa","parentes","rua","pracas","redes",
            "telefone","festas","religioso","passeios","outros"
        ])

        marcar_booleano(dados, "outras_atividades")
        marcar_multiplos(dados, "atividade", ["esportes","cultura","nucleo","ong","outros"])

        marcar_multiplos_prefixo(dados, "servicos", "servico", [
            "cras","creas","creas_medidas","forum","conselho","fundacao",
            "centro_dia","saica","ilpi","centro_pop","seas",
            "delegacia","delegacia_mulher","centro_mulher",
            "pronto_socorro","caps","sistema_prisional","egresso"
        ])

        marcar_unico(dados, "autorizacao_saida", ["autoriza", "nao_autoriza"])
        marcar_unico(dados, "autorizacao_imagem", ["autoriza", "nao_autoriza"])

        marcar_booleano(dados, "situacao_prioritaria")

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

    dados_word = mapear_student_para_word(dados_front)
    dados = {**dados_front, **dados_word}
    

    try:
        marcar_unico(dados, "origem", ["demanda","conselho","pais","internet","cras","outros"])
        marcar_unico(dados, "tipo_domicilio", ["proprio","alugado","cedido","outros"])
        marcar_unico(dados, "estado_civil", ["casado","uniao","separado","divorciado","viuvo","outro"])
        marcar_unico(dados, "vai", ["sozinho","acompanhado"])

        marcar_booleano(dados, "contato_conjuge")
        marcar_booleano(dados, "recebe_beneficio")

        marcar_multiplos(dados, "beneficios", ["bolsa_familia","renda_cidada","bpc","eventuais"])

        marcar_booleano(dados, "matriculado")
        marcar_booleano(dados, "parou_escola")

        marcar_booleano(dados, "problema_saude")
        marcar_booleano(dados, "restricao_alimentar")
        marcar_booleano(dados, "restricao_fisica")
        marcar_booleano(dados, "bronquite")
        marcar_booleano(dados, "falta_ar")
        marcar_booleano(dados, "odontologico")
        marcar_booleano(dados, "deficiencia")
        marcar_booleano(dados, "oftalmologico")
        marcar_booleano(dados, "usa_oculos")

        marcar_multiplos_prefixo(dados, "atendimentos", "atendimento", [
            "ubs","caps","hospital","ser","outros"
        ])

        marcar_booleano(dados, "fica_sozinho")

        marcar_multiplos(dados, "onde", [
            "casa","parentes","rua","pracas","redes",
            "telefone","festas","religioso","passeios","outros"
        ])

        valor_freq = dados.get("interage_frequencia")
        for opcao in ["nunca", "raramente", "sempre"]:
            dados[f"interage_{opcao}"] = "X" if valor_freq == opcao else ""

        valores_com = dados.get("interage_com", [])
        for opcao in ["familia", "amigos", "parentes"]:
            dados[f"interage_{opcao}"] = "X" if opcao in valores_com else ""

        marcar_booleano(dados, "outras_atividades")
        marcar_multiplos(dados, "atividade", ["esportes","cultura","nucleo","ong","outros"])

        marcar_multiplos_prefixo(dados, "servicos", "servico", [
            "cras","creas","creas_medidas","forum","conselho","fundacao",
            "centro_dia","saica","ilpi","centro_pop","seas",
            "delegacia","delegacia_mulher","centro_mulher",
            "pronto_socorro","caps","sistema_prisional","egresso"
        ])

        marcar_booleano(dados, "situacao_prioritaria")

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
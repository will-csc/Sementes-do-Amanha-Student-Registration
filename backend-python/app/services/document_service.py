import os
from docx import Document
from datetime import datetime
from io import BytesIO

MESES = {
    1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
    5: "maio", 6: "junho", 7: "julho", 8: "agosto",
    9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
}

def preencher_documento(nome_arquivo, dados):
    # Localiza a pasta docs conforme seu Explorer
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    template_path = os.path.join(base_dir, 'docs', nome_arquivo)
    
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template não encontrado: {template_path}")

    doc = Document(template_path)

    hoje = datetime.now()
    dados.setdefault('dia', hoje.strftime('%d'))
    dados.setdefault('mes', MESES[hoje.month])
    dados.setdefault('ano', hoje.strftime('%Y'))

    def realizar_substituicao(texto_container):
        for chave, valor in dados.items():
            marcador = f"{{{chave}}}"
            if marcador in texto_container.text:
                texto_container.text = texto_container.text.replace(marcador, str(valor))

    for p in doc.paragraphs:
        realizar_substituicao(p)

    for tabela in doc.tables:
        for linha in tabela.rows:
            for celula in linha.cells:
                for p in celula.paragraphs:
                    realizar_substituicao(p)

    # SALVA EM MEMÓRIA (Não cria arquivos TEMP_ no disco)
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return buffer
import os
import io
from docxtpl import DocxTemplate
from datetime import datetime

def normalizar(valor):
    if not valor:
        return ""
    return str(valor).strip().lower()

def formatar_data(data_str):
    if not data_str:
        return ""
    try:
        # Tenta converter formato ISO ou YYYY-MM-DD para DD/MM/YYYY
        dt = datetime.fromisoformat(data_str.replace('Z', ''))
        return dt.strftime('%d/%m/%Y')
    except:
        return data_str

def mapear_student_para_word(dados):
    responsaveis = dados.get("responsaveisLegais", [])

    resp1 = responsaveis[0] if len(responsaveis) > 0 else {}
    resp2 = responsaveis[1] if len(responsaveis) > 1 else {}

    logradouro = dados.get("enderecoLogradouro") or ""
    numero = dados.get("enderecoNumero") or ""

    # 🔥 FIX ESTADO CIVIL (ESSENCIAL)
    MAP_ESTADO_CIVIL = {
        "casado": "casado",
        "uniao_estavel": "uniao",
        "separados": "separado",
        "divorciados": "divorciado",
        "viuvo": "viuvo",
        "outro": "outro"
    }

    # Funções auxiliares para marcar um "X" nos parênteses do Word
    def check(condicao):
        return "X" if condicao else " "

    def check_sim(valor):
        return "X" if valor is True or str(valor).upper() == "SIM" else " "

    def check_nao(valor):
        return "X" if valor is False or str(valor).upper() == "NÃO" else " "

    # Variáveis normalizadas para verificações em lote
    origem = normalizar(dados.get("origem"))
    estado_civil = MAP_ESTADO_CIVIL.get(normalizar(dados.get("estado_civil")), "")
    tipo_domicilio = normalizar(dados.get("tipo_domicilio"))
    vai = normalizar(dados.get("vai"))

    beneficios = [normalizar(b) for b in dados.get("beneficios", [])]
    atendimentos = [normalizar(a) for a in dados.get("atendimentos", [])]
    interage_com = [normalizar(x) for x in dados.get("interage_com", [])]
    onde = [normalizar(x) for x in dados.get("onde", [])]
    atividade = [normalizar(x) for x in dados.get("atividade", [])]
    servicos = [normalizar(x) for x in dados.get("servicos", [])]
    interage_frequencia = normalizar(dados.get("interage_frequencia"))

    resultado = {
        # ===== DADOS PRINCIPAIS =====
        "nome_crianca": dados.get("nomeCompleto", ""),
        "data_nascimento": formatar_data(dados.get("dataNascimento")),
        "idade": dados.get("idade", ""),
        "naturalidade": dados.get("naturalidade", ""),
        "raca_cor": dados.get("racaCor", ""),
        "sexo": dados.get("sexo", ""),
        "rg_crianca": dados.get("rg", ""),
        "cpf_crianca": dados.get("cpf", ""),
        "nis": dados.get("nis", ""),
        "cras_referencia": dados.get("crasReferencia", ""),

        # ===== CERTIDÃO =====
        "certidao": dados.get("certidao", ""),
        "folha": dados.get("folha", ""),
        "livro": dados.get("livro", ""),

        # ===== ENDEREÇO =====
        "endereco": f"{logradouro}, {numero}".strip(", "),
        "bairro": dados.get("enderecoBairro", ""),
        "cidade": dados.get("enderecoCidade", ""),
        "cep": dados.get("enderecoCep", ""),

        # ===== PAIS =====
        "nome_pai": dados.get("nomePai", ""),
        "nome_mae": dados.get("nomeMae", ""),

        # ===== RESPONSÁVEIS =====
        "responsavel_1_nome": resp1.get("nome", ""),
        "responsavel_1_rg": resp1.get("rg", ""),
        "responsavel_1_cpf": resp1.get("cpf", ""),
        "responsavel_1_celular": resp1.get("celular", ""),
        "whats_responsavel1": resp1.get("whatsapp", ""),
        "telefonefixo_responsavel1": resp1.get("telefone_fixo", ""),
        "responsavel_1_parentesco": resp1.get("parentesco", ""),

        "responsavel_2_nome": resp2.get("nome", ""),
        "responsavel_2_rg": resp2.get("rg", ""),
        "responsavel_2_cpf": resp2.get("cpf", ""),
        "responsavel_2_celular": resp2.get("celular", ""),
        "whats_responsavel2": resp2.get("whatsapp", ""),
        "telefonefixo_responsavel2": resp2.get("telefone_fixo", ""),
        "responsavel_2_parentesco": resp2.get("parentesco", ""),

        # ===== ESCOLAR =====
        "escola": dados.get("escola", ""),
        "serie": dados.get("serie", ""),
        "ano": dados.get("ano_escolar", ""),
        "nome_professor": dados.get("nome_professor", ""),
        "periodo_escolar": dados.get("periodo_escolar", ""),
        "motivo": dados.get("motivo_parou_escola", ""),
        "quanto_tempo": dados.get("quanto_tempo_parou", ""),

        # ===== SAÚDE =====
        "ubs_referencia": dados.get("ubs_referencia", ""),
        "medicamento_continuo": dados.get("medicamento_continuo", ""),
        "alergia?": "SIM" if dados.get("alergia") else ("NÃO" if dados.get("alergia") is False else ""),
        "alergia_qual": dados.get("alergia_qual", ""),
        "problema_saude_qual": dados.get("problema_saude_qual", ""),
        "restricao_alimentar_qual": dados.get("restricao_alimentar_qual", ""),
        "restricao_fisica_qual": dados.get("restricao_fisica_qual", ""),
        "deficiencia_qual": dados.get("deficiencia_qual", ""),
        "onde": dados.get("onde_odontologico", ""),

        # ===== SOCIAL / ATIVIDADES COMPLEMENTO =====
        "outros_qual": dados.get("outras_atividades_qual", ""),
        "dias_semana": dados.get("dias_semana_atividades", ""),

        # ===== OBSERVAÇÃO =====
        "observacao": dados.get("observacao", ""),

        # ===== CHECKBOXES: VAI =====
        "vai_sozinho": check(vai == "sozinho"),
        "vai_acompanhado": check(vai == "acompanhado"),

        # ===== CHECKBOXES: ORIGEM =====
        "origem_demanda": check(origem == "demanda_espontanea"),
        "origem_conselho": check(origem == "conselho_tutelar"),
        "origem_pais": check(origem == "indicacao_pais"),
        "origem_internet": check(origem in ["internet", "internet/tv", "internet_tv"]),
        "origem_cras": check(origem in ["cras", "cras/creas", "cras_creas"]),
        "origem_outros": check(origem == "outros"),

        # ===== CHECKBOXES: ESTADO CIVIL =====
        "estado_civil_casado": check(estado_civil == "casado"),
        "estado_civil_uniao": check(estado_civil == "uniao"),
        "estado_civil_separado": check(estado_civil == "separado"),
        "estado_civil_divorciado": check(estado_civil == "divorciado"),
        "estado_civil_viuvo": check(estado_civil == "viuvo"),
        "estado_civil_outro": check(estado_civil == "outro"),

        "contato_conjuge_sim": check_sim(dados.get("contato_conjuge")),
        "contato_conjuge_nao": check_nao(dados.get("contato_conjuge")),

        # ===== CHECKBOXES: TIPO DOMICILIO =====
        "tipo_domicilio_proprio": check(tipo_domicilio == "proprio"),
        "tipo_domicilio_alugado": check(tipo_domicilio == "alugado"),
        "tipo_domicilio_cedido": check(tipo_domicilio == "cedido"),
        "tipo_domicilio_outros": check(tipo_domicilio == "outros"),

        # ===== CHECKBOXES: BENEFICIOS =====
        "recebe_beneficio_sim": check_sim(dados.get("recebe_beneficio")),
        "recebe_beneficio_nao": check_nao(dados.get("recebe_beneficio")),
        "beneficios_bolsa_familia": check("bolsa_familia" in beneficios),
        "beneficios_renda_cidada": check("renda_cidada" in beneficios),
        "beneficios_bpc": check("bpc" in beneficios),
        "beneficios_eventuais": check("eventuais" in beneficios),

        # ===== CHECKBOXES: ESCOLAR =====
        "matriculado_sim": check_sim(dados.get("matriculado")),
        "matriculado_nao": check_nao(dados.get("matriculado")),
        "parou_escola_sim": check_sim(dados.get("parou_escola")),
        "parou_escola_nao": check_nao(dados.get("parou_escola")),

        # ===== CHECKBOXES: SAÚDE =====
        "problema_saude_sim": check_sim(dados.get("problema_saude")),
        "problema_saude_nao": check_nao(dados.get("problema_saude")),

        "atendimento_ubs": check("ubs" in atendimentos),
        "atendimento_caps": check("caps" in atendimentos),
        "atendimento_hospital": check("hospital" in atendimentos or "hospital_geral" in atendimentos),
        "atendimento_ser": check("ser" in atendimentos),
        "atendimento_outros": check("outros" in atendimentos),

        "restricao_alimentar_sim": check_sim(dados.get("restricao_alimentar")),
        "restricao_alimentar_nao": check_nao(dados.get("restricao_alimentar")),
        "restricao_fisica_sim": check_sim(dados.get("restricao_fisica")),
        "restricao_fisica_nao": check_nao(dados.get("restricao_fisica")),

        "bronquite_sim": check_sim(dados.get("bronquite")),
        "bronquite_nao": check_nao(dados.get("bronquite")),
        "falta_ar_sim": check_sim(dados.get("falta_ar")),
        "falta_ar_nao": check_nao(dados.get("falta_ar")),

        "odontologico_sim": check_sim(dados.get("odontologico")),
        "odontologico_nao": check_nao(dados.get("odontologico")),
        "deficiencia_sim": check_sim(dados.get("deficiencia")),
        "deficiencia_nao": check_nao(dados.get("deficiencia")),
        "oftalmologico_sim": check_sim(dados.get("oftalmologico")),
        "oftalmologico_nao": check_nao(dados.get("oftalmologico")),
        "usa_oculos_sim": check_sim(dados.get("usa_oculos")),
        "usa_oculos_nao": check_nao(dados.get("usa_oculos")),

        # ===== CHECKBOXES: CONVÍVIO =====
        "fica_sozinho_sim": check_sim(dados.get("fica_sozinho")),
        "fica_sozinho_nao": check_nao(dados.get("fica_sozinho")),

        "interage_nunca": check(interage_frequencia == "nunca"),
        "interage_raramente": check(interage_frequencia == "raramente"),
        "interage_sempre": check(interage_frequencia == "sempre"),

        "interage_familia": check("familia" in interage_com),
        "interage_amigos": check("amigos" in interage_com),
        "interage_parentes": check("parentes" in interage_com),

        "onde_casa": check("casa" in onde),
        "onde_parentes": check("casa_de_parentes" in onde or "parentes" in onde),
        "onde_rua": check("rua" in onde or "rua_do_bairro" in onde),
        "onde_pracas": check("pracas" in onde or "quadras" in onde),
        "onde_redes": check("redes_sociais" in onde),
        "onde_telefone": check("telefone" in onde),
        "onde_festas": check("festas" in onde),
        "onde_religioso": check("encontros_religiosos" in onde or "religioso" in onde),
        "onde_passeios": check("passeios" in onde),
        "onde_outros": check("outros" in onde),

        "outras_atividades_sim": check_sim(dados.get("outras_atividades")),
        "outras_atividades_nao": check_nao(dados.get("outras_atividades")),

        "atividade_esportes": check("esportes" in atividade),
        "atividade_cultura": check("cultura" in atividade),
        "atividade_nucleo": check("nucleo" in atividade or "nucleo_socioeducativo" in atividade),
        "atividade_ong": check("ong" in atividade),
        "atividade_outros": check("outros" in atividade),

        # ===== CHECKBOXES: SERVIÇOS =====
        "servico_cras": check("cras" in servicos),
        "servico_creas": check("creas" in servicos),
        "servico_creas_medidas": check("creas_medidas" in servicos),
        "servico_forum": check("forum" in servicos),
        "servico_conselho": check("conselho_tutelar" in servicos),
        "servico_fundacao": check("fundacao_casa" in servicos),
        "servico_centro_dia": check("centro_dia" in servicos),
        "servico_saica": check("saica" in servicos),
        "servico_ilpi": check("ilpi" in servicos),
        "servico_centro_pop": check("centro_pop" in servicos),
        "servico_seas": check("seas" in servicos),
        "servico_delegacia": check("delegacia" in servicos),
        "servico_delegacia_mulher": check("delegacia_da_mulher" in servicos or "delegacia_mulher" in servicos),
        "servico_centro_mulher": check("centro_referencia_mulher" in servicos or "centro_mulher" in servicos),
        "servico_pronto_socorro": check("pronto_socorro" in servicos),
        "servico_caps": check("caps" in servicos),
        "servico_sistema_prisional": check("sistema_prisional" in servicos),
        "servico_egresso": check("egresso" in servicos),

        "situacao_prioritaria_sim": check_sim(dados.get("situacao_prioritaria")),
        "situacao_prioritaria_nao": check_nao(dados.get("situacao_prioritaria")),
    }

    # Data Atual para o cabeçalho
    hoje = datetime.now()
    meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
             "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    resultado["dia"] = hoje.day
    resultado["mes"] = meses[hoje.month - 1]
    resultado["ano_atual"] = hoje.year

    # ===== COMPOSIÇÃO FAMILIAR (LISTA DINÂMICA) =====
    familiares = dados.get("composicao_familiar", [])
    for i in range(1, 7):
        f = familiares[i-1] if len(familiares) >= i else {}
        resultado[f"familiar_{i}"] = f.get("nome", "")
        resultado[f"parentesco_{i}"] = f.get("parentesco", "")
        resultado[f"profissao_{i}"] = f.get("profissao", "")
        resultado[f"renda_{i}"] = f.get("renda", "")

    return resultado

def preencher_documento(template_path, dados_prontos):
    """
    Carrega o template apontado por template_path, faz o merge com
    os dados_prontos e retorna um buffer de memória com o arquivo gerado.
    """
    # Carrega o documento a partir do caminho exato enviado pelo documents.py
    doc = DocxTemplate(template_path)
    
    # Faz o merge das chaves (aquelas {{ tags }} do Word) com os dados
    doc.render(dados_prontos)
    
    # Salva o arquivo preenchido diretamente na memória do servidor
    target = io.BytesIO()
    doc.save(target)
    
    # "Rebobina" o arquivo para o início, para que o Flask possa ler desde o começo
    target.seek(0)
    
    return target
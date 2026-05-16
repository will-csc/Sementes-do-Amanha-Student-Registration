function normalize(value?: string) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "");
}

function simNao(value?: boolean) {
  return value ? "sim" : "nao";
}

function mapEstadoCivil(value?: string): string {
  const map: Record<string, string> = {
    "Solteiro(a)":   "solteiro",
    "Casado(a)":     "casado",
    "Divorciado(a)": "divorciado",
    "Viúvo(a)":      "viuvo",
    "União Estável": "uniao_estavel",
  };
  return map[value || ""] ?? normalize(value);
}

function mapOrigem(value?: string): string {
  const map: Record<string, string> = {
    "Demanda Espontânea":  "demanda_espontanea",
    "Conselho Tutelar":    "conselho_tutelar",
    "Indicação de Pais":   "indicacao_pais",      
    "Internet/TV":         "internet/tv",
    "CRAS/CREAS":          "cras/creas",
    "Outros":              "outros",
  };
  return map[value || ""] ?? normalize(value) ?? "outros";
}

export function mapToWordPayload(student: any) {
  const origem = student.origemEncaminhamento || "";
  const origemNorm = mapOrigem(origem);
  const locomocao = student.locomocao || "";
  const locaisAtendimento = student.locaisAtendimento || [];

  return {
    // ===== DADOS PESSOAIS =====
    nomeCompleto:   student.nomeCompleto,
    dataNascimento: student.dataNascimento,
    idade:          student.idade,
    naturalidade:   student.naturalidade,
    racaCor:        student.racaCor,
    sexo:           student.sexo,
    rg:             student.rg,
    cpf:            student.cpf,
    nis:            student.nis,
    crasReferencia: student.crasReferencia,

    // ===== ENDEREÇO =====
    enderecoLogradouro: student.enderecoLogradouro,
    enderecoNumero:     student.enderecoNumero,
    enderecoBairro:     student.enderecoBairro,
    enderecoCidade:     student.enderecoCidade,
    enderecoCep:        student.enderecoCep,

    // ===== PAIS =====
    nomePai: student.nomePai,
    nomeMae: student.nomeMae,

    // ===== RESPONSÁVEIS =====
    responsaveisLegais:       student.responsaveisLegais,
    responsavel_1_nome:       student.responsaveisLegais?.[0]?.nome       || "",
    responsavel_1_rg:         student.responsaveisLegais?.[0]?.rg         || "",
    responsavel_1_cpf:        student.responsaveisLegais?.[0]?.cpf        || "",
    responsavel_1_celular:    student.responsaveisLegais?.[0]?.celular    || "",
    responsavel_1_parentesco: student.responsaveisLegais?.[0]?.parentesco || "",
    responsavel_2_nome:       student.responsaveisLegais?.[1]?.nome       || "",
    responsavel_2_rg:         student.responsaveisLegais?.[1]?.rg         || "",
    responsavel_2_cpf:        student.responsaveisLegais?.[1]?.cpf        || "",
    responsavel_2_celular:    student.responsaveisLegais?.[1]?.celular    || "",
    responsavel_2_parentesco: student.responsaveisLegais?.[1]?.parentesco || "",

    // ===== COMPOSIÇÃO FAMILIAR =====
    composicao_familiar: student.membrosFamiliares || [],
    familiar_1:   student.membrosFamiliares?.[0]?.nome       || "",
    parentesco_1: student.membrosFamiliares?.[0]?.parentesco || "",
    profissao_1:  student.membrosFamiliares?.[0]?.profissao  || "",
    renda_1:      student.membrosFamiliares?.[0]?.renda      || "",

    // ===== SITUAÇÃO ESCOLAR =====
    escola:          student.escolaNome,
    serie:           student.escolaSerie,
    periodo_escolar: student.escolaPeriodo,
    matriculado:     student.escolaNome ? "sim" : "nao",
    ano_escolar:     student.escolaAno,
    nome_professor:  student.escolaProfessor,
    parou_escola:        simNao(student.evasaoEscolar),
    motivo_parou_escola: student.evasaoEscolarMotivo || "",
    quanto_tempo_parou:  student.evasaoEscolarTempo  || "",

    // ===== SAÚDE =====
    ubs_referencia:           student.ubsReferencia,
    problema_saude:           simNao(student.temProblemaSaude),
    problema_saude_qual:      student.problemaSaudeDescricao,
    restricao_alimentar:      simNao(student.temRestricoes),
    restricao_alimentar_qual: student.restricoesDescricao,
    deficiencia:              simNao(student.temDeficiencia),
    deficiencia_qual:         student.deficienciaDescricao,
    medicamento_continuo:  student.medicamentosDescricao || "",
    bronquite:             simNao(student.temBronquite),
    falta_ar:              simNao(student.temFaltaAr),
    odontologico:          simNao(student.acompanhamentoOdontologico),
    onde_odontologico:     student.acompanhamentoOdontologicoLocal || "",
    oftalmologico:         simNao(student.tratamentoOftalmologico),
    usa_oculos:            simNao(student.usaOculos),
    restricao_fisica:      simNao(student.restricaoFisica),
    restricao_fisica_qual: student.restricaoFisicaDescricao || "",
    alergia:               student.temAlergias ? "SIM" : "NÃO",
    alergia_qual:          student.alergiasDescricao,

    // ===== ATENDIMENTOS (checkboxes) =====
    atendimentos:         locaisAtendimento.map(normalize),
    atendimento_ubs:      student.ubsReferencia                        ? "X" : "",
    atendimento_caps:     locaisAtendimento.includes("CAPS")           ? "X" : "",
    atendimento_hospital: locaisAtendimento.includes("Hospital Geral") ? "X" : "",
    atendimento_ser:      locaisAtendimento.includes("SER")            ? "X" : "",
    atendimento_outros:   "",

    // ===== CONVÍVIO =====
    fica_sozinho:     simNao(!!student.permaneceSozinhaEmCasa),
    outras_atividades: simNao(
      (student.atividadesExtrasLista || []).length > 0 || !!student.atividadesExtras
    ),
    observacao: student.observacoesGerais || "",


    interage: normalize(student.frequenciaInteracao) || "sempre",
    interage_frequencia: normalize(student.frequenciaInteracao) || "sempre",

    // interage_com: o formulário usa comportamentos, não familia/amigos/parentes.
    // Enviamos o array normalizado; para marcar os checkboxes do Word seria necessário
    // mudar as opções do formulário para "Família", "Amigos", "Parentes".
    interage_com: (student.interacaoSocial || []).map(normalize),

    // ===== LAZER (checkboxes onde_*) =====
    onde: (student.locaisLazer || []).map(normalize),

    // ===== ATIVIDADES EXTRAS =====
    atividade: (student.atividadesExtrasLista || []).map(normalize),

    // ===== SERVIÇOS UTILIZADOS =====
    servicos: (student.servicosUtilizados || []).map(normalize),


    situacao_prioritaria: simNao(student.situacaoPrioritaria),

    // ===== CERTIDÃO =====
    certidao: student.certidaoTermo || "",
    folha:    student.certidaoFolha || "",
    livro:    student.certidaoLivro || "",

    // ===== ORIGEM (checkboxes) =====
    origem:          origemNorm,
    origem_demanda:  origemNorm === "demanda_espontanea" ? "X" : "",
    origem_conselho: origemNorm === "conselho_tutelar"   ? "X" : "",
    origem_pais:     origemNorm === "indicacao_pais"     ? "X" : "",
    origem_internet: origemNorm === "internet/tv"        ? "X" : "",
    origem_cras:     origemNorm === "cras/creas"         ? "X" : "",
    origem_outros:   origemNorm === "outros" || !origemNorm ? "X" : "",

    // ===== LOCOMOÇÃO =====
    vai:             locomocao || "acompanhado",
    vai_sozinho:     locomocao === "sozinho" ? "X" : "",
    vai_acompanhado: locomocao !== "sozinho" ? "X" : "",

    // ===== ESTADO CIVIL =====
    estado_civil: mapEstadoCivil(student.estadoCivilPais),

    // ===== TIPO DOMICÍLIO =====
    tipo_domicilio: normalize(student.tipoDomicilio),

    // ===== CONTATO CÔNJUGE =====
    contato_conjuge: student.contatoConjugeNome ? "sim" : "nao",

    // ===== BENEFÍCIOS =====
    beneficios: (student.beneficios || []).map(normalize),

    // ===== CAMPOS PARA OUTROS DOCUMENTOS =====
    nome_crianca:         student.nomeCompleto,
    nacionalidade_crianca: student.naturalidade || "Brasileira",
    idade_crianca:        student.idade,
    nome_responsavel:     student.responsaveisLegais?.[0]?.nome || student.nomeMae || "",
    rg_responsavel:       student.responsaveisLegais?.[0]?.rg  || "",
    cpf_responsavel:      student.responsaveisLegais?.[0]?.cpf || "",
    endereco_responsavel: [
      student.enderecoLogradouro,
      student.enderecoNumero,
      student.enderecoBairro,
    ].filter(Boolean).join(", "),

    autorizacaoImagem:               student.autorizacaoImagem,
    autorizacao_saida:               student.autorizacaoSaida,
    autorizacao_imagem_autoriza:     student.autorizacaoImagem  ? "X" : "",
    autorizacao_imagem_nao_autoriza: !student.autorizacaoImagem ? "X" : "",
  };
}
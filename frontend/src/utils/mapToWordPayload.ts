function normalize(value?: string) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function simNao(value?: boolean) {
  return value ? "sim" : "nao";
}

export function mapToWordPayload(student: any) {
  return {
    nomeCompleto: student.nomeCompleto,
    dataNascimento: student.dataNascimento,
    idade: student.idade,
    naturalidade: student.naturalidade,
    racaCor: student.racaCor,
    sexo: student.sexo,
    rg: student.rg,
    cpf: student.cpf,
    nis: student.nis,
    crasReferencia: student.crasReferencia,

    enderecoLogradouro: student.enderecoLogradouro,
    enderecoNumero: student.enderecoNumero,
    enderecoBairro: student.enderecoBairro,
    enderecoCidade: student.enderecoCidade,
    enderecoCep: student.enderecoCep,

    nomePai: student.nomePai,
    nomeMae: student.nomeMae,

    responsaveisLegais: student.responsaveisLegais,

    escola: student.escolaNome,
    serie: student.escolaSerie,
    periodo_escolar: student.escolaPeriodo,

    matriculado: student.escolaNome ? "sim" : "nao",

    ubs_referencia: student.ubsReferencia,
    problema_saude: simNao(student.temProblemaSaude),
    problema_saude_qual: student.problemaSaudeDescricao,

    restricao_alimentar: simNao(student.temRestricoes),
    restricao_alimentar_qual: student.restricoesDescricao,

    deficiencia: simNao(student.temDeficiencia),
    deficiencia_qual: student.deficienciaDescricao,

    tipo_domicilio: normalize(student.tipoDomicilio),
    estado_civil: normalize(student.estadoCivilPais),

    origem: "outros",
    vai: "acompanhado",

    origem_demanda: "",
    origem_conselho: "",
    origem_pais: "",
    origem_internet: "",
    origem_cras: "",
    origem_outros: "X",

    vai_sozinho: "",
    vai_acompanhado: "X",

    responsavel_1_nome: student.responsaveisLegais?.[0]?.nome || "",
    responsavel_1_rg: student.responsaveisLegais?.[0]?.rg || "",
    responsavel_1_cpf: student.responsaveisLegais?.[0]?.cpf || "",
    responsavel_1_celular: student.responsaveisLegais?.[0]?.telefone || "",
    responsavel_1_parentesco: student.responsaveisLegais?.[0]?.parentesco || "",

    responsavel_2_nome: student.responsaveisLegais?.[1]?.nome || "",
    responsavel_2_rg: student.responsaveisLegais?.[1]?.rg || "",
    responsavel_2_cpf: student.responsaveisLegais?.[1]?.cpf || "",
    responsavel_2_celular: student.responsaveisLegais?.[1]?.telefone || "",
    responsavel_2_parentesco: student.responsaveisLegais?.[1]?.parentesco || "",

    familiar_1: student.membrosFamiliares?.[0]?.nome || "",
    parentesco_1: student.membrosFamiliares?.[0]?.parentesco || "",
    profissao_1: student.membrosFamiliares?.[0]?.profissao || "",
    renda_1: student.membrosFamiliares?.[0]?.renda || "",

    interage_familia: "X",

    atendimento_ubs: "X",

    fica_sozinho: simNao(!student.temSupervisao),
    outras_atividades: simNao(!!student.atividadesExtras),

    certidao: student.certidaoTermo || "",
    folha: student.certidaoFolha || "",
    livro: student.certidaoLivro || "",

    ano_escolar: student.escolaAno,
    parou_escola: student.historicoEscolar ? "sim" : "nao",
    nome_professor: student.escolaProfessor,

    composicao_familiar: student.membrosFamiliares || [],

    alergia: student.temAlergias ? "SIM" : "NÃO",
    alergia_qual: student.alergiasDescricao,

    contato_conjuge: student.contatoConjugeNome ? "sim" : "nao",

    beneficios: (student.beneficios || []).map(normalize),

    servicos: (student.servicosUtilizados || []).map(normalize),

    atendimentos: [],

    onde: (student.locaisLazer || []).map(normalize),

    atividade: student.atividadesExtras
      ? ["outros"]
      : [],

    interage: "sempre",
    interage_com: [],

    nome_crianca: student.nomeCompleto,
    nacionalidade_crianca: student.naturalidade || "Brasileira",
    idade_crianca: student.idade,

    nome_responsavel: student.responsaveisLegais?.[0]?.nome || student.nomeMae || "",
    rg_responsavel: student.responsaveisLegais?.[0]?.rg || "",
    cpf_responsavel: student.responsaveisLegais?.[0]?.cpf || "",

    endereco_responsavel: [
      student.enderecoLogradouro,
      student.enderecoNumero,
      student.enderecoBairro
    ]
      .filter(Boolean)
      .join(", "),

    autorizacaoImagem: student.autorizacaoImagem,
    autorizacao_saida: student.autorizacaoSaida,

    autorizacao_imagem_autoriza: student.autorizacaoImagem ? "X" : "",
    autorizacao_imagem_nao_autoriza: !student.autorizacaoImagem ? "X" : "",
  };
}
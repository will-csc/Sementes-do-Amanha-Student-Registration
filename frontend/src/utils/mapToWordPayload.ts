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
  const origem = student.origemEncaminhamento || "";
  const locomocao = student.locomocao || "";
  const locaisAtendimento = student.locaisAtendimento || [];

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

    origem: normalize(origem) || "outros",
    vai: locomocao || "acompanhado",

    origem_demanda: origem === "Demanda Espontânea" ? "X" : "",
    origem_conselho: origem === "Conselho Tutelar" ? "X" : "",
    origem_pais: origem === "Indicação de Pais" ? "X" : "",
    origem_internet: origem === "Internet/TV" ? "X" : "",
    origem_cras: origem === "CRAS/CREAS" ? "X" : "",
    origem_outros: origem === "Outros" || !origem ? "X" : "",

    vai_sozinho: locomocao === "sozinho" ? "X" : "",
    vai_acompanhado: locomocao === "acompanhado" || !locomocao ? "X" : "",

    responsavel_1_nome: student.responsaveisLegais?.[0]?.nome || "",
    responsavel_1_rg: student.responsaveisLegais?.[0]?.rg || "",
    responsavel_1_cpf: student.responsaveisLegais?.[0]?.cpf || "",
    responsavel_1_celular: student.responsaveisLegais?.[0]?.celular || "",
    responsavel_1_parentesco: student.responsaveisLegais?.[0]?.parentesco || "",

    responsavel_2_nome: student.responsaveisLegais?.[1]?.nome || "",
    responsavel_2_rg: student.responsaveisLegais?.[1]?.rg || "",
    responsavel_2_cpf: student.responsaveisLegais?.[1]?.cpf || "",
    responsavel_2_celular: student.responsaveisLegais?.[1]?.celular || "",
    responsavel_2_parentesco: student.responsaveisLegais?.[1]?.parentesco || "",

    familiar_1: student.membrosFamiliares?.[0]?.nome || "",
    parentesco_1: student.membrosFamiliares?.[0]?.parentesco || "",
    profissao_1: student.membrosFamiliares?.[0]?.profissao || "",
    renda_1: student.membrosFamiliares?.[0]?.renda || "",

    interage_familia: "X",
    interage_amigos: "",
    interage_parentes: "",

    atendimento_ubs: student.ubsReferencia ? "X" : "",
    atendimento_caps: locaisAtendimento.includes("CAPS") ? "X" : "",
    atendimento_hospital: locaisAtendimento.includes("Hospital Geral") ? "X" : "",
    atendimento_ser: locaisAtendimento.includes("SER") ? "X" : "",
    atendimento_outros: "",

    fica_sozinho: simNao(!!student.permaneceSozinhaEmCasa),
    outras_atividades: simNao((student.atividadesExtrasLista || []).length > 0 || !!student.atividadesExtras),

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

    atendimentos: (student.locaisAtendimento || []).map(normalize),

    onde: (student.locaisLazer || []).map(normalize),

    atividade: (student.atividadesExtrasLista || []).map(normalize),

    interage: normalize(student.frequenciaInteracao) || "sempre",
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

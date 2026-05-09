export type Parentesco = 
  | "Pai" | "Mãe" | "Avô" | "Avó" | "Tio" | "Tia" | "Bisavô" | "Bisavó" | "Cunhado(a)" | "Família Acolhedora" | "Curador(a)"
  | "Primo" | "Prima" | "Tutor(a) Legal" |"Irmão" | "Irmã" | "Madrasta" | "Padrasto" | "Outro";
export type Sexo = "Masculino" | "Feminino" | "Outro";
export type RacaCor = "Branca" | "Preta" | "Parda" | "Amarela" | "Indígena" | "Não Declarado";
export type EstadoCivil = "Solteiro(a)" | "Casado(a)" | "Divorciado(a)" | "Viúvo(a)" | "União Estável";
export type Uf = 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export interface ResponsavelLegal {
  nome: string;
  dataNascimento: string;
  rg: string;
  cpf: string;
  celular: string;
  operadora: string;
  whatsapp: string;
  fixo: string;
  parentesco: Parentesco | "";
}

export interface MembroFamiliar {
  nome: string;
  parentesco: Parentesco | "";
  profissao: string;
  renda: string;
}

export interface PessoaAutorizada {
  nome: string;
  documento: string;
  parentesco: Parentesco | "";
  telefone: string;
}

export type AutorizacaoSaida =
  | ""
  | "sim"
  | "nao"
  | "somente-com-responsavel";

export interface Student {
  id: string;
  createdAt: string;
  nomeCompleto: string;
  fotoCrianca: string;
  locomocao: string;
  locomocaoAcompanhante: string;
  origemEncaminhamento: string;
  dataNascimento: string;
  idade: number | null;
  naturalidade: string;
  racaCor: RacaCor | "";
  sexo: Sexo | "";
  rg: string;
  cpf: string;
  nis: string;
  certidaoTermo: string;
  certidaoFolha: string;
  certidaoLivro: string;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: Uf | "";
  nomePai: string;
  nomeMae: string;
  crasReferencia: string;
  responsaveisLegais: ResponsavelLegal[];
  membrosFamiliares: MembroFamiliar[];
  estadoCivilPais: EstadoCivil | "";
  contatoConjugeNome: string;
  contatoConjugeTelefone: string;
  contatoConjugeFrequencia: string;
  tipoDomicilio: string;
  rendaFamiliar: string;
  faixaRenda: string;
  beneficios: string[];
  beneficioOutros: string;
  ativo: boolean;
  unidade: string;
  escolaNome: string;
  escolaSerie: string;
  escolaAno: string;
  escolaProfessor: string;
  escolaPeriodo: string;
  historicoEscolar: string;
  evasaoEscolar: boolean;
  evasaoEscolarMotivo: string;
  evasaoEscolarTempo: string;
  ubsReferencia: string;
  locaisAtendimento: string[];
  temProblemaSaude: boolean;
  problemaSaudeDescricao: string;
  temRestricoes: boolean;
  restricoesDescricao: string;
  usaMedicamentos: boolean;
  medicamentosDescricao: string;
  temAlergias: boolean;
  alergiasDescricao: string;
  acompanhamentos: string;
  temDeficiencia: boolean;
  deficienciaDescricao: string;
  temBronquite: boolean;
  temFaltaAr: boolean;
  acompanhamentoOdontologico: boolean;
  acompanhamentoOdontologicoLocal: string;
  acompanhamentoOdontologicoTempo: string;
  tratamentoOftalmologico: boolean;
  tratamentoOftalmologicoLocal: string;
  usaOculos: boolean;
  usaLentes: boolean;
  restricaoFisica: boolean;
  restricaoFisicaDescricao: string;
  permaneceSozinhaEmCasa: boolean;
  temSupervisao: boolean;
  supervisaoDescricao: string;
  frequenciaInteracao: string;
  interacaoSocial: string[];
  locaisLazer: string[];
  atividadesExtras: string;
  atividadesExtrasLista: string[];
  cronogramaAtividades: string[];
  servicosUtilizados: string[];
  situacaoPrioritaria: boolean;
  observacoesGerais: string;
  termoResponsabilidade: boolean;
  autorizacaoImagem: boolean;
  autorizacaoSaida: AutorizacaoSaida;
  pessoasAutorizadas: PessoaAutorizada[];
}

export const emptyStudent: Omit<Student, "id"> = {
  createdAt: "",
  nomeCompleto: "",
  fotoCrianca: "",
  locomocao: "",
  locomocaoAcompanhante: "",
  origemEncaminhamento: "",
  dataNascimento: "",
  idade: null,
  naturalidade: "",
  racaCor: "",
  sexo: "",
  rg: "",
  cpf: "",
  nis: "",
  certidaoTermo: "",
  certidaoFolha: "",
  certidaoLivro: "",
  enderecoCep: "",
  enderecoLogradouro: "",
  enderecoNumero: "",
  enderecoComplemento: "",
  enderecoBairro: "",
  enderecoCidade: "",
  enderecoUf: "",
  nomePai: "",
  nomeMae: "",
  crasReferencia: "",
  responsaveisLegais: [
    {
      nome: "",
      dataNascimento: "",
      rg: "",
      cpf: "",
      celular: "",
      operadora: "",
      whatsapp: "",
      fixo: "",
      parentesco: "",
    },
  ],
  membrosFamiliares: [],
  estadoCivilPais: "",
  contatoConjugeNome: "",
  contatoConjugeTelefone: "",
  contatoConjugeFrequencia: "",
  tipoDomicilio: "",
  rendaFamiliar: "",
  faixaRenda: "",
  beneficios: [],
  beneficioOutros: "",
  ativo: true,
  unidade: "",
  escolaNome: "",
  escolaSerie: "",
  escolaAno: "",
  escolaProfessor: "",
  escolaPeriodo: "",
  historicoEscolar: "",
  evasaoEscolar: false,
  evasaoEscolarMotivo: "",
  evasaoEscolarTempo: "",
  ubsReferencia: "",
  locaisAtendimento: [],
  temProblemaSaude: false,
  problemaSaudeDescricao: "",
  temRestricoes: false,
  restricoesDescricao: "",
  usaMedicamentos: false,
  medicamentosDescricao: "",
  temAlergias: false,
  alergiasDescricao: "",
  acompanhamentos: "",
  temDeficiencia: false,
  deficienciaDescricao: "",
  temBronquite: false,
  temFaltaAr: false,
  acompanhamentoOdontologico: false,
  acompanhamentoOdontologicoLocal: "",
  acompanhamentoOdontologicoTempo: "",
  tratamentoOftalmologico: false,
  tratamentoOftalmologicoLocal: "",
  usaOculos: false,
  usaLentes: false,
  restricaoFisica: false,
  restricaoFisicaDescricao: "",
  permaneceSozinhaEmCasa: false,
  temSupervisao: false,
  supervisaoDescricao: "",
  frequenciaInteracao: "",
  interacaoSocial: [],
  locaisLazer: [],
  atividadesExtras: "",
  atividadesExtrasLista: [],
  cronogramaAtividades: [],
  servicosUtilizados: [],
  situacaoPrioritaria: false,
  observacoesGerais: "",
  termoResponsabilidade: false,
  autorizacaoImagem: false,
  autorizacaoSaida: "",
  pessoasAutorizadas: [],
};

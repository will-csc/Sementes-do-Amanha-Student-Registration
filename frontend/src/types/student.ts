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
  nomeCompleto: string;
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
  tipoDomicilio: string;
  rendaFamiliar: string;
  beneficios: string[];
  escolaNome: string;
  escolaSerie: string;
  escolaAno: string;
  escolaProfessor: string;
  escolaPeriodo: string;
  historicoEscolar: string;
  ubsReferencia: string;
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
  temSupervisao: boolean;
  supervisaoDescricao: string;
  interacaoSocial: string[];
  locaisLazer: string[];
  atividadesExtras: string;
  servicosUtilizados: string[];
  termoResponsabilidade: boolean;
  autorizacaoImagem: boolean;
  autorizacaoSaida: AutorizacaoSaida;
  pessoasAutorizadas: PessoaAutorizada[];
}

export const emptyStudent: Omit<Student, "id"> = {
  nomeCompleto: "",
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
  tipoDomicilio: "",
  rendaFamiliar: "",
  beneficios: [],
  escolaNome: "",
  escolaSerie: "",
  escolaAno: "",
  escolaProfessor: "",
  escolaPeriodo: "",
  historicoEscolar: "",
  ubsReferencia: "",
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
  temSupervisao: false,
  supervisaoDescricao: "",
  interacaoSocial: [],
  locaisLazer: [],
  atividadesExtras: "",
  servicosUtilizados: [],
  termoResponsabilidade: false,
  autorizacaoImagem: false,
  autorizacaoSaida: "",
  pessoasAutorizadas: [],
};

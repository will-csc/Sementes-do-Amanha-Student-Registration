import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Student } from "@/types/student";
import { emptyStudent } from "@/types/student";
import { useAuth } from "@/contexts/AuthContext";

type StudentDraft = Omit<Student, "id">;

export type StudentAuditAction = "create" | "update" | "delete";

export interface StudentAuditEvent {
  id: string;
  studentId: string;
  studentName: string;
  action: StudentAuditAction;
  at: string;
  by: string;
  changedFields?: string[];
}

interface StudentContextValue {
  students: Student[];
  auditEvents: StudentAuditEvent[];
  getStudent: (id: string) => Promise<Student | null>;
  addStudent: (data: StudentDraft) => Promise<Student>;
  updateStudent: (id: string, data: StudentDraft) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

const DEFAULT_LOCAL_API_BASE_URLS = ["http://localhost:3000", "http://localhost:10000"] as const;
const API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL_FALLBACK = import.meta.env.VITE_API_URL_FALLBACK as string | undefined;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function buildApiBaseCandidates(...values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
        .map(normalizeBaseUrl),
    ),
  );
}

const API_BASE_CANDIDATES = buildApiBaseCandidates(API_BASE_URL, API_BASE_URL_FALLBACK, ...DEFAULT_LOCAL_API_BASE_URLS);

function shouldRetryWithNextBase(method: string, response: Response) {
  if (method !== "GET") return false;
  return [404, 502, 503, 504].includes(response.status);
}

function isLikelyHtml(value: string) {
  const v = value.trim().toLowerCase();
  return v.startsWith("<!doctype html") || v.startsWith("<html") || v.includes("<head") || v.includes("<body");
}

function normalizeErrorMessage(value: string, status: number) {
  const raw = value.trim();
  if (!raw) return `Erro HTTP ${status}`;
  if (isLikelyHtml(raw)) return `Erro HTTP ${status}`;

  let msg = raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string") msg = parsed;
    else if (parsed && typeof parsed === "object") {
      const any = parsed as Record<string, unknown>;
      if (typeof any.message === "string") msg = any.message;
      else if (typeof any.error === "string") msg = any.error;
    }
  } catch {}

  msg = msg.replace(/\s+/g, " ").trim();
  if (msg.length > 180) msg = `${msg.slice(0, 177)}...`;
  return msg || `Erro HTTP ${status}`;
}

export async function fetchBackend(path: string, init?: RequestInit, actorEmail?: string): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (actorEmail) headers.set("x-user-email", actorEmail);
  const method = (init?.method ?? "GET").toUpperCase();
  let lastError: unknown = null;

  for (const [index, base] of API_BASE_CANDIDATES.entries()) {
    try {
      const response = await fetch(`${base}${path}`, { ...init, headers });
      const isLastCandidate = index === API_BASE_CANDIDATES.length - 1;
      if (!isLastCandidate && shouldRetryWithNextBase(method, response)) continue;
      return response;
    } catch (error) {
      lastError = error;
      if (index === API_BASE_CANDIDATES.length - 1) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Nao foi possivel conectar ao backend.");
}

type ApiStudentListItem = {
  id: string;
  createdAt?: string | null;
  nomeCompleto: string;
  idade: number | null;
  cpf?: string | null;
  nomeMae?: string | null;
  escolaNome?: string | null;
  sexo?: string | null;
};

type ApiStudentAuditEvent = {
  id: string;
  studentId: string;
  studentName: string;
  action: StudentAuditAction;
  at: string;
  byEmail: string;
  changedFields?: string[] | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readField(source: Record<string, unknown>, camel: string, snake?: string) {
  if (camel in source) return source[camel];
  if (snake && snake in source) return source[snake];
  return undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "no"].includes(normalized)) return false;
  }
  return fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeResponsavel(value: unknown): Student["responsaveisLegais"][number] {
  const item = asRecord(value);
  return {
    nome: asString(readField(item, "nome")),
    dataNascimento: asString(readField(item, "dataNascimento", "data_nascimento")),
    rg: asString(readField(item, "rg")),
    cpf: asString(readField(item, "cpf")),
    celular: asString(readField(item, "celular")),
    operadora: asString(readField(item, "operadora")),
    whatsapp: asString(readField(item, "whatsapp")),
    fixo: asString(readField(item, "fixo")),
    parentesco: asString(readField(item, "parentesco")) as Student["responsaveisLegais"][number]["parentesco"],
  };
}

function normalizeMembroFamiliar(value: unknown): Student["membrosFamiliares"][number] {
  const item = asRecord(value);
  return {
    nome: asString(readField(item, "nome")),
    parentesco: asString(readField(item, "parentesco")) as Student["membrosFamiliares"][number]["parentesco"],
    profissao: asString(readField(item, "profissao")),
    renda: asString(readField(item, "renda")),
  };
}

function normalizePessoaAutorizada(value: unknown): Student["pessoasAutorizadas"][number] {
  const item = asRecord(value);
  return {
    nome: asString(readField(item, "nome")),
    documento: asString(readField(item, "documento")),
    parentesco: asString(readField(item, "parentesco")) as Student["pessoasAutorizadas"][number]["parentesco"],
    telefone: asString(readField(item, "telefone")),
  };
}

function normalizeStudentPayload(raw: unknown): Student {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const source = Object.keys(data).length > 0 ? data : root;

  return {
    ...emptyStudent,
    id: String(readField(root, "id") ?? readField(source, "id") ?? ""),
    createdAt: asString(readField(source, "createdAt", "created_at")),
    nomeCompleto: asString(readField(source, "nomeCompleto", "nome_completo")),
    fotoCrianca: asString(readField(source, "fotoCrianca", "foto_crianca")),
    locomocao: asString(readField(source, "locomocao")),
    locomocaoAcompanhante: asString(readField(source, "locomocaoAcompanhante", "locomocao_acompanhante")),
    origemEncaminhamento: asString(readField(source, "origemEncaminhamento", "origem_encaminhamento")),
    dataNascimento: asString(readField(source, "dataNascimento", "data_nascimento")),
    idade: asNullableNumber(readField(source, "idade")),
    naturalidade: asString(readField(source, "naturalidade")),
    racaCor: asString(readField(source, "racaCor", "raca_cor")) as Student["racaCor"],
    sexo: normalizeSexo(asString(readField(source, "sexo"))),
    rg: asString(readField(source, "rg")),
    cpf: asString(readField(source, "cpf")),
    nis: asString(readField(source, "nis")),
    certidaoTermo: asString(readField(source, "certidaoTermo", "certidao_termo")),
    certidaoFolha: asString(readField(source, "certidaoFolha", "certidao_folha")),
    certidaoLivro: asString(readField(source, "certidaoLivro", "certidao_livro")),
    enderecoCep: asString(readField(source, "enderecoCep", "endereco_cep")),
    enderecoLogradouro: asString(readField(source, "enderecoLogradouro", "endereco_logradouro")),
    enderecoNumero: asString(readField(source, "enderecoNumero", "endereco_numero")),
    enderecoComplemento: asString(readField(source, "enderecoComplemento", "endereco_complemento")),
    enderecoBairro: asString(readField(source, "enderecoBairro", "endereco_bairro")),
    enderecoCidade: asString(readField(source, "enderecoCidade", "endereco_cidade")),
    enderecoUf: asString(readField(source, "enderecoUf", "endereco_uf")) as Student["enderecoUf"],
    nomePai: asString(readField(source, "nomePai", "nome_pai")),
    nomeMae: asString(readField(source, "nomeMae", "nome_mae")),
    crasReferencia: asString(readField(source, "crasReferencia", "cras_referencia")),
    responsaveisLegais: Array.isArray(readField(source, "responsaveisLegais", "responsaveis_legais"))
      ? (readField(source, "responsaveisLegais", "responsaveis_legais") as unknown[]).map(normalizeResponsavel)
      : emptyStudent.responsaveisLegais,
    membrosFamiliares: Array.isArray(readField(source, "membrosFamiliares", "membros_familiares"))
      ? (readField(source, "membrosFamiliares", "membros_familiares") as unknown[]).map(normalizeMembroFamiliar)
      : [],
    estadoCivilPais: asString(readField(source, "estadoCivilPais", "estado_civil_pais")) as Student["estadoCivilPais"],
    contatoConjugeNome: asString(readField(source, "contatoConjugeNome", "contato_conjuge_nome")),
    contatoConjugeTelefone: asString(readField(source, "contatoConjugeTelefone", "contato_conjuge_telefone")),
    contatoConjugeFrequencia: asString(readField(source, "contatoConjugeFrequencia", "contato_conjuge_frequencia")),
    tipoDomicilio: asString(readField(source, "tipoDomicilio", "tipo_domicilio")),
    rendaFamiliar: asString(readField(source, "rendaFamiliar", "renda_familiar")),
    faixaRenda: asString(readField(source, "faixaRenda", "faixa_renda")),
    beneficios: asStringArray(readField(source, "beneficios")),
    beneficioOutros: asString(readField(source, "beneficioOutros", "beneficio_outros")),
    ativo: asBoolean(readField(source, "ativo"), true),
    unidade: asString(readField(source, "unidade")),
    escolaNome: asString(readField(source, "escolaNome", "escola_nome")),
    escolaSerie: asString(readField(source, "escolaSerie", "escola_serie")),
    escolaAno: asString(readField(source, "escolaAno", "escola_ano")),
    escolaProfessor: asString(readField(source, "escolaProfessor", "escola_professor")),
    escolaPeriodo: asString(readField(source, "escolaPeriodo", "escola_periodo")),
    historicoEscolar: asString(readField(source, "historicoEscolar", "historico_escolar")),
    evasaoEscolar: asBoolean(readField(source, "evasaoEscolar", "evasao_escolar")),
    evasaoEscolarMotivo: asString(readField(source, "evasaoEscolarMotivo", "evasao_escolar_motivo")),
    evasaoEscolarTempo: asString(readField(source, "evasaoEscolarTempo", "evasao_escolar_tempo")),
    ubsReferencia: asString(readField(source, "ubsReferencia", "ubs_referencia")),
    locaisAtendimento: asStringArray(readField(source, "locaisAtendimento", "locais_atendimento")),
    temProblemaSaude: asBoolean(readField(source, "temProblemaSaude", "tem_problema_saude")),
    problemaSaudeDescricao: asString(readField(source, "problemaSaudeDescricao", "problema_saude_descricao")),
    temRestricoes: asBoolean(readField(source, "temRestricoes", "tem_restricoes")),
    restricoesDescricao: asString(readField(source, "restricoesDescricao", "restricoes_descricao")),
    usaMedicamentos: asBoolean(readField(source, "usaMedicamentos", "usa_medicamentos")),
    medicamentosDescricao: asString(readField(source, "medicamentosDescricao", "medicamentos_descricao")),
    temAlergias: asBoolean(readField(source, "temAlergias", "tem_alergias")),
    alergiasDescricao: asString(readField(source, "alergiasDescricao", "alergias_descricao")),
    acompanhamentos: asString(readField(source, "acompanhamentos")),
    temDeficiencia: asBoolean(readField(source, "temDeficiencia", "tem_deficiencia")),
    deficienciaDescricao: asString(readField(source, "deficienciaDescricao", "deficiencia_descricao")),
    temBronquite: asBoolean(readField(source, "temBronquite", "tem_bronquite")),
    temFaltaAr: asBoolean(readField(source, "temFaltaAr", "tem_falta_ar")),
    acompanhamentoOdontologico: asBoolean(readField(source, "acompanhamentoOdontologico", "acompanhamento_odontologico")),
    acompanhamentoOdontologicoLocal: asString(readField(source, "acompanhamentoOdontologicoLocal", "acompanhamento_odontologico_local")),
    acompanhamentoOdontologicoTempo: asString(readField(source, "acompanhamentoOdontologicoTempo", "acompanhamento_odontologico_tempo")),
    tratamentoOftalmologico: asBoolean(readField(source, "tratamentoOftalmologico", "tratamento_oftalmologico")),
    tratamentoOftalmologicoLocal: asString(readField(source, "tratamentoOftalmologicoLocal", "tratamento_oftalmologico_local")),
    usaOculos: asBoolean(readField(source, "usaOculos", "usa_oculos")),
    usaLentes: asBoolean(readField(source, "usaLentes", "usa_lentes")),
    restricaoFisica: asBoolean(readField(source, "restricaoFisica", "restricao_fisica")),
    restricaoFisicaDescricao: asString(readField(source, "restricaoFisicaDescricao", "restricao_fisica_descricao")),
    permaneceSozinhaEmCasa: asBoolean(readField(source, "permaneceSozinhaEmCasa", "permanece_sozinha_em_casa")),
    temSupervisao: asBoolean(readField(source, "temSupervisao", "tem_supervisao")),
    supervisaoDescricao: asString(readField(source, "supervisaoDescricao", "supervisao_descricao")),
    frequenciaInteracao: asString(readField(source, "frequenciaInteracao", "frequencia_interacao")),
    interacaoSocial: asStringArray(readField(source, "interacaoSocial", "interacao_social")),
    locaisLazer: asStringArray(readField(source, "locaisLazer", "locais_lazer")),
    atividadesExtras: asString(readField(source, "atividadesExtras", "atividades_extras")),
    atividadesExtrasLista: asStringArray(readField(source, "atividadesExtrasLista", "atividades_extras_lista")),
    cronogramaAtividades: asStringArray(readField(source, "cronogramaAtividades", "cronograma_atividades")),
    servicosUtilizados: asStringArray(readField(source, "servicosUtilizados", "servicos_utilizados")),
    situacaoPrioritaria: asBoolean(readField(source, "situacaoPrioritaria", "situacao_prioritaria")),
    observacoesGerais: asString(readField(source, "observacoesGerais", "observacoes_gerais")),
    termoResponsabilidade: asBoolean(readField(source, "termoResponsabilidade", "termo_responsabilidade")),
    autorizacaoImagem: asBoolean(readField(source, "autorizacaoImagem", "autorizacao_imagem")),
    autorizacaoSaida: asString(readField(source, "autorizacaoSaida", "autorizacao_saida")) as Student["autorizacaoSaida"],
    pessoasAutorizadas: Array.isArray(readField(source, "pessoasAutorizadas", "pessoas_autorizadas"))
      ? (readField(source, "pessoasAutorizadas", "pessoas_autorizadas") as unknown[]).map(normalizePessoaAutorizada)
      : [],
  };
}

function normalizeSexo(value: string): Student["sexo"] {
  const v = value.trim();
  if (!v) return "";
  const lower = v.toLowerCase();
  if (lower === "masculino") return "Masculino";
  if (lower === "feminino") return "Feminino";
  if (lower === "outro") return "Outro";
  if (v === "Masculino" || v === "Feminino" || v === "Outro") return v;
  return "";
}

async function apiRequest<T>(path: string, init?: RequestInit, actorEmail?: string): Promise<T> {
  const res = await fetchBackend(path, init, actorEmail);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(normalizeErrorMessage(text, res.status));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const actorEmail = user?.email || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [auditEvents, setAuditEvents] = useState<StudentAuditEvent[]>([]);

  const loadStudents = useCallback(async () => {
    const list = await apiRequest<ApiStudentListItem[]>("/students");
    setStudents(
      list.map((s) => ({
        ...emptyStudent,
        id: s.id,
        createdAt: s.createdAt ?? "",
        nomeCompleto: s.nomeCompleto,
        idade: s.idade ?? null,
        cpf: s.cpf ?? "",
        nomeMae: s.nomeMae ?? "",
        escolaNome: s.escolaNome ?? "",
        sexo: normalizeSexo(s.sexo ?? ""),
      })),
    );
  }, []);

  const loadAuditEvents = useCallback(async () => {
    const events = await apiRequest<ApiStudentAuditEvent[]>("/student-audit-events");
    setAuditEvents(
      events.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        studentName: e.studentName,
        action: e.action,
        at: e.at,
        by: e.byEmail,
        changedFields: e.changedFields ?? undefined,
      })),
    );
  }, []);

  useEffect(() => {
    if (!user) {
      setStudents([]);
      setAuditEvents([]);
      return;
    }
    void loadStudents();
    void loadAuditEvents();
  }, [loadAuditEvents, loadStudents, user]);

  const getStudent = useCallback(async (id: string) => {
    const student = await apiRequest<unknown>(`/students/${encodeURIComponent(id)}`);
    return student ? normalizeStudentPayload(student) : null;
  }, []);

  const addStudent = useCallback(
    async (data: StudentDraft) => {
      if (!actorEmail) throw new Error("Usuário não autenticado.");
      const createdRaw = await apiRequest<unknown>("/students", { method: "POST", body: JSON.stringify(data) }, actorEmail);
      const created = normalizeStudentPayload(createdRaw);
      setStudents((prev) => [created, ...prev.map((s) => (s.id === created.id ? created : s))]);
      await loadAuditEvents();
      return created;
    },
    [actorEmail, loadAuditEvents],
  );

  const updateStudent = useCallback(
    async (id: string, data: StudentDraft) => {
      if (!actorEmail) throw new Error("Usuário não autenticado.");
      const updatedRaw = await apiRequest<unknown>(`/students/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }, actorEmail);
      const updated = normalizeStudentPayload(updatedRaw);
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      await loadAuditEvents();
      return updated;
    },
    [actorEmail, loadAuditEvents],
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      if (!actorEmail) throw new Error("Usuário não autenticado.");
      await apiRequest<void>(`/students/${encodeURIComponent(id)}`, { method: "DELETE" }, actorEmail);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      await loadAuditEvents();
    },
    [actorEmail, loadAuditEvents],
  );

  const value = useMemo<StudentContextValue>(
    () => ({ students, auditEvents, getStudent, addStudent, updateStudent, deleteStudent }),
    [addStudent, auditEvents, deleteStudent, getStudent, students, updateStudent],
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    throw new Error("useStudents deve ser usado dentro de <StudentProvider />");
  }
  return ctx;
}

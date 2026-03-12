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

const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:3000";
const API_BASE_URL_PRIMARY: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const API_BASE_URL_FALLBACK: string = (import.meta.env.VITE_API_URL_FALLBACK as string | undefined) ?? DEFAULT_LOCAL_API_BASE_URL;

let activeApiBaseUrl = [API_BASE_URL_PRIMARY, API_BASE_URL_FALLBACK, DEFAULT_LOCAL_API_BASE_URL]
  .map((v) => v.trim())
  .filter(Boolean)[0]!;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function getApiBaseCandidates(): string[] {
  const all = [API_BASE_URL_PRIMARY, API_BASE_URL_FALLBACK, DEFAULT_LOCAL_API_BASE_URL]
    .map((v) => v.trim())
    .filter(Boolean)
    .map(normalizeBaseUrl);
  return Array.from(new Set(all));
}

function canRetryWithFallback(method: string, status: number) {
  const m = method.toUpperCase();
  if (m !== "GET") return false;
  return status === 502 || status === 503 || status === 504;
}

export async function fetchBackend(path: string, init?: RequestInit, actorEmail?: string): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (actorEmail) headers.set("x-user-email", actorEmail);

  const candidates = getApiBaseCandidates();
  const preferred = normalizeBaseUrl(activeApiBaseUrl);
  const ordered = [preferred, ...candidates.filter((c) => c !== preferred)];

  let lastError: unknown = undefined;

  for (const base of ordered) {
    try {
      const res = await fetch(`${base}${path}`, { ...init, headers });
      if (res.ok || !canRetryWithFallback(method, res.status)) {
        activeApiBaseUrl = base;
        return res;
      }
      lastError = new Error(`Erro HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Falha de comunicação com o servidor.");
}

type ApiStudentListItem = {
  id: string;
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
    throw new Error(text || `Erro HTTP ${res.status}`);
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
    const student = await apiRequest<Student>(`/students/${encodeURIComponent(id)}`);
    return student || null;
  }, []);

  const addStudent = useCallback(
    async (data: StudentDraft) => {
      if (!actorEmail) throw new Error("Usuário não autenticado.");
      const created = await apiRequest<Student>("/students", { method: "POST", body: JSON.stringify(data) }, actorEmail);
      setStudents((prev) => [created, ...prev.map((s) => (s.id === created.id ? created : s))]);
      await loadAuditEvents();
      return created;
    },
    [actorEmail, loadAuditEvents],
  );

  const updateStudent = useCallback(
    async (id: string, data: StudentDraft) => {
      if (!actorEmail) throw new Error("Usuário não autenticado.");
      const updated = await apiRequest<Student>(`/students/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }, actorEmail);
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

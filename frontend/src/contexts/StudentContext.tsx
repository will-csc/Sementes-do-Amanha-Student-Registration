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
const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_LOCAL_API_BASE_URL;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
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
  const base = normalizeBaseUrl(API_BASE_URL.trim() || DEFAULT_LOCAL_API_BASE_URL);
  return fetch(`${base}${path}`, { ...init, headers });
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

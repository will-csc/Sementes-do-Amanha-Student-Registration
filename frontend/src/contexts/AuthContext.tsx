import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Role = "admin" | "user";

type AccountStatus = "pending" | "approved" | "rejected";

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: Role;
}

interface StoredSession {
  user: AuthUser;
  startedAt: string;
  expiresAt: string;
}

export interface Account {
  id: string;
  name?: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export type AuthAttemptResult =
  | { ok: true; status: "approved"; user: AuthUser }
  | { ok: false; status: "pending" | "rejected"; reason: string };

interface AuthContextValue {
  user: AuthUser | null;
  accounts: Account[];
  isReady: boolean;
  login: (email: string, password: string) => Promise<AuthAttemptResult>;
  signup: (email: string, password: string, name?: string) => Promise<AuthAttemptResult>;
  logout: () => void;
  deleteAccount: (id: string) => Promise<void>;
  approveAccount: (id: string) => Promise<void>;
  rejectAccount: (id: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function inferRole(email: string): Role {
  const normalized = email.trim().toLowerCase();
  if (normalized.startsWith("admin") || normalized.startsWith("adm")) return "admin";
  return "user";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const storageKeys = {
  session: "sda.session",
} as const;
const DEFAULT_LOCAL_API_BASE_URLS = ["http://localhost:3000", "http://localhost:10000"] as const;
const API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL_FALLBACK = import.meta.env.VITE_API_URL_FALLBACK as string | undefined;
const SESSION_DURATION_MS = 60 * 60 * 1000;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

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

function normalizeErrorMessage(value: string, status: number) {
  const raw = value.trim();
  if (!raw) return `Erro HTTP ${status}`;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error.trim();
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim();
  } catch {}
  return raw;
}

async function fetchAuthBackend(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
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

function normalizeAccount(account: Partial<Account> & { id: string; email: string }): Account {
  const status: AccountStatus = account.status || "pending";
  const role = (account.role || inferRole(account.email)) as Role;
  return {
    ...account,
    id: account.id,
    email: account.email,
    role,
    status,
    createdAt: account.createdAt || new Date().toISOString(),
    lastLoginAt: account.lastLoginAt || account.createdAt || new Date().toISOString(),
    approvedAt: status === "approved" ? account.approvedAt || account.createdAt : undefined,
    rejectedAt: status === "rejected" ? account.rejectedAt || account.createdAt : undefined,
  };
}

function normalizeAuthUser(value: Partial<Account> & { id: string; email: string }): AuthUser {
  return {
    id: value.id,
    email: value.email,
    role: (value.role || inferRole(value.email)) as Role,
    name: value.name,
  };
}

function buildStoredSession(user: AuthUser, startedAt = new Date()) : StoredSession {
  return {
    user,
    startedAt: startedAt.toISOString(),
    expiresAt: new Date(startedAt.getTime() + SESSION_DURATION_MS).toISOString(),
  };
}

function parseStoredSession(value: string | null): StoredSession | null {
  const parsed = safeParseJson<StoredSession | AuthUser>(value);
  if (!parsed) return null;

  if ("user" in parsed && parsed.user && typeof parsed.user === "object") {
    const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : new Date(0);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return null;
    return {
      user: { ...parsed.user, role: inferRole(parsed.user.email) },
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt,
    };
  }

  const legacyUser = parsed as AuthUser;
  return buildStoredSession({ ...legacyUser, role: inferRole(legacyUser.email) });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [session, setSession] = useState<StoredSession | null>(() => parseStoredSession(localStorage.getItem(storageKeys.session)));
  const user = session?.user ?? null;

  useEffect(() => {
    if (session) {
      localStorage.setItem(storageKeys.session, JSON.stringify(session));
      return;
    }
    localStorage.removeItem(storageKeys.session);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) {
      setSession(null);
      return;
    }
    const remaining = expiresAtMs - Date.now();
    if (remaining <= 0) {
      setSession(null);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setSession(null);
    }, remaining);
    return () => window.clearTimeout(timeoutId);
  }, [session]);

  const refreshAccounts = useCallback(async () => {
    const res = await fetchAuthBackend("/users");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(normalizeErrorMessage(text, res.status));
    }
    const data = (await res.json()) as Array<Partial<Account> & { id: string; email: string }>;
    const normalizedAccounts = data.map(normalizeAccount);
    setAccounts(normalizedAccounts);
    setSession((current) => {
      if (!current) return current;
      const matched = normalizedAccounts.find((account) => account.id === current.user.id);
      if (!matched || matched.status !== "approved") return null;
      return {
        ...current,
        user: normalizeAuthUser(matched),
      };
    });
  }, []);

  useEffect(() => {
    let active = true;
    void refreshAccounts()
      .catch(() => {})
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, [refreshAccounts]);

  const login = useCallback(async (email: string, password: string): Promise<AuthAttemptResult> => {
    const res = await fetchAuthBackend("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const payload = (await res.json().catch(() => null)) as
      | { user?: Partial<Account> & { id: string; email: string }; error?: string; status?: AccountStatus }
      | null;

    if (!res.ok || !payload?.user) {
      setSession(null);
      await refreshAccounts().catch(() => {});
      const status: "pending" | "rejected" = payload?.status === "pending" ? "pending" : "rejected";
      return {
        ok: false,
        status,
        reason: payload?.error || "Email ou senha inválidos.",
      };
    }

    const nextUser = normalizeAuthUser(payload.user);
    setSession(buildStoredSession(nextUser));
    await refreshAccounts().catch(() => {});
    return { ok: true, status: "approved", user: nextUser };
  }, [refreshAccounts]);

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<AuthAttemptResult> => {
    const res = await fetchAuthBackend("/users/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    const payload = (await res.json().catch(() => null)) as
      | { user?: Partial<Account> & { id: string; email: string }; error?: string; message?: string }
      | null;

    if (!res.ok || !payload?.user) {
      return {
        ok: false,
        status: "rejected",
        reason: payload?.error || "Não foi possível criar a conta.",
      };
    }

    const account = normalizeAccount(payload.user);
    await refreshAccounts().catch(() => {});

    if (account.status !== "approved") {
      setSession(null);
      return {
        ok: false,
        status: account.status,
        reason: payload?.message || "Cadastro realizado. Aguarde a aprovação do administrador para entrar.",
      };
    }

    const nextUser = normalizeAuthUser(account);
    setSession(buildStoredSession(nextUser));
    return { ok: true, status: "approved", user: nextUser };
  }, [refreshAccounts]);

  const logout = useCallback(() => setSession(null), []);

  const deleteAccount = useCallback(async (id: string) => {
    const res = await fetchAuthBackend(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(normalizeErrorMessage(text, res.status));
    }
    if (user?.id === id) setSession(null);
    await refreshAccounts();
  }, [refreshAccounts, user?.id]);

  const approveAccount = useCallback(async (id: string) => {
    const res = await fetchAuthBackend(`/users/${encodeURIComponent(id)}/approve`, { method: "PATCH" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(normalizeErrorMessage(text, res.status));
    }
    await refreshAccounts();
  }, [refreshAccounts]);

  const rejectAccount = useCallback(async (id: string) => {
    const res = await fetchAuthBackend(`/users/${encodeURIComponent(id)}/reject`, { method: "PATCH" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(normalizeErrorMessage(text, res.status));
    }
    if (user?.id === id) setSession(null);
    await refreshAccounts();
  }, [refreshAccounts, user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accounts,
      isReady,
      login,
      signup,
      logout,
      deleteAccount,
      approveAccount,
      rejectAccount,
      isAdmin: user?.role === "admin",
    }),
    [accounts, approveAccount, deleteAccount, isReady, login, logout, rejectAccount, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  }
  return ctx;
}

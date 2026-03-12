import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "admin" | "user";

type AccountStatus = "pending" | "approved" | "rejected";

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: Role;
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
  login: (email: string, password: string) => AuthAttemptResult;
  signup: (email: string, password: string, name?: string) => AuthAttemptResult;
  logout: () => void;
  deleteAccount: (id: string) => void;
  approveAccount: (id: string) => void;
  rejectAccount: (id: string) => void;
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
  accounts: "sda.accounts",
  session: "sda.session",
} as const;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const parsed = safeParseJson<Account[]>(localStorage.getItem(storageKeys.accounts));
    if (!Array.isArray(parsed)) return [];

    return parsed.map((a) => {
      const status: AccountStatus = (a as Account).status || "approved";
      return {
        ...a,
        role: inferRole(a.email),
        status,
      };
    });
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const parsed = safeParseJson<AuthUser>(localStorage.getItem(storageKeys.session));
    if (!parsed) return null;
    return { ...parsed, role: inferRole(parsed.email) };
  });

  useEffect(() => {
    localStorage.setItem(storageKeys.accounts, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(storageKeys.session, JSON.stringify(user));
      return;
    }
    localStorage.removeItem(storageKeys.session);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    const login = (email: string): AuthAttemptResult => {
      const now = new Date().toISOString();
      const normalizedEmail = email.trim();
      const role = inferRole(normalizedEmail);

      const existing = accounts.find((a) => a.email.trim().toLowerCase() === normalizedEmail.toLowerCase());
      const nextStatus: AccountStatus = existing?.status || (role === "admin" ? "approved" : "pending");
      const nextAccount: Account = existing
        ? { ...existing, role, email: normalizedEmail, lastLoginAt: now, status: nextStatus }
        : { id: createId(), email: normalizedEmail, role, createdAt: now, lastLoginAt: now, status: nextStatus };

      setAccounts((prev) => {
        const prevExisting = prev.find((a) => a.id === nextAccount.id);
        if (prevExisting) {
          return prev.map((a) => (a.id === nextAccount.id ? nextAccount : a));
        }
        return [nextAccount, ...prev];
      });

      if (nextAccount.status !== "approved") {
        setUser(null);
        return {
          ok: false,
          status: nextAccount.status,
          reason:
            nextAccount.status === "pending"
              ? "Conta aguardando aprovação do administrador."
              : "Conta rejeitada. Fale com o administrador.",
        };
      }

      const nextUser: AuthUser = { id: nextAccount.id, email: nextAccount.email, role: nextAccount.role, name: nextAccount.name };
      setUser(nextUser);
      return { ok: true, status: "approved", user: nextUser };
    };

    const signup = (email: string, _password: string, name?: string): AuthAttemptResult => {
      const now = new Date().toISOString();
      const normalizedEmail = email.trim();
      const role = inferRole(normalizedEmail);

      const trimmedName = name?.trim() || undefined;
      const existing = accounts.find((a) => a.email.trim().toLowerCase() === normalizedEmail.toLowerCase());
      const nextStatus: AccountStatus = existing?.status || (role === "admin" ? "approved" : "pending");
      const nextAccount: Account = existing
        ? {
            ...existing,
            role,
            email: normalizedEmail,
            name: trimmedName || existing.name,
            lastLoginAt: now,
            status: nextStatus,
          }
        : {
            id: createId(),
            email: normalizedEmail,
            name: trimmedName,
            role,
            createdAt: now,
            lastLoginAt: now,
            status: nextStatus,
          };

      setAccounts((prev) => {
        const prevExisting = prev.find((a) => a.id === nextAccount.id);
        if (prevExisting) {
          return prev.map((a) => (a.id === nextAccount.id ? nextAccount : a));
        }
        return [nextAccount, ...prev];
      });

      if (nextAccount.status !== "approved") {
        setUser(null);
        return {
          ok: false,
          status: nextAccount.status,
          reason: "Cadastro realizado. Aguarde a aprovação do administrador para entrar.",
        };
      }

      const nextUser: AuthUser = { id: nextAccount.id, email: nextAccount.email, role: nextAccount.role, name: nextAccount.name };
      setUser(nextUser);
      return { ok: true, status: "approved", user: nextUser };
    };

    const logout = () => setUser(null);

    const deleteAccount = (id: string) => {
      if (user?.role === "admin" && user.id === id) return;
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setUser((prev) => (prev?.id === id ? null : prev));
    };

    const approveAccount = (id: string) => {
      const now = new Date().toISOString();
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved", approvedAt: a.approvedAt || now, rejectedAt: undefined } : a)),
      );
    };

    const rejectAccount = (id: string) => {
      const now = new Date().toISOString();
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "rejected", rejectedAt: a.rejectedAt || now, approvedAt: undefined } : a)),
      );
      setUser((prev) => (prev?.id === id ? null : prev));
    };

    return {
      user,
      accounts,
      login: (email: string, _password: string) => login(email),
      signup: (email: string, _password: string, name?: string) => signup(email, _password, name),
      logout,
      deleteAccount,
      approveAccount,
      rejectAccount,
      isAdmin: user?.role === "admin",
    };
  }, [accounts, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  }
  return ctx;
}

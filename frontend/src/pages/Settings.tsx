import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBackend, useStudents } from "@/contexts/StudentContext";
import { Check, Trash2, X } from "lucide-react";

function formatDate(iso: string | undefined) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function renderAccountStatus(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    approved: { label: "Aprovado", className: "bg-emerald-500/10 text-emerald-700" },
    pending: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-800" },
    rejected: { label: "Rejeitado", className: "bg-red-500/10 text-red-700" },
  };

  const v = variants[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.className}`}>{v.label}</span>;
}

export default function Settings() {
  const { accounts, approveAccount, rejectAccount, deleteAccount, user } = useAuth();
  const { auditEvents } = useStudents();

  const pendingAccounts = useMemo(() => accounts.filter((a) => a.status === "pending"), [accounts]);
  const approvedAccounts = useMemo(() => accounts.filter((a) => a.status === "approved"), [accounts]);
  const cannotDeleteSelfAdmin = useMemo(() => user?.role === "admin", [user?.role]);

  const statsByAccount = useMemo(() => {
    const addedBy: Record<string, number> = {};
    const updatedBy: Record<string, number> = {};
    const updatedStudentsUnique: Record<string, Set<string>> = {};

    for (const e of auditEvents) {
      if (!e.by) continue;
      if (e.action === "create") {
        addedBy[e.by] = (addedBy[e.by] || 0) + 1;
      }
      if (e.action === "update") {
        updatedBy[e.by] = (updatedBy[e.by] || 0) + 1;
        if (!updatedStudentsUnique[e.by]) updatedStudentsUnique[e.by] = new Set();
        updatedStudentsUnique[e.by].add(e.studentId);
      }
    }

    return { addedBy, updatedBy, updatedStudentsUnique };
  }, [auditEvents]);

  const recentUpdates = useMemo(() => auditEvents.filter((e) => e.action === "update").slice(0, 50), [auditEvents]);

  const totalCreates = useMemo(() => auditEvents.filter((e) => e.action === "create").length, [auditEvents]);
  const totalUpdates = useMemo(() => auditEvents.filter((e) => e.action === "update").length, [auditEvents]);

  const [adminStats, setAdminStats] = useState<{
    approvedAccounts: number;
    pendingAccounts: number;
    alunosAdicionados: number;
    alteracoesEmAlunos: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetchBackend(`/stats/admin`, { headers: { accept: "application/json" } });
        if (!res.ok) return;
        const data = (await res.json()) as {
          approvedAccounts: number;
          pendingAccounts: number;
          alunosAdicionados: number;
          alteracoesEmAlunos: number;
        };
        if (!active) return;
        setAdminStats(data);
      } catch {
        if (!active) return;
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteAccount = (id: string, email: string) => {
    if (cannotDeleteSelfAdmin && user?.id === id) {
      window.alert("O usuário administrador não pode excluir a própria conta.");
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir a conta ${email}?`)) return;
    deleteAccount(id);
  };

  const handleApproveAccount = (id: string, email: string) => {
    if (!window.confirm(`Aprovar a conta ${email}?`)) return;
    approveAccount(id);
  };

  const handleRejectAccount = (id: string, email: string) => {
    if (!window.confirm(`Rejeitar a conta ${email}?`)) return;
    rejectAccount(id);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">Configurações</CardTitle>
            <CardDescription>Área disponível apenas para administradores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Contas aprovadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{adminStats?.approvedAccounts ?? approvedAccounts.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{adminStats?.pendingAccounts ?? pendingAccounts.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Alunos adicionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{adminStats?.alunosAdicionados ?? totalCreates}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Alterações em alunos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{adminStats?.alteracoesEmAlunos ?? totalUpdates}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Aprovação de logins</CardTitle>
            <CardDescription>Todo login/cadastro novo fica pendente até um admin aprovar.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta pendente.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Perfil</TableHead>
                    <TableHead className="hidden lg:table-cell">Solicitado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAccounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.email}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{a.role}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Aprovar" onClick={() => handleApproveAccount(a.id, a.email)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Rejeitar"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRejectAccount(a.id, a.email)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Contas</CardTitle>
            <CardDescription>
              Exibe as contas cadastradas neste navegador. Para ser admin, use um email que comece com <span className="font-medium">adm</span> ou{" "}
              <span className="font-medium">admin</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Perfil</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Criada em</TableHead>
                    <TableHead className="hidden lg:table-cell">Último login</TableHead>
                    <TableHead className="hidden md:table-cell">Alunos adicionados</TableHead>
                    <TableHead className="hidden md:table-cell">Alterações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => {
                    const added = statsByAccount.addedBy[a.email] || 0;
                    const updates = statsByAccount.updatedBy[a.email] || 0;
                    const updatedUnique = statsByAccount.updatedStudentsUnique[a.email]?.size || 0;

                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.email}</TableCell>
                        <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{a.role}</TableCell>
                        <TableCell className="hidden md:table-cell">{renderAccountStatus(a.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(a.lastLoginAt)}</TableCell>
                        <TableCell className="hidden md:table-cell">{added}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {updates} <span className="text-muted-foreground">(em {updatedUnique} alunos)</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {a.status === "pending" ? (
                              <>
                                <Button variant="ghost" size="icon" title="Aprovar" onClick={() => handleApproveAccount(a.id, a.email)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Rejeitar"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRejectAccount(a.id, a.email)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir conta"
                              className="text-destructive hover:text-destructive"
                              disabled={cannotDeleteSelfAdmin && user?.id === a.id}
                              onClick={() => handleDeleteAccount(a.id, a.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Histórico de alterações</CardTitle>
            <CardDescription>Últimas 50 alterações em alunos (data, quem alterou e quais campos mudaram).</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Quem</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Campos alterados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUpdates.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(e.at)}</TableCell>
                      <TableCell className="text-muted-foreground">{e.by}</TableCell>
                      <TableCell className="font-medium">{e.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{e.changedFields?.length ? e.changedFields.join(", ") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

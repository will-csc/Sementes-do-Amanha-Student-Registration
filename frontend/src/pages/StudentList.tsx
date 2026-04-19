import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBackend, useStudents } from '@/contexts/StudentContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Pencil, Trash2, UserPlus, Users, GraduationCap, BookOpen, FileDown } from 'lucide-react';

type SearchMode = 'nome' | 'cpf';

function toastError(err: unknown, fallback: string) {
  const msg = (err instanceof Error ? err.message : '').trim() || fallback;
  toast.error(msg, { id: `error:${msg}` });
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

function normalizeHttpErrorText(text: string, status: number) {
  const raw = text.trim();
  if (!raw) return `Erro HTTP ${status}`;
  const lower = raw.toLowerCase();
  if (lower.startsWith("<!doctype html") || lower.startsWith("<html") || lower.includes("<head") || lower.includes("<body")) {
    return `Erro HTTP ${status}`;
  }
  const msg = raw.replace(/\s+/g, " ").trim();
  if (msg.length > 180) return `${msg.slice(0, 177)}...`;
  return msg || `Erro HTTP ${status}`;
}

function parseFilenameFromContentDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/filename="([^"]+)"/i) || value.match(/filename=([^;]+)/i);
  if (!match) return null;
  return match[1].trim();
}

const StudentList = () => {
  const { students, deleteStudent } = useStudents();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('nome');
  const [statsFromApi, setStatsFromApi] = useState<{ totalStudents: number; schools: number; thisMonth: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;

    if (searchMode === 'cpf') {
      const query = normalizeDigits(search);
      if (!query) return true;
      return normalizeDigits(s.cpf || '').includes(query);
    }

    const query = search.toLowerCase();
    return (
      s.nomeCompleto.toLowerCase().includes(query) ||
      s.escolaNome.toLowerCase().includes(query) ||
      s.nomeMae.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetchBackend(`/stats/students`, { headers: { accept: 'application/json' } });
        if (!res.ok) return;
        const data = (await res.json()) as { totalStudents: number; schools: number; thisMonth: number };
        if (!active) return;
        setStatsFromApi(data);
      } catch {
        if (!active) return;
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const fallbackSchools = new Set(students.map((s) => s.escolaNome).filter(Boolean)).size;
    return {
      totalStudents: statsFromApi?.totalStudents ?? students.length,
      schools: statsFromApi?.schools ?? fallbackSchools,
      thisMonth: statsFromApi?.thisMonth ?? students.length,
    };
  }, [statsFromApi, students]);

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deleteDialog.id);
      toast.success('Aluno excluído com sucesso!');
      setDeleteDialog({ open: false, id: '', name: '' });
    } catch (e) {
      toastError(e, 'Falha ao excluir aluno.');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadContractPdf = async (studentId: string) => {
    setDownloadingId(studentId);
    try {
      const res = await fetchBackend(`/students/${encodeURIComponent(studentId)}/contract`, {
        method: "GET",
        headers: { accept: "application/pdf" },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(normalizeHttpErrorText(text, res.status));
      }
      const filename = parseFilenameFromContentDisposition(res.headers.get("content-disposition")) || "contrato.pdf";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setDownloadingId((prev) => (prev === studentId ? null : prev));
    }
  };

  const cards = [
    { label: 'Total de Alunos', value: stats.totalStudents, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Escolas', value: stats.schools, icon: BookOpen, color: 'bg-secondary/10 text-secondary' },
    { label: 'Este mês', value: stats.thisMonth, icon: GraduationCap, color: 'bg-accent/20 text-accent-foreground' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => {
            if (isDeleting) return;
            if (!open) {
              setDeleteDialog({ open: false, id: '', name: '' });
              return;
            }
            setDeleteDialog((prev) => ({ ...prev, open }));
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir aluno</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <span className="font-medium text-foreground">{deleteDialog.name}</span>? Essa ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" disabled={isDeleting} onClick={() => setDeleteDialog({ open: false, id: '', name: '' })}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={isDeleting} onClick={confirmDelete}>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map(stat => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl">Lista de Alunos</CardTitle>
            <div className="flex gap-3">
              <div className="flex flex-1 gap-2 sm:w-80">
                <Select
                  className="w-28"
                  value={searchMode}
                  onValueChange={(v) => setSearchMode(v as SearchMode)}
                >
                  <option value="nome">Nome</option>
                  <option value="cpf">CPF</option>
                </Select>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchMode === 'cpf' ? 'Buscar por CPF...' : 'Buscar por nome...'}
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    inputMode={searchMode === 'cpf' ? 'numeric' : undefined}
                  />
                </div>
              </div>
              <Button onClick={() => navigate('/students/new')} className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Aluno</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">Nenhum aluno encontrado</p>
                <p className="text-sm text-muted-foreground/70">Tente buscar com outro termo ou cadastre um novo aluno.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Idade</TableHead>
                      <TableHead className="hidden lg:table-cell">Mãe</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead className="hidden sm:table-cell">Sexo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(student => (
                      <TableRow key={student.id} className="group">
                        <TableCell className="font-medium">{student.nomeCompleto}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{student.idade ? `${student.idade} anos` : '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{student.nomeMae || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {student.escolaNome || 'Não informada'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground capitalize">{student.sexo || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadContractPdf(student.id).catch((e) => toastError(e, "Falha ao baixar contrato."))}
                              title="Baixar contrato"
                              disabled={downloadingId === student.id}
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/students/edit/${student.id}`)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(student.id, student.nomeCompleto)}
                              title="Excluir"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default StudentList;

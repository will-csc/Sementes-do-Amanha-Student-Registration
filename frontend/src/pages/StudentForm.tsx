import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBackend, useStudents } from '@/contexts/StudentContext';
import { Student, emptyStudent } from '@/types/student';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { UserPlus, Save, Plus, X, User, Users, HeartPulse, HandHelping, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

import SectionDadosPessoais from '@/components/student-form/SectionDadosPessoais';
import SectionResponsaveis from '@/components/student-form/SectionResponsaveis';
import SectionSaudeEscolaridade from '@/components/student-form/SectionSaudeEscolaridade';
import SectionConvivencia from '@/components/student-form/SectionConvivencia';
import SectionTermos from '@/components/student-form/SectionTermos';

type FormData = Omit<Student, 'id'>;

const sections = [
  { value: 'dados-pessoais', label: 'Dados Pessoais', icon: User },
  { value: 'responsaveis', label: 'Responsáveis e Família', icon: Users },
  { value: 'saude-escolaridade', label: 'Saúde e Escolaridade', icon: HeartPulse },
  { value: 'convivencia', label: 'Convivência Social', icon: HandHelping },
  { value: 'termos', label: 'Termos e Autorizações', icon: FileCheck },
];

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudent, addStudent, updateStudent } = useStudents();
  const isEditing = Boolean(id);

  const [tabs, setTabs] = useState<FormData[]>([{ ...emptyStudent }]);
  const [activeTab, setActiveTab] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [showCopy, setShowCopy] = useState(false);
  const [copyMode, setCopyMode] = useState<"all" | "selected">("all");
  const [copySelected, setCopySelected] = useState<boolean[]>([]);

  useEffect(() => {
    let active = true;
    if (!id) return;
    void (async () => {
      try {
        const student = await getStudent(id);
        if (!active || !student) return;
        const { id: _id, ...rest } = student;
        setTabs([rest]);
        setActiveTab(0);
      } catch {
        if (!active) return;
      }
    })();
    return () => {
      active = false;
    };
  }, [getStudent, id]);

  const handleChange = (field: string, value: any) => {
    setTabs(prev => prev.map((tab, i) =>
      i === activeTab ? { ...tab, [field]: value } : tab
    ));
  };

  const addTab = () => {
    if (tabs.length >= 7) return;
    setTabs(prev => [...prev, { ...emptyStudent }]);
    setActiveTab(tabs.length);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) return;
    setTabs(prev => prev.filter((_, i) => i !== index));
    setActiveTab(prev => prev >= index ? Math.max(0, prev - 1) : prev);
  };

  const parseFilenameFromContentDisposition = (value: string | null): string | null => {
    if (!value) return null;
    const match = value.match(/filename="([^"]+)"/i) || value.match(/filename=([^;]+)/i);
    if (!match) return null;
    return match[1].trim();
  };

  const downloadContractPdf = async (studentId: string) => {
    const res = await fetchBackend(`/students/${encodeURIComponent(studentId)}/contract`, {
      method: "GET",
      headers: { accept: "application/pdf" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Erro HTTP ${res.status}`);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && id) {
        await updateStudent(id, tabs[0]);
        toast.success('Aluno atualizado com sucesso!');
        navigate('/students');
      } else if (tabs.length > 1) {
        setSelected(tabs.map(() => true));
        setShowConfirm(true);
      } else {
        const created = await addStudent(tabs[0]);
        await downloadContractPdf(created.id);
        toast.success('Aluno cadastrado com sucesso!');
        navigate('/students');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao salvar aluno.');
    }
  };

  const handleConfirmRegister = async () => {
    const toRegister = tabs.filter((_, i) => selected[i]);
    if (toRegister.length === 0) {
      toast.error('Selecione ao menos um aluno.');
      return;
    }
    try {
      for (const form of toRegister) {
        const created = await addStudent(form);
        await downloadContractPdf(created.id);
      }
      toast.success(toRegister.length > 1 ? `${toRegister.length} alunos cadastrados com sucesso!` : 'Aluno cadastrado com sucesso!');
      setShowConfirm(false);
      navigate('/students');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao cadastrar alunos.');
    }
  };

  const toggleSelected = (index: number) => {
    setSelected(prev => prev.map((v, i) => i === index ? !v : v));
  };

  const openCopyDialog = () => {
    setCopyMode("all");
    setCopySelected(tabs.map((_, i) => i !== 0));
    setShowCopy(true);
  };

  const toggleCopySelected = (index: number) => {
    setCopySelected(prev => prev.map((v, i) => i === index ? !v : v));
  };

  const applyCopyFromAluno1 = () => {
    if (tabs.length <= 1) {
      setShowCopy(false);
      return;
    }
    if (copyMode === "selected" && copySelected.slice(1).filter(Boolean).length === 0) {
      toast.error("Selecione ao menos um aluno para colar.");
      return;
    }

    const source = tabs[0];
    setTabs(prev =>
      prev.map((tab, i) => {
        if (i === 0) return tab;
        const shouldCopy = copyMode === "all" ? true : Boolean(copySelected[i]);
        if (!shouldCopy) return tab;
        return {
          ...tab,
          enderecoCep: source.enderecoCep,
          enderecoLogradouro: source.enderecoLogradouro,
          enderecoNumero: source.enderecoNumero,
          enderecoComplemento: source.enderecoComplemento,
          enderecoBairro: source.enderecoBairro,
          enderecoCidade: source.enderecoCidade,
          enderecoUf: source.enderecoUf,
          nomePai: source.nomePai,
          nomeMae: source.nomeMae,
          crasReferencia: source.crasReferencia,
          responsaveisLegais: source.responsaveisLegais.map(r => ({ ...r })),
          membrosFamiliares: source.membrosFamiliares.map(m => ({ ...m })),
          estadoCivilPais: source.estadoCivilPais,
          contatoConjugeNome: source.contatoConjugeNome,
          contatoConjugeTelefone: source.contatoConjugeTelefone,
          tipoDomicilio: source.tipoDomicilio,
          rendaFamiliar: source.rendaFamiliar,
          beneficios: [...source.beneficios],
          escolaNome: source.escolaNome,
          escolaSerie: source.escolaSerie,
          escolaAno: source.escolaAno,
          escolaProfessor: source.escolaProfessor,
          escolaPeriodo: source.escolaPeriodo,
          historicoEscolar: source.historicoEscolar,
          ubsReferencia: source.ubsReferencia,
          termoResponsabilidade: source.termoResponsabilidade,
          autorizacaoImagem: source.autorizacaoImagem,
          autorizacaoSaida: source.autorizacaoSaida,
          pessoasAutorizadas: source.pessoasAutorizadas.map(p => ({ ...p })),
        };
      })
    );

    const count = (copyMode === "all" ? tabs.length - 1 : copySelected.slice(1).filter(Boolean).length);
    toast.success(count > 1 ? `Informações copiadas para ${count} alunos.` : "Informações copiadas para 1 aluno.");
    setShowCopy(false);
  };

  const form = tabs[activeTab];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm">
                {isEditing ? <Save className="h-5 w-5 text-primary-foreground" /> : <UserPlus className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div>
                <CardTitle className="text-xl">{isEditing ? 'Editar Aluno' : 'Cadastrar Alunos'}</CardTitle>
                <CardDescription>
                  {isEditing ? 'Atualize os dados do aluno' : 'Cadastre até 7 alunos de uma vez. Preencha todas as seções.'}
                </CardDescription>
              </div>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2 mt-4">
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      activeTab === i
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{tab.nomeCompleto ? tab.nomeCompleto.split(' ')[0] : `Aluno ${i + 1}`}</span>
                    {tabs.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); removeTab(i); }}
                        className={cn(
                          "ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground",
                          activeTab === i ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ))}

                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={openCopyDialog}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <span>Copiar do Aluno 1</span>
                  </button>
                )}

                {tabs.length < 7 && (
                  <button
                    type="button"
                    onClick={addTab}
                    className="flex items-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              <Accordion type="multiple" defaultValue={['dados-pessoais']} className="space-y-2">
                {sections.map(section => (
                  <AccordionItem key={section.value} value={section.value} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <section.icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">{section.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      {section.value === 'dados-pessoais' && <SectionDadosPessoais data={form} onChange={handleChange} />}
                      {section.value === 'responsaveis' && <SectionResponsaveis data={form} onChange={handleChange} />}
                      {section.value === 'saude-escolaridade' && <SectionSaudeEscolaridade data={form} onChange={handleChange} />}
                      {section.value === 'convivencia' && <SectionConvivencia data={form} onChange={handleChange} />}
                      {section.value === 'termos' && <SectionTermos data={form} onChange={handleChange} />}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="flex gap-3 pt-6">
                <Button type="submit" className="flex-1" size="lg">
                  {isEditing
                    ? 'Salvar Alterações'
                    : tabs.length > 1
                      ? `Cadastrar ${tabs.length} Alunos`
                      : 'Cadastrar Aluno'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/students')}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cadastro</DialogTitle>
            <DialogDescription>Selecione quais alunos deseja cadastrar:</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {tabs.map((tab, i) => (
              <label
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  selected[i] ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Checkbox checked={selected[i]} onCheckedChange={() => toggleSelected(i)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tab.nomeCompleto || `Aluno ${i + 1}`}</p>
                  <p className="text-xs text-muted-foreground truncate">{tab.idade ? `${tab.idade} anos` : ''} · {tab.escolaNome || 'Sem escola'}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
            <Button onClick={handleConfirmRegister}>
              Cadastrar {selected.filter(Boolean).length} aluno{selected.filter(Boolean).length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopy} onOpenChange={setShowCopy}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar informações do Aluno 1</DialogTitle>
            <DialogDescription>
              Copia endereço, responsáveis, dados familiares, escola e autorizações. Não altera dados pessoais (nome, CPF, RG, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={cn("flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors", copyMode === "all" ? "border-primary bg-primary/5" : "border-border")}>
                <input
                  type="radio"
                  name="copyMode"
                  value="all"
                  checked={copyMode === "all"}
                  onChange={() => setCopyMode("all")}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Colar em todos</span>
              </label>
              <label className={cn("flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors", copyMode === "selected" ? "border-primary bg-primary/5" : "border-border")}>
                <input
                  type="radio"
                  name="copyMode"
                  value="selected"
                  checked={copyMode === "selected"}
                  onChange={() => setCopyMode("selected")}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Escolher alunos</span>
              </label>
            </div>

            {copyMode === "selected" && (
              <div className="space-y-2">
                {tabs.map((tab, i) => {
                  if (i === 0) return null;
                  return (
                    <label
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        copySelected[i] ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <Checkbox checked={copySelected[i]} onCheckedChange={() => toggleCopySelected(i)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tab.nomeCompleto || `Aluno ${i + 1}`}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCopy(false)}>Cancelar</Button>
            <Button onClick={applyCopyFromAluno1}>
              Colar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StudentForm;

import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { mapToWordPayload } from '@/utils/mapToWordPayload';

import SectionDadosPessoais from '@/components/student-form/SectionDadosPessoais';
import SectionResponsaveis from '@/components/student-form/SectionResponsaveis';
import SectionSaudeEscolaridade from '@/components/student-form/SectionSaudeEscolaridade';
import SectionConvivencia from '@/components/student-form/SectionConvivencia';
import SectionTermos from '@/components/student-form/SectionTermos';


type FormData = Omit<Student, 'id'>;

function toastError(err: unknown, fallback: string) {
  const msg = (err instanceof Error ? err.message : '').trim() || fallback;
  toast.error(msg, { id: `error:${msg}` });
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

function friendlyDocumentError(status: number) {
  if (status === 404) return "Documento indisponivel no momento.";
  return "Nao foi possivel gerar os documentos agora. Tente novamente em instantes.";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function ageYearsFromIsoDate(value: string) {
  const t = value.trim();
  if (!t) return null;
  const d = new Date(`${t}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years -= 1;
  return years;
}

function isLettersOnly(value: string) {
  const t = value.trim();
  if (!t) return true;
  return /^[\p{L}\s'-]+$/u.test(t);
}

type ValidationError = {
  tabIndex: number;
  fieldId?: string;
  message: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

function validateForms(items: { tabIndex: number; data: FormData }[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const added = new Set<string>();
  const add = (tabIndex: number, fieldId: string | undefined, message: string) => {
    const key = `${tabIndex}:${fieldId ?? "-"}:${message}`;
    if (added.has(key)) return;
    added.add(key);
    errors.push({ tabIndex, fieldId, message });
  };

  const cpfOwner = new Map<string, number>();
  const rgOwner = new Map<string, number>();
  const termoOwner = new Map<string, number>();
  const folhaOwner = new Map<string, number>();
  const livroOwner = new Map<string, number>();

  const alunoLabel = (tabIndex: number) => `Aluno ${tabIndex + 1}`;

  for (const { tabIndex, data: s } of items) {
    const cpf = digitsOnly(s.cpf);
    const rg = digitsOnly(s.rg);
    const termo = digitsOnly(s.certidaoTermo);
    const folha = digitsOnly(s.certidaoFolha);
    const livro = s.certidaoLivro.trim().toUpperCase();

    if (cpf) {
      const other = cpfOwner.get(cpf);
      if (other !== undefined) {
        add(tabIndex, "cpf", `${alunoLabel(tabIndex)}: CPF duplicado (igual ao Aluno ${other + 1}).`);
        add(other, "cpf", `${alunoLabel(other)}: CPF duplicado (igual ao Aluno ${tabIndex + 1}).`);
      } else {
        cpfOwner.set(cpf, tabIndex);
      }
    }

    if (rg) {
      const other = rgOwner.get(rg);
      if (other !== undefined) {
        add(tabIndex, "rg", `${alunoLabel(tabIndex)}: RG duplicado (igual ao Aluno ${other + 1}).`);
        add(other, "rg", `${alunoLabel(other)}: RG duplicado (igual ao Aluno ${tabIndex + 1}).`);
      } else {
        rgOwner.set(rg, tabIndex);
      }
    }

    if (termo) {
      if (termo.length !== 7) {
        add(tabIndex, "certidaoTermo", `${alunoLabel(tabIndex)}: Termo deve ter exatamente 7 dígitos.`);
      } else {
        const other = termoOwner.get(termo);
        if (other !== undefined) {
          add(tabIndex, "certidaoTermo", `${alunoLabel(tabIndex)}: Termo duplicado (igual ao Aluno ${other + 1}).`);
          add(other, "certidaoTermo", `${alunoLabel(other)}: Termo duplicado (igual ao Aluno ${tabIndex + 1}).`);
        } else {
          termoOwner.set(termo, tabIndex);
        }
      }
    }

    if (folha) {
      if (folha.length !== 3) {
        add(tabIndex, "certidaoFolha", `${alunoLabel(tabIndex)}: Folha deve ter exatamente 3 dígitos.`);
      } else {
        const other = folhaOwner.get(folha);
        if (other !== undefined) {
          add(tabIndex, "certidaoFolha", `${alunoLabel(tabIndex)}: Folha duplicada (igual ao Aluno ${other + 1}).`);
          add(other, "certidaoFolha", `${alunoLabel(other)}: Folha duplicada (igual ao Aluno ${tabIndex + 1}).`);
        } else {
          folhaOwner.set(folha, tabIndex);
        }
      }
    }

    if (livro) {
      if (livro.length !== 5 || !/^[0-9A-Za-z]{5}$/.test(livro)) {
        add(tabIndex, "certidaoLivro", `${alunoLabel(tabIndex)}: Livro deve ter exatamente 5 caracteres (letras e números).`);
      } else {
        const other = livroOwner.get(livro);
        if (other !== undefined) {
          add(tabIndex, "certidaoLivro", `${alunoLabel(tabIndex)}: Livro duplicado (igual ao Aluno ${other + 1}).`);
          add(other, "certidaoLivro", `${alunoLabel(other)}: Livro duplicado (igual ao Aluno ${tabIndex + 1}).`);
        } else {
          livroOwner.set(livro, tabIndex);
        }
      }
    }

    if (s.crasReferencia.trim().length > 75) {
      add(tabIndex, "crasReferencia", `${alunoLabel(tabIndex)}: CRAS referência deve ter no máximo 75 caracteres.`);
    }

    if (s.autorizacaoSaida.trim() === "") {
      add(tabIndex, "autorizacaoSaida", `${alunoLabel(tabIndex)}: Autorização de saída é obrigatória.`);
    }

    if (s.locomocao === "acompanhado" && s.locomocaoAcompanhante.trim() === "") {
      add(tabIndex, "locomocaoAcompanhante", `${alunoLabel(tabIndex)}: Informe quem acompanha a criança.`);
    }

    if (s.beneficios.includes("Outros") && s.beneficioOutros.trim() === "") {
      add(tabIndex, "beneficioOutros", `${alunoLabel(tabIndex)}: Informe qual é o outro benefício.`);
    }

    const ano = s.escolaAno.trim();
    if (ano) {
      const lower = ano.toLowerCase();
      if (!/^\d/.test(ano) || !lower.includes("ano")) {
        add(tabIndex, "escolaAno", `${alunoLabel(tabIndex)}: Ano escolar inválido. Ex: 2º ano, 3º ano do ensino médio.`);
      }
    }

    if (!isLettersOnly(s.escolaProfessor)) {
      add(tabIndex, "escolaProfessor", `${alunoLabel(tabIndex)}: Professor deve conter apenas letras.`);
    }

    for (let idx = 0; idx < s.responsaveisLegais.slice(0, 2).length; idx += 1) {
      const r = s.responsaveisLegais[idx];
      const respCpf = digitsOnly(r.cpf);
      const respRg = digitsOnly(r.rg);
      const respAge = ageYearsFromIsoDate(r.dataNascimento);
      if (respAge !== null && respAge < 18) {
        add(tabIndex, `resp-${idx}-nasc`, `${alunoLabel(tabIndex)}: Data de nascimento do responsável deve ser maior que 17 anos.`);
      }
      if (cpf && respCpf && respCpf === cpf) {
        add(tabIndex, `resp-${idx}-cpf`, `${alunoLabel(tabIndex)}: CPF do responsável não pode ser o CPF do aluno.`);
      }
      if (rg && respRg && respRg === rg) {
        add(tabIndex, `resp-${idx}-rg`, `${alunoLabel(tabIndex)}: RG do responsável não pode ser o RG do aluno.`);
      }
      if (respCpf) {
        const other = cpfOwner.get(respCpf);
        if (other !== undefined) {
          add(tabIndex, `resp-${idx}-cpf`, `${alunoLabel(tabIndex)}: CPF do responsável não pode ser CPF de aluno (igual ao Aluno ${other + 1}).`);
        }
      }
      if (respRg) {
        const other = rgOwner.get(respRg);
        if (other !== undefined) {
          add(tabIndex, `resp-${idx}-rg`, `${alunoLabel(tabIndex)}: RG do responsável não pode ser RG de aluno (igual ao Aluno ${other + 1}).`);
        }
      }
    }

    for (let idx = 0; idx < s.pessoasAutorizadas.length; idx += 1) {
      const p = s.pessoasAutorizadas[idx];
      const doc = digitsOnly(p.documento);
      if (cpf && doc && doc === cpf) {
        add(tabIndex, `pessoa-${idx}-doc`, `${alunoLabel(tabIndex)}: CPF de pessoa autorizada não pode ser o CPF do aluno.`);
      }
      if (doc) {
        const other = cpfOwner.get(doc);
        if (other !== undefined) {
          add(tabIndex, `pessoa-${idx}-doc`, `${alunoLabel(tabIndex)}: CPF de pessoa autorizada não pode ser CPF de aluno (igual ao Aluno ${other + 1}).`);
        }
      }
    }
  }

  return errors;
}

const sections = [
  { value: 'dados-pessoais', label: 'Dados Pessoais', icon: User },
  { value: 'responsaveis', label: 'Responsáveis e Família', icon: Users },
  { value: 'saude-escolaridade', label: 'Saúde e Escolaridade', icon: HeartPulse },
  { value: 'convivencia', label: 'Convivência Social', icon: HandHelping },
  { value: 'termos', label: 'Termos e Autorizações', icon: FileCheck },
];

function normalize(value?: string) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function simNao(value?: boolean) {
  return value ? "sim" : "nao";
}

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudent, addStudent, updateStudent } = useStudents();
  const isEditing = Boolean(id);

  const [tabs, setTabs] = useState<FormData[]>([{ ...emptyStudent }]);
  const [activeTab, setActiveTab] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showRemoveTab, setShowRemoveTab] = useState(false);
  const [removeTabIndex, setRemoveTabIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [showCopy, setShowCopy] = useState(false);
  const [copyMode, setCopyMode] = useState<"all" | "selected">("all");
  const [copySelected, setCopySelected] = useState<boolean[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepLookupMessage, setCepLookupMessage] = useState("");
  const [lastCepLookupByTab, setLastCepLookupByTab] = useState<Record<number, string>>({});

  const form = tabs[activeTab] ?? tabs[0] ?? { ...emptyStudent };

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

  const focusField = useCallback((tabIndex: number, fieldId?: string) => {
    setActiveTab(tabIndex);
    if (!fieldId) return;
    window.setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.focus();
      }
    }, 0);
  }, []);

  const updateTabFields = useCallback((tabIndex: number, fields: Partial<FormData>) => {
    setTabs((prev) => prev.map((tab, index) => (index === tabIndex ? { ...tab, ...fields } : tab)));
  }, []);

  const lookupCep = useCallback(
    async (tabIndex: number, rawCep: string, force = false) => {
      const cep = digitsOnly(rawCep);
      if (cep.length !== 8) {
        if (tabIndex === activeTab) {
          setCepLookupMessage("");
        }
        return;
      }

      if (!force && lastCepLookupByTab[tabIndex] === cep) {
        return;
      }

      setIsCepLoading(true);
      if (tabIndex === activeTab) {
        setCepLookupMessage("Consultando CEP...");
      }

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error("Nao foi possivel consultar o CEP.");
        }

        const data = (await response.json()) as ViaCepResponse;
        if (data.erro) {
          throw new Error("CEP nao encontrado.");
        }

        updateTabFields(tabIndex, {
          enderecoCep: digitsOnly(data.cep || cep).slice(0, 8),
          enderecoLogradouro: data.logradouro || "",
          enderecoBairro: data.bairro || "",
          enderecoCidade: data.localidade || "",
          enderecoUf: (data.uf || "").toUpperCase() as FormData["enderecoUf"],
        });
        setLastCepLookupByTab((prev) => ({ ...prev, [tabIndex]: cep }));

        if (tabIndex === activeTab) {
          setCepLookupMessage("Endereco preenchido automaticamente pelo CEP.");
        }
      } catch (error) {
        if (tabIndex === activeTab) {
          const message = error instanceof Error ? error.message : "Nao foi possivel consultar o CEP.";
          setCepLookupMessage(message);
        }
      } finally {
        setIsCepLoading(false);
      }
    },
    [activeTab, lastCepLookupByTab, updateTabFields],
  );

  useEffect(() => {
    setCepLookupMessage("");
  }, [activeTab]);

  useEffect(() => {
    const cep = digitsOnly(form.enderecoCep);
    if (cep.length !== 8) {
      return;
    }
    void lookupCep(activeTab, cep);
  }, [activeTab, form.enderecoCep, lookupCep]);

  const handleChange = (field: string, value: any) => {
    if (field === "enderecoCep") {
      const cep = digitsOnly(String(value));
      setCepLookupMessage("");
      setLastCepLookupByTab((prev) => {
        if (!(activeTab in prev)) return prev;
        if (prev[activeTab] === cep) return prev;
        const next = { ...prev };
        delete next[activeTab];
        return next;
      });
    }

    setTabs(prev => {
      const next = prev.map((tab, i) =>
        i === activeTab ? { ...tab, [field]: value } : tab
      );
      if (showValidation) {
        const items = (isEditing ? [{ tabIndex: 0, data: next[0] }] : next.map((t, i) => ({ tabIndex: i, data: t })));
        const errs = validateForms(items);
        setValidationErrors(errs);
        if (errs.length === 0) setShowValidation(false);
      }
      return next;
    });
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

  const requestRemoveTab = (index: number) => {
    if (tabs.length <= 1) return;
    setRemoveTabIndex(index);
    setShowRemoveTab(true);
  };

  const confirmRemoveTab = () => {
    if (removeTabIndex === null) return;
    removeTab(removeTabIndex);
    setShowRemoveTab(false);
    setRemoveTabIndex(null);
  };

  const downloadZip = async (student: any) => {
    const payload = mapToWordPayload(student);

    const res = await fetchBackend(`/documents/emitir_todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/zip",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(friendlyDocumentError(res.status));
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Documentos_${student.nomeCompleto || "Aluno"}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const items = (isEditing ? [{ tabIndex: 0, data: tabs[0] }] : tabs.map((t, i) => ({ tabIndex: i, data: t })));
    const errs = validateForms(items);
    if (errs.length > 0) {
      setShowValidation(true);
      setValidationErrors(errs);
      focusField(errs[0].tabIndex, errs[0].fieldId);
      return;
    }
    try {
      if (isEditing && id) {
        setIsSubmitting(true);
        const updated = await updateStudent(id, tabs[0]);
        await downloadZip(updated);
        toast.success('Aluno atualizado com sucesso!');
        navigate('/students');
      } else if (tabs.length > 1) {
        setSelected(tabs.map(() => true));
        setShowConfirm(true);
      } else {
        setIsSubmitting(true);
        const created = await addStudent(tabs[0]);
        await downloadZip(created);
        toast.success('Aluno cadastrado com sucesso!');
        navigate('/students');
      }
    } catch (e) {
      toastError(e, 'Falha ao salvar aluno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (isSubmitting) return;
    const toRegister = tabs.filter((_, i) => selected[i]);
    if (toRegister.length === 0) {
      toast.error('Selecione ao menos um aluno.', { id: 'validation:select-aluno' });
      return;
    }
    const items = tabs
      .map((t, i) => ({ tabIndex: i, data: t }))
      .filter((_, i) => selected[i]);
    const errs = validateForms(items);
    if (errs.length > 0) {
      setShowConfirm(false);
      setShowValidation(true);
      setValidationErrors(errs);
      focusField(errs[0].tabIndex, errs[0].fieldId);
      return;
    }
    setIsSubmitting(true);
    try {
      for (const form of toRegister) {
        const created = await addStudent(form);
        await downloadZip(created);
      }
      toast.success(toRegister.length > 1 ? `${toRegister.length} alunos cadastrados com sucesso!` : 'Aluno cadastrado com sucesso!');
      setShowConfirm(false);
      navigate('/students');
    } catch (e) {
      toastError(e, 'Falha ao cadastrar alunos.');
    } finally {
      setIsSubmitting(false);
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
      toast.error("Selecione ao menos um aluno para colar.", { id: "validation:copy-select" });
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
          locomocao: source.locomocao,
          locomocaoAcompanhante: source.locomocaoAcompanhante,
          origemEncaminhamento: source.origemEncaminhamento,
          responsaveisLegais: source.responsaveisLegais.map(r => ({ ...r })),
          membrosFamiliares: source.membrosFamiliares.map(m => ({ ...m })),
          estadoCivilPais: source.estadoCivilPais,
          contatoConjugeNome: source.contatoConjugeNome,
          contatoConjugeTelefone: source.contatoConjugeTelefone,
          contatoConjugeFrequencia: source.contatoConjugeFrequencia,
          tipoDomicilio: source.tipoDomicilio,
          rendaFamiliar: source.rendaFamiliar,
          faixaRenda: source.faixaRenda,
          beneficios: [...source.beneficios],
          beneficioOutros: source.beneficioOutros,
          escolaNome: source.escolaNome,
          escolaSerie: source.escolaSerie,
          escolaAno: source.escolaAno,
          escolaProfessor: source.escolaProfessor,
          escolaPeriodo: source.escolaPeriodo,
          historicoEscolar: source.historicoEscolar,
          evasaoEscolar: source.evasaoEscolar,
          evasaoEscolarMotivo: source.evasaoEscolarMotivo,
          evasaoEscolarTempo: source.evasaoEscolarTempo,
          ubsReferencia: source.ubsReferencia,
          locaisAtendimento: [...source.locaisAtendimento],
          temProblemaSaude: source.temProblemaSaude,
          problemaSaudeDescricao: source.problemaSaudeDescricao,
          temRestricoes: source.temRestricoes,
          restricoesDescricao: source.restricoesDescricao,
          usaMedicamentos: source.usaMedicamentos,
          medicamentosDescricao: source.medicamentosDescricao,
          temAlergias: source.temAlergias,
          alergiasDescricao: source.alergiasDescricao,
          acompanhamentos: source.acompanhamentos,
          temDeficiencia: source.temDeficiencia,
          deficienciaDescricao: source.deficienciaDescricao,
          temBronquite: source.temBronquite,
          temFaltaAr: source.temFaltaAr,
          acompanhamentoOdontologico: source.acompanhamentoOdontologico,
          acompanhamentoOdontologicoLocal: source.acompanhamentoOdontologicoLocal,
          acompanhamentoOdontologicoTempo: source.acompanhamentoOdontologicoTempo,
          tratamentoOftalmologico: source.tratamentoOftalmologico,
          tratamentoOftalmologicoLocal: source.tratamentoOftalmologicoLocal,
          usaOculos: source.usaOculos,
          usaLentes: source.usaLentes,
          restricaoFisica: source.restricaoFisica,
          restricaoFisicaDescricao: source.restricaoFisicaDescricao,
          permaneceSozinhaEmCasa: source.permaneceSozinhaEmCasa,
          temSupervisao: source.temSupervisao,
          supervisaoDescricao: source.supervisaoDescricao,
          frequenciaInteracao: source.frequenciaInteracao,
          interacaoSocial: [...source.interacaoSocial],
          locaisLazer: [...source.locaisLazer],
          atividadesExtras: source.atividadesExtras,
          atividadesExtrasLista: [...source.atividadesExtrasLista],
          cronogramaAtividades: [...source.cronogramaAtividades],
          servicosUtilizados: [...source.servicosUtilizados],
          situacaoPrioritaria: source.situacaoPrioritaria,
          observacoesGerais: source.observacoesGerais,
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

  const activeErrors = useMemo(() => {
    if (!showValidation) return {};
    const out: Record<string, string> = {};
    for (const e of validationErrors) {
      if (e.tabIndex !== activeTab) continue;
      if (!e.fieldId) continue;
      if (out[e.fieldId]) continue;
      out[e.fieldId] = e.message;
    }
    return out;
  }, [activeTab, showValidation, validationErrors]);

  const tabsWithErrors = useMemo(() => {
    if (!showValidation) return new Set<number>();
    const s = new Set<number>();
    for (const e of validationErrors) s.add(e.tabIndex);
    return s;
  }, [showValidation, validationErrors]);

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
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span>{isEditing ? 'Editar Aluno' : 'Cadastrar Alunos'}</span>
                  {isEditing && (
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      form.ativo ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700",
                    )}>
                      {form.ativo ? "Ativo" : "Inativo"}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Atualize os dados do aluno' : 'Cadastre até 7 alunos de uma vez. Preencha todas as seções.'}
                </CardDescription>
              </div>
            </div>

            {showValidation && validationErrors.length > 0 && (
              <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">Corrija os erros abaixo:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {validationErrors.map((err, idx) => (
                    <li key={`${err.tabIndex}:${err.fieldId ?? "-"}:${idx}`}>
                      <button
                        type="button"
                        className="text-left text-destructive underline underline-offset-2 hover:opacity-90"
                        onClick={() => focusField(err.tabIndex, err.fieldId)}
                      >
                        {err.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 mt-4">
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      showValidation && tabsWithErrors.has(i) && activeTab !== i && "ring-2 ring-destructive/40",
                      activeTab === i
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{tab.nomeCompleto ? tab.nomeCompleto.split(' ')[0] : `Aluno ${i + 1}`}</span>
                    {tabs.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); requestRemoveTab(i); }}
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
                      {section.value === 'dados-pessoais' && (
                        <SectionDadosPessoais
                          data={form}
                          onChange={handleChange}
                          errors={activeErrors}
                          onLookupCep={() => void lookupCep(activeTab, form.enderecoCep, true)}
                          isCepLoading={isCepLoading}
                          cepLookupMessage={cepLookupMessage}
                        />
                      )}
                      {section.value === 'responsaveis' && <SectionResponsaveis data={form} onChange={handleChange} errors={activeErrors} />}
                      {section.value === 'saude-escolaridade' && <SectionSaudeEscolaridade data={form} onChange={handleChange} errors={activeErrors} />}
                      {section.value === 'convivencia' && <SectionConvivencia data={form} onChange={handleChange} errors={activeErrors} />}
                      {section.value === 'termos' && <SectionTermos data={form} onChange={handleChange} errors={activeErrors} />}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="flex gap-3 pt-6">
                <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                  {isEditing
                    ? (isSubmitting ? 'Salvando...' : 'Salvar Alterações')
                    : tabs.length > 1
                      ? (isSubmitting ? 'Cadastrando...' : `Cadastrar ${tabs.length} Alunos`)
                      : (isSubmitting ? 'Cadastrando...' : 'Cadastrar Aluno')}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/students')} disabled={isSubmitting}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      <Dialog open={showConfirm} onOpenChange={(open) => {
        if (isSubmitting) return;
        setShowConfirm(open);
      }}>
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
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleConfirmRegister} disabled={isSubmitting}>
              {isSubmitting
                ? 'Cadastrando...'
                : `Cadastrar ${selected.filter(Boolean).length} aluno${selected.filter(Boolean).length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRemoveTab}
        onOpenChange={(open) => {
          setShowRemoveTab(open);
          if (!open) setRemoveTabIndex(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover aluno</DialogTitle>
            <DialogDescription>
              Remover <span className="font-medium text-foreground">{removeTabIndex !== null ? (tabs[removeTabIndex]?.nomeCompleto || `Aluno ${removeTabIndex + 1}`) : ""}</span> da lista?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowRemoveTab(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRemoveTab}>
              Remover
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

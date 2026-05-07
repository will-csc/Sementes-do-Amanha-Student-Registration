import React from "react";
import type { Student, PessoaAutorizada, AutorizacaoSaida } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormField, formatCpf, formatPhoneBR, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";
import { fetchBackend } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";

const parentescoOptions = [
  "Pai",
  "Mãe",
  "Avô",
  "Avó",
  "Tio",
  "Tia",
  "Bisavô",
  "Bisavó",
  "Cunhado(a)",
  "Família Acolhedora",
  "Curador(a)",
  "Primo",
  "Prima",
  "Tutor(a) Legal",
  "Irmão",
  "Irmã",
  "Madrasta",
  "Padrasto",
  "Outro",
].map((v) => ({ value: v, label: v }));

const saidaOptions: { value: AutorizacaoSaida; label: string }[] = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "somente-com-responsavel", label: "Somente com responsável" },
];

type TermoKey = "saida" | "responsabilidade" | "imagem" | "pessoas_autorizadas";

const fallbackTermosTexto: Record<TermoKey, string> = {
  saida: "Termo de saída indisponível no momento.",
  responsabilidade: "Termo de responsabilidade indisponível no momento.",
  imagem: "Termo de imagem indisponível no momento.",
  pessoas_autorizadas: "Termo de pessoas autorizadas indisponível no momento.",
};

export default function SectionTermos({
  data,
  onChange,
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
}) {
  const [termoAberto, setTermoAberto] = React.useState<TermoKey | null>(null);
  const [termosTexto, setTermosTexto] = React.useState<Record<TermoKey, string>>(fallbackTermosTexto);

  React.useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const res = await fetchBackend("/documents/termos", { headers: { accept: "application/json" } });
        if (!res.ok) return;
        const payload = (await res.json()) as Partial<Record<TermoKey, string>>;
        if (!active) return;
        setTermosTexto({
          saida: payload.saida?.trim() || fallbackTermosTexto.saida,
          responsabilidade: payload.responsabilidade?.trim() || fallbackTermosTexto.responsabilidade,
          imagem: payload.imagem?.trim() || fallbackTermosTexto.imagem,
          pessoas_autorizadas: payload.pessoas_autorizadas?.trim() || payload.saida?.trim() || fallbackTermosTexto.pessoas_autorizadas,
        });
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, []);

  const updatePessoa = (index: number, patch: Partial<PessoaAutorizada>) => {
    const next = data.pessoasAutorizadas.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange("pessoasAutorizadas", next);
  };

  const addPessoa = () => {
    onChange("pessoasAutorizadas", [
      ...data.pessoasAutorizadas,
      { nome: "", documento: "", parentesco: "", telefone: "" },
    ]);
  };

  const removePessoa = (index: number) => {
    onChange(
      "pessoasAutorizadas",
      data.pessoasAutorizadas.filter((_, i) => i !== index),
    );
  };

  const termoTitulo =
    termoAberto === "saida"
      ? "Termo de saída"
      : termoAberto === "responsabilidade"
        ? "Termo de responsabilidade"
        : termoAberto === "imagem"
          ? "Termo de imagem"
          : termoAberto === "pessoas_autorizadas"
            ? "Termo de pessoas autorizadas"
          : "";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Termos</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTermoAberto("responsabilidade")}>
              Ver termo de responsabilidade
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setTermoAberto("saida")}>
              Ver termo de saída
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setTermoAberto("imagem")}>
              Ver termo de imagem
            </Button>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <Checkbox checked={data.termoResponsabilidade} onCheckedChange={(v) => onChange("termoResponsabilidade", v === true)} />
          <Label className="cursor-pointer">Aceito o termo de responsabilidade</Label>
        </label>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <Checkbox checked={data.autorizacaoImagem} onCheckedChange={(v) => onChange("autorizacaoImagem", v === true)} />
          <Label className="cursor-pointer">Autorizo uso de imagem</Label>
        </label>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Autorização de saída</h3>
        <div
          className={cn(
            "grid grid-cols-1 gap-2 sm:grid-cols-3",
            errors?.autorizacaoSaida && "rounded-lg ring-2 ring-destructive/30 p-2",
          )}
        >
          {saidaOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 rounded-md border p-2">
              <input
                type="radio"
                name="autorizacaoSaida"
                value={opt.value}
                checked={data.autorizacaoSaida === opt.value}
                onChange={() => onChange("autorizacaoSaida", opt.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors?.autorizacaoSaida && <p className="text-sm text-destructive">{errors.autorizacaoSaida}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Pessoas autorizadas</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTermoAberto("pessoas_autorizadas")}>
              Ver termo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addPessoa}>
              Adicionar pessoa
            </Button>
          </div>
        </div>

        {data.pessoasAutorizadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pessoa autorizada cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {data.pessoasAutorizadas.map((p, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Pessoa {idx + 1}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePessoa(idx)}>
                    Remover
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Nome"
                    id={`pessoa-${idx}-nome`}
                    type="text"
                    value={p.nome}
                    onChange={(v) => updatePessoa(idx, { nome: onlyLettersAndSpaces(v) })}
                    error={errors?.[`pessoa-${idx}-nome`]}
                  />
                  <FormField
                    label="CPF"
                    id={`pessoa-${idx}-doc`}
                    type="text"
                    value={formatCpf(p.documento)}
                    onChange={(v) => updatePessoa(idx, { documento: onlyDigits(v).slice(0, 11) })}
                    inputMode="numeric"
                    maxLength={14}
                    error={errors?.[`pessoa-${idx}-doc`]}
                  />
                  <FormField
                    label="Parentesco"
                    id={`pessoa-${idx}-parent`}
                    type="select"
                    value={p.parentesco}
                    onChange={(v) => updatePessoa(idx, { parentesco: v as PessoaAutorizada["parentesco"] })}
                    placeholder="Selecione"
                    options={parentescoOptions}
                    error={errors?.[`pessoa-${idx}-parent`]}
                  />
                  <FormField
                    label="Telefone"
                    id={`pessoa-${idx}-tel`}
                    type="text"
                    value={formatPhoneBR(p.telefone)}
                    onChange={(v) => updatePessoa(idx, { telefone: onlyDigits(v).slice(0, 11) })}
                    inputMode="numeric"
                    maxLength={15}
                    error={errors?.[`pessoa-${idx}-tel`]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={termoAberto !== null} onOpenChange={(open) => !open && setTermoAberto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{termoTitulo}</DialogTitle>
            <DialogDescription>Leia o resumo abaixo antes de confirmar as autorizações.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-foreground">
            {termoAberto ? termosTexto[termoAberto] : ""}
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" onClick={() => setTermoAberto(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

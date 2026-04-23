import React from "react";
import type { Student, PessoaAutorizada, AutorizacaoSaida } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField, formatCpf, formatPhoneBR, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";
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
];

export default function SectionTermos({
  data,
  onChange,
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
}) {
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

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Termos</h3>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <Checkbox checked={data.termoResponsabilidade} onCheckedChange={(v) => onChange("termoResponsabilidade", v ? "sim" : "nao")} />
          <Label className="cursor-pointer">Aceito o termo de responsabilidade</Label>
        </label>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <Checkbox checked={data.autorizacaoImagem} onCheckedChange={(v) => onChange("autorizacaoImagem", v ? "sim" : "nao")} />
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
          <Button type="button" variant="outline" size="sm" onClick={addPessoa}>
            Adicionar pessoa
          </Button>
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
    </div>
  );
}

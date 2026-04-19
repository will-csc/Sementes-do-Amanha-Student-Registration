import React from "react";
import type { Student, ResponsavelLegal, MembroFamiliar } from "@/types/student";
import { FormField, formatBRL, formatCpf, formatPhoneBR, formatRg, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

const estadoCivilOptions = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União Estável",
].map((v) => ({ value: v, label: v }));

const beneficiosOptions = [
  "Bolsa Família",
  "BPC",
  "Auxílio Gás",
  "Tarifa Social",
  "Outros",
];

export default function SectionResponsaveis({
  data,
  onChange,
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
}) {
  const updateResponsavel = (index: number, patch: Partial<ResponsavelLegal>) => {
    const next = data.responsaveisLegais.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange("responsaveisLegais", next);
  };

  const addResponsavel = () => {
    if (data.responsaveisLegais.length >= 2) return;
    onChange("responsaveisLegais", [
      ...data.responsaveisLegais,
      {
        nome: "",
        dataNascimento: "",
        rg: "",
        cpf: "",
        celular: "",
        operadora: "",
        whatsapp: "",
        fixo: "",
        parentesco: "",
      },
    ]);
  };

  const removeResponsavel = (index: number) => {
    if (data.responsaveisLegais.length <= 1) return;
    onChange(
      "responsaveisLegais",
      data.responsaveisLegais.filter((_, i) => i !== index),
    );
  };

  const updateMembro = (index: number, patch: Partial<MembroFamiliar>) => {
    const next = data.membrosFamiliares.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChange("membrosFamiliares", next);
  };

  const addMembro = () => {
    onChange("membrosFamiliares", [
      ...data.membrosFamiliares,
      { nome: "", parentesco: "", profissao: "", renda: "" },
    ]);
  };

  const removeMembro = (index: number) => {
    onChange(
      "membrosFamiliares",
      data.membrosFamiliares.filter((_, i) => i !== index),
    );
  };

  const toggleBeneficio = (label: string) => {
    const has = data.beneficios.includes(label);
    onChange("beneficios", has ? data.beneficios.filter((b) => b !== label) : [...data.beneficios, label]);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Responsáveis legais (até 2)</h3>
          <Button type="button" variant="outline" size="sm" onClick={addResponsavel} disabled={data.responsaveisLegais.length >= 2}>
            Adicionar responsável
          </Button>
        </div>

        <div className="space-y-6">
          {data.responsaveisLegais.map((r, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Responsável {idx + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeResponsavel(idx)} disabled={data.responsaveisLegais.length <= 1}>
                  Remover
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Nome"
                  id={`resp-${idx}-nome`}
                  type="text"
                  value={r.nome}
                  onChange={(v) => updateResponsavel(idx, { nome: onlyLettersAndSpaces(v) })}
                  error={errors?.[`resp-${idx}-nome`]}
                />
                <FormField
                  label="Parentesco"
                  id={`resp-${idx}-parentesco`}
                  type="select"
                  value={r.parentesco}
                  onChange={(v) => updateResponsavel(idx, { parentesco: v as ResponsavelLegal["parentesco"] })}
                  placeholder="Selecione"
                  options={parentescoOptions}
                  error={errors?.[`resp-${idx}-parentesco`]}
                />
                <FormField
                  label="Nascimento"
                  id={`resp-${idx}-nasc`}
                  type="date"
                  value={r.dataNascimento}
                  onChange={(v) => updateResponsavel(idx, { dataNascimento: v })}
                  error={errors?.[`resp-${idx}-nasc`]}
                />
                <FormField
                  label="RG"
                  id={`resp-${idx}-rg`}
                  type="text"
                  value={formatRg(r.rg)}
                  onChange={(v) => updateResponsavel(idx, { rg: onlyDigits(v).slice(0, 9) })}
                  inputMode="numeric"
                  maxLength={12}
                  error={errors?.[`resp-${idx}-rg`]}
                />
                <FormField
                  label="CPF"
                  id={`resp-${idx}-cpf`}
                  type="text"
                  value={formatCpf(r.cpf)}
                  onChange={(v) => updateResponsavel(idx, { cpf: onlyDigits(v).slice(0, 11) })}
                  inputMode="numeric"
                  maxLength={14}
                  error={errors?.[`resp-${idx}-cpf`]}
                />
                <FormField
                  label="Celular"
                  id={`resp-${idx}-cel`}
                  type="text"
                  value={formatPhoneBR(r.celular)}
                  onChange={(v) => updateResponsavel(idx, { celular: onlyDigits(v).slice(0, 11) })}
                  inputMode="numeric"
                  maxLength={15}
                  error={errors?.[`resp-${idx}-cel`]}
                />
                <FormField
                  label="Operadora"
                  id={`resp-${idx}-op`}
                  type="text"
                  value={r.operadora}
                  onChange={(v) => updateResponsavel(idx, { operadora: onlyLettersAndSpaces(v) })}
                  error={errors?.[`resp-${idx}-op`]}
                />
                <FormField
                  label="WhatsApp"
                  id={`resp-${idx}-whats`}
                  type="text"
                  value={formatPhoneBR(r.whatsapp)}
                  onChange={(v) => updateResponsavel(idx, { whatsapp: onlyDigits(v).slice(0, 11) })}
                  inputMode="numeric"
                  maxLength={15}
                  error={errors?.[`resp-${idx}-whats`]}
                />
                <FormField
                  label="Fixo"
                  id={`resp-${idx}-fixo`}
                  type="text"
                  value={formatPhoneBR(r.fixo)}
                  onChange={(v) => updateResponsavel(idx, { fixo: onlyDigits(v).slice(0, 11) })}
                  inputMode="numeric"
                  maxLength={15}
                  error={errors?.[`resp-${idx}-fixo`]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Membros familiares</h3>
          <Button type="button" variant="outline" size="sm" onClick={addMembro}>
            Adicionar membro
          </Button>
        </div>

        {data.membrosFamiliares.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
        ) : (
          <div className="space-y-4">
            {data.membrosFamiliares.map((m, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Membro {idx + 1}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMembro(idx)}>
                    Remover
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Nome"
                    id={`membro-${idx}-nome`}
                    type="text"
                    value={m.nome}
                    onChange={(v) => updateMembro(idx, { nome: v })}
                    error={errors?.[`membro-${idx}-nome`]}
                  />
                  <FormField
                    label="Parentesco"
                    id={`membro-${idx}-parentesco`}
                    type="select"
                    value={m.parentesco}
                    onChange={(v) => updateMembro(idx, { parentesco: v as MembroFamiliar["parentesco"] })}
                    placeholder="Selecione"
                    options={parentescoOptions}
                    error={errors?.[`membro-${idx}-parentesco`]}
                  />
                  <FormField
                    label="Profissão"
                    id={`membro-${idx}-prof`}
                    type="text"
                    value={m.profissao}
                    onChange={(v) => updateMembro(idx, { profissao: v })}
                    error={errors?.[`membro-${idx}-prof`]}
                  />
                  <FormField
                    label="Renda"
                    id={`membro-${idx}-renda`}
                    type="text"
                    value={m.renda}
                    onChange={(v) => updateMembro(idx, { renda: v })}
                    error={errors?.[`membro-${idx}-renda`]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Estado civil dos pais"
          id="estadoCivilPais"
          type="select"
          value={data.estadoCivilPais}
          onChange={(v) => onChange("estadoCivilPais", v as Student["estadoCivilPais"])}
          placeholder="Selecione"
          options={estadoCivilOptions}
          error={errors?.estadoCivilPais}
        />
        <FormField
          label="Tipo de domicílio"
          id="tipoDomicilio"
          type="text"
          value={data.tipoDomicilio}
          onChange={(v) => onChange("tipoDomicilio", v)}
          error={errors?.tipoDomicilio}
        />
        <FormField
          label="Nome do cônjuge (contato)"
          id="contatoConjugeNome"
          type="text"
          value={data.contatoConjugeNome}
          onChange={(v) => onChange("contatoConjugeNome", onlyLettersAndSpaces(v))}
          error={errors?.contatoConjugeNome}
        />
        <FormField
          label="Telefone do cônjuge"
          id="contatoConjugeTelefone"
          type="text"
          value={formatPhoneBR(data.contatoConjugeTelefone)}
          onChange={(v) => onChange("contatoConjugeTelefone", onlyDigits(v).slice(0, 11))}
          inputMode="numeric"
          maxLength={15}
          error={errors?.contatoConjugeTelefone}
        />
        <FormField
          label="Renda familiar"
          id="rendaFamiliar"
          type="text"
          value={formatBRL(data.rendaFamiliar)}
          onChange={(v) => onChange("rendaFamiliar", formatBRL(v))}
          inputMode="numeric"
          className="sm:col-span-2"
          error={errors?.rendaFamiliar}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Benefícios</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {beneficiosOptions.map((b) => (
            <label key={b} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.beneficios.includes(b)} onCheckedChange={() => toggleBeneficio(b)} />
              <Label className="cursor-pointer">{b}</Label>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

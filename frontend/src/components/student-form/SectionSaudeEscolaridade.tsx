import React from "react";
import type { Student } from "@/types/student";
import { FormField, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";

function BinaryRadio({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <RadioGroup
        value={value ? "Sim" : "Não"}
        onValueChange={(v) => onChange(v === "Sim")}
        className="grid grid-cols-2 gap-3"
      >
        <label className="flex items-center gap-2 rounded-md border p-2">
          <input
            type="radio"
            checked={value === true}
            onChange={() => onChange(true)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Sim</span>
        </label>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <input
            type="radio"
            checked={value === false}
            onChange={() => onChange(false)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Não</span>
        </label>
      </RadioGroup>
    </div>
  );
}

export default function SectionSaudeEscolaridade({
  data,
  onChange,
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
}) {
  const normalizeAnoEscolar = (value: string) =>
    value
      .replace(/[^\p{L}0-9\sº°]/gu, "")
      .replace(/\s+/g, " ")
      .trimStart()
      .slice(0, 30);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Escola (nome)"
          id="escolaNome"
          type="text"
          value={data.escolaNome}
          onChange={(v) => onChange("escolaNome", v)}
          error={errors?.escolaNome}
        />
        <FormField
          label="Série"
          id="escolaSerie"
          type="text"
          value={data.escolaSerie}
          onChange={(v) => onChange("escolaSerie", onlyDigits(v))}
          inputMode="numeric"
          error={errors?.escolaSerie}
        />
        <FormField
          label="Ano"
          id="escolaAno"
          type="text"
          value={data.escolaAno}
          onChange={(v) => onChange("escolaAno", normalizeAnoEscolar(v))}
          error={errors?.escolaAno}
        />
        <FormField
          label="Professor(a)"
          id="escolaProfessor"
          type="text"
          value={data.escolaProfessor}
          onChange={(v) => onChange("escolaProfessor", onlyLettersAndSpaces(v))}
          error={errors?.escolaProfessor}
        />
        <FormField
          label="Período"
          id="escolaPeriodo"
          type="select"
          value={data.escolaPeriodo}
          onChange={(v) => onChange("escolaPeriodo", v)}
          placeholder="Selecione"
          options={[
            { value: "manha", label: "Manhã" },
            { value: "tarde", label: "Tarde" },
            { value: "noite", label: "Noite" },
            { value: "integral", label: "Integral" },
          ]}
          error={errors?.escolaPeriodo}
        />
        <FormField
          label="Histórico escolar"
          id="historicoEscolar"
          type="textarea"
          value={data.historicoEscolar}
          onChange={(v) => onChange("historicoEscolar", v)}
          className="sm:col-span-2"
          placeholder="Observações, reprovações, reforço, etc."
          error={errors?.historicoEscolar}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="UBS referência"
          id="ubsReferencia"
          type="text"
          value={data.ubsReferencia}
          onChange={(v) => onChange("ubsReferencia", v)}
          error={errors?.ubsReferencia}
        />
        <FormField
          label="Acompanhamentos"
          id="acompanhamentos"
          type="textarea"
          value={data.acompanhamentos}
          onChange={(v) => onChange("acompanhamentos", v)}
          placeholder="Psicólogo, fono, CAPS, etc."
          error={errors?.acompanhamentos}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BinaryRadio label="Possui problema de saúde?" value={data.temProblemaSaude} onChange={(v) => onChange("temProblemaSaude", v)} />
        {data.temProblemaSaude && (
          <FormField
            label="Descrição do problema de saúde"
            id="problemaSaudeDescricao"
            type="textarea"
            value={data.problemaSaudeDescricao}
            onChange={(v) => onChange("problemaSaudeDescricao", v)}
            error={errors?.problemaSaudeDescricao}
          />
        )}

        <BinaryRadio label="Possui restrições?" value={data.temRestricoes} onChange={(v) => onChange("temRestricoes", v)} />
        {data.temRestricoes && (
          <FormField
            label="Descrição das restrições"
            id="restricoesDescricao"
            type="textarea"
            value={data.restricoesDescricao}
            onChange={(v) => onChange("restricoesDescricao", v)}
            error={errors?.restricoesDescricao}
          />
        )}

        <BinaryRadio label="Usa medicamentos?" value={data.usaMedicamentos} onChange={(v) => onChange("usaMedicamentos", v)} />
        {data.usaMedicamentos && (
          <FormField
            label="Medicamentos (quais?)"
            id="medicamentosDescricao"
            type="textarea"
            value={data.medicamentosDescricao}
            onChange={(v) => onChange("medicamentosDescricao", v)}
            error={errors?.medicamentosDescricao}
          />
        )}

        <BinaryRadio label="Possui alergias?" value={data.temAlergias} onChange={(v) => onChange("temAlergias", v)} />
        {data.temAlergias && (
          <FormField
            label="Alergias (quais?)"
            id="alergiasDescricao"
            type="textarea"
            value={data.alergiasDescricao}
            onChange={(v) => onChange("alergiasDescricao", v)}
            error={errors?.alergiasDescricao}
          />
        )}

        <BinaryRadio label="Possui deficiência?" value={data.temDeficiencia} onChange={(v) => onChange("temDeficiencia", v)} />
        {data.temDeficiencia && (
          <FormField
            label="Descrição da deficiência"
            id="deficienciaDescricao"
            type="textarea"
            value={data.deficienciaDescricao}
            onChange={(v) => onChange("deficienciaDescricao", v)}
            error={errors?.deficienciaDescricao}
          />
        )}
      </div>
    </div>
  );
}

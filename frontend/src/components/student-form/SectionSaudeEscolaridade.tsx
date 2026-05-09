import React from "react";
import type { Student } from "@/types/student";
import { FormField, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";
import { Checkbox } from "@/components/ui/checkbox";
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

  const toggleLocalAtendimento = (value: string) => {
    const current = data.locaisAtendimento;
    const has = current.includes(value);
    onChange("locaisAtendimento", has ? current.filter((item) => item !== value) : [...current, value]);
  };

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

      <div className="space-y-4">
        <BinaryRadio label="Já houve evasão escolar?" value={data.evasaoEscolar} onChange={(v) => onChange("evasaoEscolar", v)} />
        {data.evasaoEscolar && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Motivo da evasão"
              id="evasaoEscolarMotivo"
              type="textarea"
              value={data.evasaoEscolarMotivo}
              onChange={(v) => onChange("evasaoEscolarMotivo", v)}
              error={errors?.evasaoEscolarMotivo}
            />
            <FormField
              label="Tempo afastado"
              id="evasaoEscolarTempo"
              type="text"
              value={data.evasaoEscolarTempo}
              onChange={(v) => onChange("evasaoEscolarTempo", v)}
              placeholder="Ex: 6 meses"
              error={errors?.evasaoEscolarTempo}
            />
          </div>
        )}
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

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Locais de atendimento</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {["CAPS", "Hospital Geral", "SER"].map((item) => (
            <label key={item} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.locaisAtendimento.includes(item)} onCheckedChange={() => toggleLocalAtendimento(item)} />
              <Label className="cursor-pointer">{item}</Label>
            </label>
          ))}
        </div>
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

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Saúde respiratória</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BinaryRadio label="Bronquite" value={data.temBronquite} onChange={(v) => onChange("temBronquite", v)} />
          <BinaryRadio label="Falta de ar" value={data.temFaltaAr} onChange={(v) => onChange("temFaltaAr", v)} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Saúde bucal</h3>
        <BinaryRadio
          label="Faz acompanhamento odontológico?"
          value={data.acompanhamentoOdontologico}
          onChange={(v) => onChange("acompanhamentoOdontologico", v)}
        />
        {data.acompanhamentoOdontologico && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Onde faz acompanhamento"
              id="acompanhamentoOdontologicoLocal"
              type="text"
              value={data.acompanhamentoOdontologicoLocal}
              onChange={(v) => onChange("acompanhamentoOdontologicoLocal", v)}
              error={errors?.acompanhamentoOdontologicoLocal}
            />
            <FormField
              label="Há quanto tempo"
              id="acompanhamentoOdontologicoTempo"
              type="text"
              value={data.acompanhamentoOdontologicoTempo}
              onChange={(v) => onChange("acompanhamentoOdontologicoTempo", v)}
              placeholder="Ex: 1 ano"
              error={errors?.acompanhamentoOdontologicoTempo}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Saúde ocular</h3>
        <BinaryRadio
          label="Faz tratamento oftalmológico?"
          value={data.tratamentoOftalmologico}
          onChange={(v) => onChange("tratamentoOftalmologico", v)}
        />
        {data.tratamentoOftalmologico && (
          <FormField
            label="Onde faz tratamento"
            id="tratamentoOftalmologicoLocal"
            type="text"
            value={data.tratamentoOftalmologicoLocal}
            onChange={(v) => onChange("tratamentoOftalmologicoLocal", v)}
            error={errors?.tratamentoOftalmologicoLocal}
          />
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-md border p-2">
            <Checkbox checked={data.usaOculos} onCheckedChange={(v) => onChange("usaOculos", v === true)} />
            <Label className="cursor-pointer">Usa óculos</Label>
          </label>
          <label className="flex items-center gap-2 rounded-md border p-2">
            <Checkbox checked={data.usaLentes} onCheckedChange={(v) => onChange("usaLentes", v === true)} />
            <Label className="cursor-pointer">Usa lentes</Label>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Restrição física</h3>
        <BinaryRadio
          label="Possui restrição para esportes/atividades físicas?"
          value={data.restricaoFisica}
          onChange={(v) => onChange("restricaoFisica", v)}
        />
        {data.restricaoFisica && (
          <FormField
            label="Qual restrição"
            id="restricaoFisicaDescricao"
            type="textarea"
            value={data.restricaoFisicaDescricao}
            onChange={(v) => onChange("restricaoFisicaDescricao", v)}
            error={errors?.restricaoFisicaDescricao}
          />
        )}
      </div>
    </div>
  );
}

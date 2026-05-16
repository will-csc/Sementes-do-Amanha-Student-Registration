import React from "react";
import type { Student } from "@/types/student";
import { FormField } from "@/components/student-form/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const interacaoOptions = [
  "Interage bem com colegas",
  "Interage bem com adultos",
  "Prefere ficar isolado",
  "Apresenta agressividade",
  "Timidez excessiva",
  "Família", 
  "Amigos", 
  "Parentes"
];

const lazerOptions = [
  "Redes Sociais",
  "Telefone",
  "Festas",
  "Encontros Religiosos",
  "Passeios",
];

const servicosOptions = [
  "CRAS/CREAS",
  "CREAS/Medidas",
  "Conselho Tutelar",
  "Fórum",
  "Fundação Casa",
  "Centro Dia",
  "SAICA",
  "ILPI",
  "Centro POP",
  "SEAS",
  "Delegacia Comum",
  "Delegacia da Mulher",
  "Centro de Referência da Mulher",
  "Pronto Socorro",
  "Sistema Prisional/Egresso",
  "CREAS",
  "UBS",
  "Escola",
  "Outros",
];

const atividadesExtrasOptions = [
  "Cultura",
  "Núcleo Socioeducativo",
  "ONG",
];

const cronogramaOptions = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const frequenciaInteracaoOptions = [
  { value: "Nunca", label: "Nunca" },
  { value: "Raramente", label: "Raramente" },
  { value: "Sempre", label: "Sempre" },
];

export default function SectionConvivencia({
  data,
  onChange,
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
}) {
  const toggleMulti = (field: "interacaoSocial" | "locaisLazer" | "servicosUtilizados", value: string) => {
    const current = data[field];
    const has = current.includes(value);
    onChange(field, has ? current.filter((v) => v !== value) : [...current, value]);
  };

  const toggleStringList = (field: "atividadesExtrasLista" | "cronogramaAtividades", value: string) => {
    const current = data[field];
    const has = current.includes(value);
    onChange(field, has ? current.filter((item) => item !== value) : [...current, value]);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Supervisão</h3>
          <label className="flex items-center gap-2 rounded-md border p-2">
            <Checkbox
              checked={data.permaneceSozinhaEmCasa}
              onCheckedChange={(v) => {
                const checked = v === true;
                onChange("permaneceSozinhaEmCasa", checked);
                onChange("temSupervisao", !checked);
              }}
            />
            <Label className="cursor-pointer">Permanece sozinha em casa?</Label>
          </label>
          <FormField
            label="Quem supervisiona?"
            id="supervisaoDescricao"
            type="textarea"
            value={data.supervisaoDescricao}
            onChange={(v) => onChange("supervisaoDescricao", v)}
            placeholder="Informe quem acompanha e como ocorre a supervisão"
            error={errors?.supervisaoDescricao}
          />
        </div>

        <div className="space-y-4">
          <FormField
            label="Frequência de interação"
            id="frequenciaInteracao"
            type="select"
            value={data.frequenciaInteracao}
            onChange={(v) => onChange("frequenciaInteracao", v)}
            placeholder="Selecione"
            options={frequenciaInteracaoOptions}
            error={errors?.frequenciaInteracao}
          />
          <FormField
            label="Observações das atividades"
            id="atividadesExtras"
            type="textarea"
            value={data.atividadesExtras}
            onChange={(v) => onChange("atividadesExtras", v)}
            placeholder="Detalhes complementares"
            error={errors?.atividadesExtras}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Interação social</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {interacaoOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.interacaoSocial.includes(opt)} onCheckedChange={() => toggleMulti("interacaoSocial", opt)} />
              <Label className="cursor-pointer">{opt}</Label>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Canais de lazer/social</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lazerOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.locaisLazer.includes(opt)} onCheckedChange={() => toggleMulti("locaisLazer", opt)} />
              <Label className="cursor-pointer">{opt}</Label>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Atividades extras</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {atividadesExtrasOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.atividadesExtrasLista.includes(opt)} onCheckedChange={() => toggleStringList("atividadesExtrasLista", opt)} />
              <Label className="cursor-pointer">{opt}</Label>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Cronograma das atividades</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {cronogramaOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.cronogramaAtividades.includes(opt)} onCheckedChange={() => toggleStringList("cronogramaAtividades", opt)} />
              <Label className="cursor-pointer">{opt}</Label>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rede de atendimento</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("servicosUtilizados", [])}
            disabled={data.servicosUtilizados.length === 0}
          >
            Limpar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {servicosOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={data.servicosUtilizados.includes(opt)} onCheckedChange={() => toggleMulti("servicosUtilizados", opt)} />
              <Label className="cursor-pointer">{opt}</Label>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Proteção e finalização</h3>
        <label className="flex items-center gap-2 rounded-md border p-2">
          <Checkbox checked={data.situacaoPrioritaria} onCheckedChange={(v) => onChange("situacaoPrioritaria", v === true)} />
          <Label className="cursor-pointer">Situação prioritária</Label>
        </label>
        <FormField
          label="Observações gerais"
          id="observacoesGerais"
          type="textarea"
          value={data.observacoesGerais}
          onChange={(v) => onChange("observacoesGerais", v)}
          placeholder="Parecer do técnico"
          error={errors?.observacoesGerais}
        />
      </div>
    </div>
  );
}

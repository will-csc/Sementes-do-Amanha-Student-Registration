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
];

const lazerOptions = [
  "Parque",
  "Praça",
  "Quadra",
  "Igreja",
  "Casa de parentes",
  "Outros",
];

const servicosOptions = [
  "CRAS",
  "CREAS",
  "Conselho Tutelar",
  "UBS",
  "Escola",
  "Outros",
];

export default function SectionConvivencia({
  data,
  onChange,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
}) {
  const toggleMulti = (field: "interacaoSocial" | "locaisLazer" | "servicosUtilizados", value: string) => {
    const current = data[field];
    const has = current.includes(value);
    onChange(field, has ? current.filter((v) => v !== value) : [...current, value]);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Supervisão</h3>
          <label className="flex items-center gap-2 rounded-md border p-2">
            <Checkbox checked={data.temSupervisao} onCheckedChange={(v) => onChange("temSupervisao", v)} />
            <Label className="cursor-pointer">Precisa de supervisão?</Label>
          </label>
          {data.temSupervisao && (
            <FormField
              label="Descrição"
              id="supervisaoDescricao"
              type="textarea"
              value={data.supervisaoDescricao}
              onChange={(v) => onChange("supervisaoDescricao", v)}
              placeholder="Quando/por quê"
            />
          )}
        </div>

        <FormField
          label="Atividades extras"
          id="atividadesExtras"
          type="textarea"
          value={data.atividadesExtras}
          onChange={(v) => onChange("atividadesExtras", v)}
          placeholder="Esportes, cursos, etc."
        />
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
        <h3 className="text-sm font-semibold">Locais de lazer</h3>
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Serviços utilizados</h3>
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
    </div>
  );
}


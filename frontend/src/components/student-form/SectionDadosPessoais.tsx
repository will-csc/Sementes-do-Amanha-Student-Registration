import React from "react";
import type { Student } from "@/types/student";
import { FormField, formatCep, formatCpf, formatNis, formatRg, formatUf, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";

const racaCorOptions = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indígena",
  "Não Declarado",
].map((v) => ({ value: v, label: v }));

const sexoOptions = [
  "Masculino",
  "Feminino",
  "Outro",
].map((v) => ({ value: v, label: v }));

export default function SectionDadosPessoais({
  data,
  onChange,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nome completo"
          id="nomeCompleto"
          type="text"
          value={data.nomeCompleto}
          onChange={(v) => onChange("nomeCompleto", onlyLettersAndSpaces(v))}
          placeholder="Nome do aluno"
          className="sm:col-span-2"
        />
        <FormField
          label="Data de nascimento"
          id="dataNascimento"
          type="date"
          value={data.dataNascimento}
          onChange={(v) => onChange("dataNascimento", v)}
        />
        <FormField
          label="Idade"
          id="idade"
          type="number"
          value={data.idade ?? ""}
          onChange={(v) => onChange("idade", v ? Number(v) : null)}
          placeholder="Ex: 12"
        />
        <FormField
          label="Naturalidade"
          id="naturalidade"
          type="text"
          value={data.naturalidade}
          onChange={(v) => onChange("naturalidade", v)}
          placeholder="Cidade/UF"
        />
        <FormField
          label="Raça/Cor"
          id="racaCor"
          type="select"
          value={data.racaCor}
          onChange={(v) => onChange("racaCor", v)}
          placeholder="Selecione"
          options={racaCorOptions}
        />
        <FormField
          label="Sexo"
          id="sexo"
          type="select"
          value={data.sexo}
          onChange={(v) => onChange("sexo", v)}
          placeholder="Selecione"
          options={sexoOptions}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="RG"
          id="rg"
          type="text"
          value={formatRg(data.rg)}
          onChange={(v) => onChange("rg", onlyDigits(v).slice(0, 9))}
          inputMode="numeric"
          maxLength={12}
        />
        <FormField
          label="CPF"
          id="cpf"
          type="text"
          value={formatCpf(data.cpf)}
          onChange={(v) => onChange("cpf", onlyDigits(v).slice(0, 11))}
          inputMode="numeric"
          maxLength={14}
        />
        <FormField
          label="NIS"
          id="nis"
          type="text"
          value={formatNis(data.nis)}
          onChange={(v) => onChange("nis", onlyDigits(v).slice(0, 11))}
          inputMode="numeric"
          maxLength={14}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="Certidão (Termo)"
          id="certidaoTermo"
          type="text"
          value={data.certidaoTermo}
          onChange={(v) => onChange("certidaoTermo", onlyDigits(v))}
          inputMode="numeric"
        />
        <FormField
          label="Certidão (Folha)"
          id="certidaoFolha"
          type="text"
          value={data.certidaoFolha}
          onChange={(v) => onChange("certidaoFolha", onlyDigits(v))}
          inputMode="numeric"
        />
        <FormField
          label="Certidão (Livro)"
          id="certidaoLivro"
          type="text"
          value={data.certidaoLivro}
          onChange={(v) => onChange("certidaoLivro", onlyDigits(v))}
          inputMode="numeric"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="CEP"
          id="enderecoCep"
          type="text"
          value={formatCep(data.enderecoCep)}
          onChange={(v) => onChange("enderecoCep", onlyDigits(v).slice(0, 8))}
          inputMode="numeric"
          maxLength={9}
        />
        <FormField
          label="Logradouro"
          id="enderecoLogradouro"
          type="text"
          value={data.enderecoLogradouro}
          onChange={(v) => onChange("enderecoLogradouro", v)}
          className="sm:col-span-2"
        />
        <FormField
          label="Número"
          id="enderecoNumero"
          type="text"
          value={data.enderecoNumero}
          onChange={(v) => onChange("enderecoNumero", onlyDigits(v))}
          inputMode="numeric"
        />
        <FormField
          label="Complemento"
          id="enderecoComplemento"
          type="text"
          value={data.enderecoComplemento}
          onChange={(v) => onChange("enderecoComplemento", v)}
        />
        <FormField
          label="Bairro"
          id="enderecoBairro"
          type="text"
          value={data.enderecoBairro}
          onChange={(v) => onChange("enderecoBairro", v)}
        />
        <FormField
          label="Cidade"
          id="enderecoCidade"
          type="text"
          value={data.enderecoCidade}
          onChange={(v) => onChange("enderecoCidade", v)}
        />
        <FormField
          label="UF"
          id="enderecoUf"
          type="text"
          value={formatUf(data.enderecoUf)}
          onChange={(v) => onChange("enderecoUf", formatUf(v))}
          maxLength={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nome do pai"
          id="nomePai"
          type="text"
          value={data.nomePai}
          onChange={(v) => onChange("nomePai", onlyLettersAndSpaces(v))}
        />
        <FormField
          label="Nome da mãe"
          id="nomeMae"
          type="text"
          value={data.nomeMae}
          onChange={(v) => onChange("nomeMae", onlyLettersAndSpaces(v))}
        />
        <FormField
          label="CRAS referência"
          id="crasReferencia"
          type="text"
          value={data.crasReferencia}
          onChange={(v) => onChange("crasReferencia", onlyLettersAndSpaces(v))}
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}

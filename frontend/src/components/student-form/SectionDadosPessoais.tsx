import React from "react";
import type { Student } from "@/types/student";
import { FormField, formatCep, formatCpf, formatNis, formatRg, formatUf, onlyAsciiLettersAndDigitsUpper, onlyDigits, onlyLettersAndSpaces } from "@/components/student-form/FormField";

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
  errors,
}: {
  data: Omit<Student, "id">;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string | undefined>;
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
          error={errors?.nomeCompleto}
        />
        <FormField
          label="Data de nascimento"
          id="dataNascimento"
          type="date"
          value={data.dataNascimento}
          onChange={(v) => onChange("dataNascimento", v)}
          error={errors?.dataNascimento}
        />
        <FormField
          label="Idade"
          id="idade"
          type="number"
          value={data.idade ?? ""}
          onChange={(v) => onChange("idade", v ? Number(v) : null)}
          placeholder="Ex: 12"
          error={errors?.idade}
        />
        <FormField
          label="Naturalidade"
          id="naturalidade"
          type="text"
          value={data.naturalidade}
          onChange={(v) => onChange("naturalidade", v)}
          placeholder="Cidade/UF"
          error={errors?.naturalidade}
        />
        <FormField
          label="Raça/Cor"
          id="racaCor"
          type="select"
          value={data.racaCor}
          onChange={(v) => onChange("racaCor", v)}
          placeholder="Selecione"
          options={racaCorOptions}
          error={errors?.racaCor}
        />
        <FormField
          label="Sexo"
          id="sexo"
          type="select"
          value={data.sexo}
          onChange={(v) => onChange("sexo", v)}
          placeholder="Selecione"
          options={sexoOptions}
          error={errors?.sexo}
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
          error={errors?.rg}
        />
        <FormField
          label="CPF"
          id="cpf"
          type="text"
          value={formatCpf(data.cpf)}
          onChange={(v) => onChange("cpf", onlyDigits(v).slice(0, 11))}
          inputMode="numeric"
          maxLength={14}
          error={errors?.cpf}
        />
        <FormField
          label="NIS"
          id="nis"
          type="text"
          value={formatNis(data.nis)}
          onChange={(v) => onChange("nis", onlyDigits(v).slice(0, 11))}
          inputMode="numeric"
          maxLength={14}
          error={errors?.nis}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="Certidão (Termo)"
          id="certidaoTermo"
          type="text"
          value={data.certidaoTermo}
          onChange={(v) => onChange("certidaoTermo", onlyDigits(v).slice(0, 7))}
          inputMode="numeric"
          maxLength={7}
          error={errors?.certidaoTermo}
        />
        <FormField
          label="Certidão (Folha)"
          id="certidaoFolha"
          type="text"
          value={data.certidaoFolha}
          onChange={(v) => onChange("certidaoFolha", onlyDigits(v).slice(0, 3))}
          inputMode="numeric"
          maxLength={3}
          error={errors?.certidaoFolha}
        />
        <FormField
          label="Certidão (Livro)"
          id="certidaoLivro"
          type="text"
          value={data.certidaoLivro}
          onChange={(v) => onChange("certidaoLivro", onlyAsciiLettersAndDigitsUpper(v).slice(0, 5))}
          inputMode="text"
          maxLength={5}
          error={errors?.certidaoLivro}
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
          error={errors?.enderecoCep}
        />
        <FormField
          label="Logradouro"
          id="enderecoLogradouro"
          type="text"
          value={data.enderecoLogradouro}
          onChange={(v) => onChange("enderecoLogradouro", v)}
          className="sm:col-span-2"
          error={errors?.enderecoLogradouro}
        />
        <FormField
          label="Número"
          id="enderecoNumero"
          type="text"
          value={data.enderecoNumero}
          onChange={(v) => onChange("enderecoNumero", onlyDigits(v))}
          inputMode="numeric"
          error={errors?.enderecoNumero}
        />
        <FormField
          label="Complemento"
          id="enderecoComplemento"
          type="text"
          value={data.enderecoComplemento}
          onChange={(v) => onChange("enderecoComplemento", v)}
          error={errors?.enderecoComplemento}
        />
        <FormField
          label="Bairro"
          id="enderecoBairro"
          type="text"
          value={data.enderecoBairro}
          onChange={(v) => onChange("enderecoBairro", v)}
          error={errors?.enderecoBairro}
        />
        <FormField
          label="Cidade"
          id="enderecoCidade"
          type="text"
          value={data.enderecoCidade}
          onChange={(v) => onChange("enderecoCidade", v)}
          error={errors?.enderecoCidade}
        />
        <FormField
          label="UF"
          id="enderecoUf"
          type="text"
          value={formatUf(data.enderecoUf)}
          onChange={(v) => onChange("enderecoUf", formatUf(v))}
          maxLength={2}
          error={errors?.enderecoUf}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nome do pai"
          id="nomePai"
          type="text"
          value={data.nomePai}
          onChange={(v) => onChange("nomePai", onlyLettersAndSpaces(v))}
          error={errors?.nomePai}
        />
        <FormField
          label="Nome da mãe"
          id="nomeMae"
          type="text"
          value={data.nomeMae}
          onChange={(v) => onChange("nomeMae", onlyLettersAndSpaces(v))}
          error={errors?.nomeMae}
        />
        <FormField
          label="CRAS referência"
          id="crasReferencia"
          type="text"
          value={data.crasReferencia}
          onChange={(v) => onChange("crasReferencia", v.slice(0, 75))}
          maxLength={75}
          className="sm:col-span-2"
          error={errors?.crasReferencia}
        />
      </div>
    </div>
  );
}

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FieldType = "text" | "date" | "number" | "select" | "textarea";

export function onlyLettersAndSpaces(value: string) {
  const cleaned = value.replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trimStart();
  return cleaned;
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function onlyAsciiLettersAndDigitsUpper(value: string) {
  return value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function formatBRL(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  const cents = BigInt(digits);
  const intPart = cents / 100n;
  const fracPart = cents % 100n;
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fracStr = fracPart.toString().padStart(2, "0");
  return `R$ ${intStr},${fracStr}`;
}

export function formatUf(value: string) {
  return value.replace(/[^\p{L}]/gu, "").slice(0, 2).toUpperCase();
}

export function formatCep(digits: string) {
  const d = onlyDigits(digits).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCpf(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatRg(digits: string) {
  const d = onlyDigits(digits).slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
}

export function formatNis(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 8) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`;
}

export function formatPhoneBR(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function FormField({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  options,
  className,
  inputMode,
  maxLength,
  error,
}: {
  label: string;
  id: string;
  type: FieldType;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  error?: string;
}) {
  const commonLabel = (
    <Label htmlFor={id} className="text-sm">
      {label}
    </Label>
  );

  if (type === "textarea") {
    return (
      <div className={cn("space-y-2", className)}>
        {commonLabel}
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-destructive focus-visible:ring-destructive")}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className={cn("space-y-2", className)}>
        {commonLabel}
        <Select
          id={id}
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
          className={cn(error && "border-destructive focus-visible:ring-destructive")}
        >
          <option value="">{placeholder ?? "Selecione"}</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {commonLabel}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

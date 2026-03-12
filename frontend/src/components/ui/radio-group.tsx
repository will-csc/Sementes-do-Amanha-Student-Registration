import * as React from "react";
import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  name: string;
  value: string | undefined;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export function RadioGroup({
  value,
  onValueChange,
  disabled,
  className,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const name = React.useId();
  return (
    <RadioGroupContext.Provider value={{ name, value, onValueChange, disabled }}>
      <div className={cn("grid gap-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  value,
  id,
  className,
}: {
  value: string;
  id?: string;
  className?: string;
}) {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioGroupItem deve ser usado dentro de <RadioGroup />");

  const inputId = id ?? `${ctx.name}-${value}`;
  const checked = ctx.value === value;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        id={inputId}
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={ctx.disabled}
        onChange={() => ctx.onValueChange?.(value)}
        className="h-4 w-4 accent-primary disabled:cursor-not-allowed"
      />
      <label htmlFor={inputId} className="text-sm">
        {value}
      </label>
    </div>
  );
}

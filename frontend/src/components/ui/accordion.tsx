import * as React from "react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  type: AccordionType;
  openValues: string[];
  toggle: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<string | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components devem ser usados dentro de <Accordion />");
  return ctx;
}

function useAccordionItem() {
  const value = React.useContext(AccordionItemContext);
  if (!value) throw new Error("AccordionTrigger/Content devem ser usados dentro de <AccordionItem />");
  return value;
}

export function Accordion({
  type,
  defaultValue,
  className,
  children,
}: {
  type: AccordionType;
  defaultValue?: string[] | string;
  className?: string;
  children: React.ReactNode;
}) {
  const initial =
    defaultValue == null
      ? []
      : Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue];

  const [openValues, setOpenValues] = React.useState<string[]>(initial);

  const toggle = React.useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        const isOpen = prev.includes(value);
        if (type === "single") return isOpen ? [] : [value];
        return isOpen ? prev.filter((v) => v !== value) : [...prev, value];
      });
    },
    [type],
  );

  return (
    <AccordionContext.Provider value={{ type, openValues, toggle }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn("w-full", className)} data-value={value}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const { openValues, toggle } = useAccordion();
  const value = useAccordionItem();
  const isOpen = openValues.includes(value);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      data-state={isOpen ? "open" : "closed"}
      onClick={() => toggle(value)}
    >
      <div className="flex-1">{children}</div>
      <svg
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

export function AccordionContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { openValues } = useAccordion();
  const value = useAccordionItem();
  const isOpen = openValues.includes(value);
  if (!isOpen) return null;

  return <div className={cn("pb-4 pt-0 text-sm", className)}>{children}</div>;
}

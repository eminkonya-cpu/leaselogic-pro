"use client";

import DecimalTextInput from "@/components/finance/DecimalTextInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MACHINE_MODELS } from "@/components/finance/machineModels";

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  step?: string;
  options?: readonly string[];
};

export default function FinanceFieldGrid(props: {
  machineFields: Field[];
  financeFields: Field[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string | number) => void;
  machineTitle?: string;
  financeTitle?: string;
  comfortable?: boolean;
  /** split: yan yana sütunlar; stack: makine üstte, finansman altta */
  layout?: "split" | "stack";
}) {
  const roomy = props.comfortable;
  const stacked = props.layout === "stack";
  const renderField = (f: Field) => {
    const type = f.type ?? "number";
    const raw = props.values[f.key];
    const value =
      type === "text"
        ? String(raw ?? "")
        : raw === null || raw === undefined
          ? ""
          : String(raw);
    const listId =
      type === "text" && f.options?.length ? `list-${f.key}` : undefined;
    const numericValue =
      type === "number" ? Number(raw ?? 0) : 0;

    return (
      <div key={f.key} className="space-y-0.5">
        <Label
          className={cn(
            "font-semibold text-slate-600",
            roomy ? "text-xs font-medium text-[#434655] md:text-[13px]" : "text-[11px]",
          )}
        >
          {f.label}
        </Label>
        {type === "number" ? (
          <DecimalTextInput
            className={cn(
              roomy ? "h-8 text-[13px] md:text-sm max-lg:h-8 max-lg:text-sm" : "h-8 text-sm max-lg:h-8",
            )}
            placeholder={f.placeholder}
            value={Number.isFinite(numericValue) ? numericValue : 0}
            onValueChange={(next) => props.onChange(f.key, next)}
          />
        ) : (
        <Input
          className={cn(roomy ? "h-8 text-[13px] md:text-sm max-lg:h-8 max-lg:text-sm" : "h-8 text-sm max-lg:h-8")}
          value={value}
          type={type}
          list={listId}
          placeholder={f.placeholder}
          onChange={(e) => {
            props.onChange(f.key, e.target.value);
          }}
        />
        )}
        {listId ? (
          <datalist id={listId}>
            {f.options?.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "finance-field-grid grid grid-cols-1 gap-3 max-lg:gap-2.5",
        !stacked && "sm:grid-cols-2",
      )}
    >
      <div className="space-y-2">
        <p
          className={cn(
            "font-bold text-slate-800",
            roomy ? "text-sm font-semibold text-[#0b1c30] md:text-[15px]" : "text-xs",
          )}
        >
          {props.machineTitle ?? "Makine Bilgileri"}
        </p>
        {props.machineFields.map(renderField)}
      </div>
      <div className="space-y-2">
        <p
          className={cn(
            "font-bold text-slate-800",
            roomy ? "text-sm font-semibold text-[#0b1c30] md:text-[15px]" : "text-xs",
          )}
        >
          {props.financeTitle ?? "Finansman Detayları"}
        </p>
        {props.financeFields.map(renderField)}
      </div>
    </div>
  );
}

export { MACHINE_MODELS };

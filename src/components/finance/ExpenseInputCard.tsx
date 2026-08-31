"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Euro } from "lucide-react";

const fieldsMonthly = [
  { key: "kasko1", label: "1. Yıl Kasko Bedeli (€)" },
  { key: "kasko2", label: "2. Yıl Kasko Bedeli (€)" },
  { key: "kasko3", label: "3. Yıl Kasko Bedeli (€)" },
  { key: "kasko4", label: "4. Yıl Kasko Bedeli (€)" },
  { key: "leasingCost", label: "Leasing Masrafı (€)" },
  { key: "importCost", label: "İthalat Masrafı (€)" },
] as const;

/** Yılda bir ödeme: en fazla 3 yıl → 3 kasko; sıra aylık ile aynı (kaskolar, leasing, ithalat). */
const fieldsAnnual = [
  { key: "kasko1", label: "1. Yıl Kasko Bedeli (€)" },
  { key: "kasko2", label: "2. Yıl Kasko Bedeli (€)" },
  { key: "kasko3", label: "3. Yıl Kasko Bedeli (€)" },
  { key: "leasingCost", label: "Leasing Masrafı (€)" },
  { key: "importCost", label: "İthalat Masrafı (€)" },
] as const;

export const expenseFieldLabels = Object.fromEntries(
  fieldsMonthly.map((f) => [f.key, f.label] as const),
) as Record<(typeof fieldsMonthly)[number]["key"], string>;

export const EMPTY_EXPENSES: Record<
  (typeof fieldsMonthly)[number]["key"],
  number
> = {
  kasko1: 0,
  kasko2: 0,
  kasko3: 0,
  kasko4: 0,
  leasingCost: 0,
  importCost: 0,
};

export default function ExpenseInputCard(props: {
  expenses: Record<string, number>;
  onChange: (key: string, value: number) => void;
  /** Aylık: 4 kasko; yıllık: 3 kasko + aynı sıra. */
  variant?: "monthly" | "annual";
  appearance?: "legacy" | "minimal";
  comfortable?: boolean;
  /** Stitch ek masraflar: daha sıkı grid ve input. */
  compact?: boolean;
  className?: string;
}) {
  const variant = props.variant ?? "monthly";
  const fields = variant === "annual" ? fieldsAnnual : fieldsMonthly;
  const minimal = props.appearance === "minimal";
  const roomy = props.comfortable ?? false;
  const tight = roomy && (props.compact ?? false);

  const fieldList = (
    <div
      className={cn(
        minimal
          ? cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              tight ? "gap-2 max-lg:gap-1.5" : "gap-3 max-lg:gap-2",
            )
          : "space-y-2.5 lg:space-y-3",
      )}
    >
      {fields.map((f) => (
        <div key={f.key} className={cn(tight ? "space-y-0.5" : "space-y-1")}>
          <Label
            className={cn(
              "font-semibold text-slate-600",
              roomy ? "text-sm text-[#434655] md:text-[15px]" : "text-[11px] lg:text-xs",
            )}
          >
            {f.label}
          </Label>
          <Input
            className={cn(
              roomy
                ? tight
                  ? "h-8 text-sm md:text-[15px]"
                  : "h-8 text-[13px] md:text-sm"
                : "h-8",
            )}
            value={String(props.expenses[f.key] ?? 0)}
            type="number"
            inputMode="decimal"
            onChange={(e) =>
              props.onChange(f.key, Number(e.target.value || 0))
            }
          />
        </div>
      ))}
    </div>
  );

  if (minimal) {
    return <div className={props.className}>{fieldList}</div>;
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur",
        props.className,
      )}
    >
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white lg:px-3 lg:pb-3.5 lg:pt-4">
        <CardTitle className="flex w-full items-center justify-start gap-2 text-left text-[13px] font-extrabold tracking-tight text-white lg:flex-col lg:justify-center lg:gap-2 lg:text-center lg:text-[15px]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm lg:h-9 lg:w-9">
            <Euro className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
          </span>
          <span className="max-w-[16rem] leading-snug">Ek Masraflar (Euro)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-2.5 pt-2.5 lg:space-y-3 lg:px-6 lg:pt-4">
        {fieldList}
      </CardContent>
    </Card>
  );
}

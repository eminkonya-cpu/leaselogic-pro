"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function ExpenseInputCard(props: {
  expenses: Record<string, number>;
  onChange: (key: string, value: number) => void;
  /** Aylık: 4 kasko; yıllık: 3 kasko + aynı sıra. */
  variant?: "monthly" | "annual";
}) {
  const variant = props.variant ?? "monthly";
  const fields = variant === "annual" ? fieldsAnnual : fieldsMonthly;
  return (
    <Card className="overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur">
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-3 pb-3.5 pt-4 text-white">
        <CardTitle className="flex w-full flex-col items-center justify-center gap-2 text-center text-[15px] font-extrabold tracking-tight text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm">
            <Euro className="h-[18px] w-[18px]" />
          </span>
          <span className="max-w-[16rem] leading-snug">Ek Masraflar (Euro)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600">{f.label}</Label>
            <Input
              value={String(props.expenses[f.key] ?? 0)}
              type="number"
              inputMode="decimal"
              onChange={(e) =>
                props.onChange(f.key, Number(e.target.value || 0))
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

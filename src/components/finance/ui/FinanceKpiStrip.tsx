"use client";

import SummaryCard from "@/components/finance/ui/SummaryCard";
import { cn } from "@/lib/utils";

export type FinanceKpiItem = {
  label: string;
  value: number;
  hint: string;
  currencySymbol: "€" | "₺" | "$";
  accent?: "default" | "orange" | "blue" | "green" | "purple" | "navy";
  noDecimals?: boolean;
};

export default function FinanceKpiStrip(props: {
  items: FinanceKpiItem[];
  className?: string;
  heroFirst?: boolean;
}) {
  if (props.items.length === 0) return null;

  return (
    <div
      className={cn(
        "finance-kpi-strip grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4",
        props.className,
      )}
    >
      {props.items.map((item, index) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          hint={item.hint}
          currencySymbol={item.currencySymbol}
          accent={item.accent ?? "blue"}
          noDecimals={item.noDecimals}
          hero={Boolean(props.heroFirst && index === 0)}
        />
      ))}
    </div>
  );
}

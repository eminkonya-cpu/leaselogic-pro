"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/components/finance/format";

export default function SummaryCard(props: {
  label: string;
  value: number;
  hint: string;
  currencySymbol: "€" | "₺" | "$";
  accent?: "default" | "orange" | "blue" | "green" | "purple" | "navy";
  noDecimals?: boolean;
  hero?: boolean;
}) {
  const accentBar = {
    default: "border-l-[#c3c6d7]",
    orange: "border-l-[#f59e0b]",
    blue: "border-l-[#2563eb]",
    green: "border-l-[#059669]",
    purple: "border-l-[#6366f1]",
    navy: "border-l-[#0b1c30]",
  }[props.accent ?? "blue"];

  const valueColor = {
    default: "text-[#0b1c30]",
    orange: "text-[#b45309]",
    blue: "text-[#004ac6]",
    green: "text-[#047857]",
    purple: "text-[#4f46e5]",
    navy: "text-[#0b1c30]",
  }[props.accent ?? "blue"];

  return (
    <div
      data-hero={props.hero ? "true" : "false"}
      className={cn(
        "llp-kpi-card rounded-xl border border-[#c3c6d7]/90 bg-white px-3.5 py-3 shadow-sm border-l-[3px] sm:px-4 sm:py-3.5",
        accentBar,
      )}
    >
      <p className="text-[11px] font-semibold text-[#565e74] sm:text-xs">
        {props.label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums tracking-tight sm:mt-1.5 sm:text-xl lg:text-2xl",
          valueColor,
        )}
      >
        {formatNumber(props.value, { noDecimals: props.noDecimals })}
        <span className="ml-0.5 text-sm font-semibold text-[#565e74] sm:text-base">
          {props.currencySymbol}
        </span>
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-[#8b93a7] sm:mt-1 sm:text-[11px]">
        {props.hint}
      </p>
    </div>
  );
}

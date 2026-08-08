"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/components/finance/format";

export default function SummaryCard(props: {
  label: string;
  value: number;
  hint: string;
  currencySymbol: "€" | "₺";
  accent?: "default" | "orange" | "blue" | "green" | "purple";
  noDecimals?: boolean;
}) {
  const accentBar = {
    default: "border-l-slate-300",
    orange: "border-l-orange-500",
    blue: "border-l-blue-600",
    green: "border-l-emerald-500",
    purple: "border-l-violet-500",
  }[props.accent ?? "default"];

  const valueColor =
    props.accent === "orange"
      ? "text-orange-600"
      : "text-slate-900";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm border-l-4",
        accentBar,
      )}
    >
      <p className="text-xs font-semibold text-slate-500">{props.label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          valueColor,
        )}
      >
        {formatNumber(props.value, { noDecimals: props.noDecimals })}
        <span className="ml-1 text-base font-semibold text-slate-500">
          {props.currencySymbol}
        </span>
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{props.hint}</p>
    </div>
  );
}

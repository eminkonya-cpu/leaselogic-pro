"use client";

import { cn } from "@/lib/utils";

export type PaymentFrequency = "monthly" | "annual";

export function PaymentFrequencySelector(props: {
  value: PaymentFrequency;
  onChange: (v: PaymentFrequency) => void;
  variant?: "bar" | "card";
  density?: "default" | "compact";
}) {
  const card = props.variant === "card";
  const compact = props.density === "compact";

  if (card) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#c3c6d7] bg-white shadow-sm",
          compact ? "p-3 max-lg:p-3" : "p-4 max-lg:p-4",
        )}
        role="tablist"
        aria-label="Ödeme sıklığı"
      >
        <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "monthly"}
            onClick={() => props.onChange("monthly")}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg transition-colors shadow-sm",
              compact ? "py-2 max-lg:py-1.5" : "py-3 max-lg:py-2.5",
              props.value === "monthly"
                ? "bg-[#004ac6] text-white"
                : "border border-[#c3c6d7] bg-white text-[#565e74] hover:bg-[#eff4ff]",
            )}
          >
            <span className="text-sm font-semibold max-lg:text-sm">Aylık ödeme</span>
            <span className="text-[11px] font-semibold opacity-80 md:text-xs">
              Aylık taksit planı
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "annual"}
            onClick={() => props.onChange("annual")}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg transition-colors",
              compact ? "py-2 max-lg:py-1.5" : "py-3 max-lg:py-2.5",
              props.value === "annual"
                ? "bg-[#004ac6] text-white shadow-sm"
                : "border border-[#c3c6d7] bg-white text-[#565e74] hover:bg-[#eff4ff]",
            )}
          >
            <span className="text-sm font-semibold max-lg:text-sm">Yılda bir ödeme</span>
            <span className="text-[11px] font-semibold opacity-80 md:text-xs">
              En fazla 3 yıl vade
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-b border-slate-200/80 bg-white"
      role="tablist"
      aria-label="Ödeme sıklığı"
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "monthly"}
            onClick={() => props.onChange("monthly")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-center text-xs font-bold transition-colors sm:text-sm",
              props.value === "monthly"
                ? "bg-[#2563eb] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Aylık ödeme
            <span className="mt-0.5 block text-[10px] font-semibold opacity-80 sm:text-[11px]">
              Aylık taksit planı
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "annual"}
            onClick={() => props.onChange("annual")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-center text-xs font-bold transition-colors sm:text-sm",
              props.value === "annual"
                ? "bg-[#2563eb] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Yılda bir ödeme
            <span className="mt-0.5 block text-[10px] font-semibold opacity-80 sm:text-[11px]">
              En fazla 3 yıl vade
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

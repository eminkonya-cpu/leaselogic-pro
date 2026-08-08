"use client";

import { cn } from "@/lib/utils";

export type PaymentFrequency = "monthly" | "annual";

export function PaymentFrequencySelector(props: {
  value: PaymentFrequency;
  onChange: (v: PaymentFrequency) => void;
  variant?: "bar" | "card";
}) {
  const card = props.variant === "card";

  if (card) {
    return (
      <div
        className="rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm"
        role="tablist"
        aria-label="Ödeme sıklığı"
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "monthly"}
            onClick={() => props.onChange("monthly")}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg py-4 transition-colors shadow-sm",
              props.value === "monthly"
                ? "bg-[#004ac6] text-white"
                : "border border-[#c3c6d7] bg-white text-[#565e74] hover:bg-[#eff4ff]",
            )}
          >
            <span className="text-lg font-semibold">Aylık ödeme</span>
            <span className="text-xs font-semibold opacity-80 md:text-sm">
              Aylık taksit planı
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.value === "annual"}
            onClick={() => props.onChange("annual")}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg py-4 transition-colors",
              props.value === "annual"
                ? "bg-[#004ac6] text-white shadow-sm"
                : "border border-[#c3c6d7] bg-white text-[#565e74] hover:bg-[#eff4ff]",
            )}
          >
            <span className="text-lg font-semibold">Yılda bir ödeme</span>
            <span className="text-xs font-semibold opacity-80 md:text-sm">
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

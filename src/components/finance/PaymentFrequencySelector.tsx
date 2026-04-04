"use client";

import { CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentFrequency = "monthly" | "annual";

export function PaymentFrequencySelector(props: {
  value: PaymentFrequency;
  onChange: (v: PaymentFrequency) => void;
}) {
  return (
    <div
      className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur"
      role="tablist"
      aria-label="Ödeme sıklığı"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-2 px-4 py-2.5 sm:max-w-6xl sm:gap-3 sm:py-4 sm:grid-cols-2">
        <button
          type="button"
          role="tab"
          aria-selected={props.value === "monthly"}
          onClick={() => props.onChange("monthly")}
          className={cn(
            "mx-auto flex w-full max-w-[18rem] items-center justify-center gap-2 rounded-xl border-2 px-2.5 py-2.5 text-left transition-all sm:max-w-none sm:flex-col sm:gap-3 sm:px-4 sm:py-4 sm:text-center",
            props.value === "monthly"
              ? "border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-200/80"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl",
              props.value === "monthly"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <CalendarDays className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 sm:w-full sm:flex-none">
            <div
              className={cn(
                "text-[13px] font-extrabold leading-tight sm:text-sm",
                props.value === "monthly" ? "text-blue-900" : "text-slate-800",
              )}
            >
              Aylık ödeme
            </div>
            <div className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-600 sm:mt-1 sm:text-xs">
              Aylık taksit planı
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={props.value === "annual"}
          onClick={() => props.onChange("annual")}
          className={cn(
            "mx-auto flex w-full max-w-[18rem] items-center justify-center gap-2 rounded-xl border-2 px-2.5 py-2.5 text-left transition-all sm:max-w-none sm:flex-col sm:gap-3 sm:px-4 sm:py-4 sm:text-center",
            props.value === "annual"
              ? "border-amber-500 bg-amber-50/90 shadow-md ring-2 ring-amber-200/80"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl",
              props.value === "annual"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <CalendarRange className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 sm:w-full sm:flex-none">
            <div
              className={cn(
                "text-[13px] font-extrabold leading-tight sm:text-sm",
                props.value === "annual" ? "text-amber-950" : "text-slate-800",
              )}
            >
              Yılda bir ödeme
            </div>
            <div className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-600 sm:mt-1 sm:text-xs">
              Yıllık taksit, en fazla 3 yıl vade
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

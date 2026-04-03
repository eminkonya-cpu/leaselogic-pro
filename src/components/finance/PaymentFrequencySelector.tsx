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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
        <button
          type="button"
          role="tab"
          aria-selected={props.value === "monthly"}
          onClick={() => props.onChange("monthly")}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-4 text-center transition-all",
            props.value === "monthly"
              ? "border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-200/80"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
          )}
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              props.value === "monthly"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <CalendarDays className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <div
              className={cn(
                "text-sm font-extrabold",
                props.value === "monthly" ? "text-blue-900" : "text-slate-800",
              )}
            >
              Aylık ödeme
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-600">
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
            "flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-4 text-center transition-all",
            props.value === "annual"
              ? "border-amber-500 bg-amber-50/90 shadow-md ring-2 ring-amber-200/80"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
          )}
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              props.value === "annual"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <CalendarRange className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <div
              className={cn(
                "text-sm font-extrabold",
                props.value === "annual" ? "text-amber-950" : "text-slate-800",
              )}
            >
              Yılda bir ödeme
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-600">
              Yıllık taksit, en fazla 3 yıl vade
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

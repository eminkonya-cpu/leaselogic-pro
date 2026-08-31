"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export default function SegmentedControl<T extends string>(props: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "default" | "large";
}) {
  const large = props.size === "large";
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1",
        props.className,
      )}
      role="tablist"
    >
      {props.options.map((opt) => {
        const active = props.value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => props.onChange(opt.value)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-center font-bold transition-colors",
              large
                ? "min-h-11 text-base sm:min-w-[8rem]"
                : "min-h-8 text-[11px] sm:min-w-[6.5rem] sm:text-xs",
              active
                ? "bg-[#2563eb] text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

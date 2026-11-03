"use client";

import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

export const CALC_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0369A1] focus-visible:ring-offset-2";

export const CALC_INPUT_CLS =
  "h-9 rounded-md border-[#E2E8F0] bg-white text-[13px] font-medium tabular-nums text-[#020617] shadow-none focus-visible:border-[#0369A1] focus-visible:ring-[#0369A1]/20";

export const CALC_PANEL_CLS =
  "rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:p-4";

export const CALC_CHIP_GROUP_CLS = "flex flex-wrap gap-1.5";

export const CALC_CHIP_BASE_CLS =
  "cursor-pointer rounded-md border text-center font-semibold transition-colors motion-reduce:transition-none";

export function calcChipStateCls(active: boolean) {
  return active
    ? "border-[#0F172A] bg-[#0F172A] text-white shadow-sm"
    : "border-[#94A3B8] bg-[#F1F5F9] text-[#334155] hover:border-[#64748B] hover:bg-white hover:text-[#020617]";
}

export function headerChipStateCls(active: boolean) {
  return active
    ? "border-[#004ac6] bg-[#004ac6] text-white shadow-sm"
    : "border-[#94A3B8] bg-white text-[#334155] hover:border-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0b1c30]";
}

export type ResultKpiItem = {
  label: string;
  value: string;
  sub?: string;
  hero?: boolean;
};

export function ResultKpiBand(props: { items: ResultKpiItem[]; label?: string }) {
  if (props.items.length === 0) return null;
  const cols =
    props.items.length >= 5
      ? "lg:grid-cols-5"
      : props.items.length === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3";

  return (
    <section aria-live="polite" aria-label={props.label ?? "Hesap sonucu"}>
      <dl className={cn("grid grid-cols-2 gap-2", cols)}>
        {props.items.map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              s.hero
                ? "col-span-2 border-[#0F172A] bg-[#0F172A] text-white lg:col-span-1"
                : "border-[#E2E8F0] bg-white",
            )}
          >
            <dt
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.1em]",
                s.hero ? "text-[#7DD3FC]" : "text-[#64748B]",
              )}
            >
              {s.label}
            </dt>
            <dd
              className={cn(
                "mt-1 text-[15px] font-semibold tabular-nums tracking-tight md:text-base",
                s.hero ? "text-white" : "text-[#020617]",
              )}
            >
              {s.value}
            </dd>
            {s.sub ? (
              <dd
                className={cn(
                  "mt-0.5 truncate text-[11px]",
                  s.hero ? "text-white/70" : "text-[#64748B]",
                )}
              >
                {s.sub}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FormStep(props: {
  index: number;
  title: string;
  last?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={cn(
        "min-w-0",
        !props.last && "mb-4 border-b border-[#E2E8F0] pb-4",
      )}
    >
      <legend className="mb-3 flex w-full items-center gap-2.5 text-[13px] font-semibold text-[#020617]">
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0F172A] text-xs font-semibold text-white"
        >
          {props.index}
        </span>
        <span className="min-w-0 flex-1">{props.title}</span>
        {props.action ? <span className="shrink-0">{props.action}</span> : null}
      </legend>
      {props.children}
    </fieldset>
  );
}

export function FormField(props: {
  label: string;
  required?: boolean;
  hint?: string;
  suffix?: string;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0 space-y-1.5", props.className)}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-1.5 text-[13px] font-medium text-[#334155]"
      >
        {props.label}
        {props.required ? (
          <span className="text-[#B42318]" aria-hidden>
            *
          </span>
        ) : null}
        {props.hint ? (
          <span className="text-xs font-normal text-[#64748B]">
            ({props.hint})
          </span>
        ) : null}
        {props.suffix ? (
          <span className="ml-auto text-xs font-semibold text-[#64748B]">
            {props.suffix}
          </span>
        ) : null}
      </label>
      {props.children(id)}
    </div>
  );
}

export function PlanToggleGroup(props: {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={props["aria-label"]}
      className={cn(CALC_CHIP_GROUP_CLS, "w-full", props.className)}
    >
      {props.children}
    </div>
  );
}

export function PlanToggleButton(props: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={cn(
        CALC_CHIP_BASE_CLS,
        "inline-flex h-9 flex-1 items-center justify-center px-2.5 text-[13px]",
        CALC_FOCUS_RING,
        calcChipStateCls(props.active),
      )}
    >
      {props.children}
    </button>
  );
}

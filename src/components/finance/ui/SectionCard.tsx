"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function SectionCard(props: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "stitch";
  accentBar?: boolean;
}) {
  const stitch = props.variant === "stitch";

  return (
    <section
      className={cn(
        stitch
          ? "relative overflow-hidden rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm"
          : "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5",
        props.accentBar && "pl-7",
        props.className,
      )}
    >
      {props.accentBar ? (
        <div
          className="absolute bottom-0 left-0 top-0 w-1 bg-[#004ac6]"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          props.title || props.description || props.action
            ? cn("mb-4 flex items-start justify-between gap-3", stitch && "mb-6 border-b border-[#c3c6d7] pb-2")
            : "hidden",
        )}
      >
        <div>
          {props.title ? (
          <h2
            className={cn(
              stitch
                ? "text-[1.375rem] font-semibold text-[#0b1c30]"
                : "text-sm font-bold text-slate-900",
            )}
          >
            {props.title}
            {stitch && props.description ? (
              <span className="ml-2 text-[15px] font-normal text-[#434655] md:text-base">
                {props.description}
              </span>
            ) : null}
          </h2>
          ) : null}
          {!stitch && props.description ? (
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {props.description}
            </p>
          ) : null}
        </div>
        {props.action ? (
          <div className="shrink-0 self-center">{props.action}</div>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

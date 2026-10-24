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
  /** Stitch üst bölüm: daha az padding (makine kartı default kalır). */
  density?: "default" | "compact";
}) {
  const stitch = props.variant === "stitch";
  const compact = stitch && props.density === "compact";

  return (
    <section
      className={cn(
        stitch
          ? cn(
              "llp-section-card relative overflow-hidden rounded-xl border border-[#c3c6d7] bg-white shadow-sm",
              compact ? "p-3 md:p-4 max-lg:p-3" : "p-4 md:p-5 max-lg:p-3.5",
            )
          : "rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4 max-lg:p-3",
        props.accentBar && "pl-6 max-lg:pl-5",
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
            ? cn(
                "mb-3 flex items-start justify-between gap-2",
                stitch &&
                  (compact
                    ? "mb-2 border-b border-[#c3c6d7] pb-1 max-lg:mb-2"
                    : "mb-3 border-b border-[#c3c6d7] pb-1.5 max-lg:mb-2 max-lg:pb-1"),
              )
            : "hidden",
        )}
      >
        <div>
          {props.title ? (
          <h2
            className={cn(
              stitch
                ? "text-base font-semibold text-[#0b1c30] md:text-[17px] max-lg:text-lg"
                : "text-sm font-bold text-slate-900",
            )}
          >
            {props.title}
            {stitch && props.description ? (
              <span className="ml-1.5 text-xs font-normal text-[#434655] md:text-[13px]">
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

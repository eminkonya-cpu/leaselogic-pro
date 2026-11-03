"use client";

import { cn } from "@/lib/utils";
import { FileText, Printer } from "lucide-react";
import type { ReactNode } from "react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0369A1] focus-visible:ring-offset-2";

export function CalcDocumentActions(props: {
  onSummary: () => void;
  onPaymentPlan: () => void;
  summaryDisabled?: boolean;
  planDisabled?: boolean;
  summaryActionAttr?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={props.summaryDisabled}
        data-promo-action={props.summaryActionAttr}
        onClick={props.onSummary}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] font-semibold text-[#020617] transition-colors hover:ring-1 hover:ring-[#0369A1]/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          focusRing,
        )}
      >
        <FileText className="h-4 w-4" aria-hidden />
        Özet rapor
      </button>
      <button
        type="button"
        disabled={props.planDisabled}
        onClick={props.onPaymentPlan}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#0369A1] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#075985] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          focusRing,
        )}
      >
        <Printer className="h-4 w-4" aria-hidden />
        Ödeme planı oluştur
      </button>
    </div>
  );
}

export default function CalcPageHeader(props: {
  kicker: string;
  title: string;
  description?: string;
  extra?: ReactNode;
  onSummary: () => void;
  onPaymentPlan: () => void;
  summaryDisabled?: boolean;
  planDisabled?: boolean;
  summaryActionAttr?: string;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0369A1]">
          {props.kicker}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-[#020617] md:text-xl">
          {props.title}
        </h2>
        {props.description ? (
          <p className="mt-1 max-w-[62ch] text-[13px] leading-snug text-[#475569]">
            {props.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {props.extra}
        <CalcDocumentActions
          onSummary={props.onSummary}
          onPaymentPlan={props.onPaymentPlan}
          summaryDisabled={props.summaryDisabled}
          planDisabled={props.planDisabled}
          summaryActionAttr={props.summaryActionAttr}
        />
      </div>
    </header>
  );
}

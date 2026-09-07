"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  PrintableCalculationSummaryContent,
  type PrintableCalculationSummaryProps,
} from "@/components/finance/PrintableCalculationSummary";
import {
  PrintableReverseSummaryContent,
  type PrintableReverseSummaryProps,
} from "@/components/finance/PrintableReverseSummary";
import {
  PrintablePaymentPlanContent,
  type PrintablePdfProps,
} from "@/components/finance/PrintablePDF";
import { Printer, X } from "lucide-react";

export type FinancePreviewVariant =
  | "payment-plan"
  | "calculation-summary"
  | "reverse-summary";

export function FinanceDocumentPreviewModal(props: {
  open: boolean;
  onClose: () => void;
  variant: FinancePreviewVariant;
  paymentPlan?: PrintablePdfProps;
  calculationSummary?: PrintableCalculationSummaryProps;
  reverseSummary?: PrintableReverseSummaryProps;
}) {
  if (!props.open || typeof document === "undefined") {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="finance-print-portal fixed inset-0 z-[9999] overflow-auto bg-[#5b616a] p-3 sm:p-4">
      <div className="no-print sticky top-3 z-10 mb-3 flex justify-end gap-2 sm:top-4 sm:mb-4">
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-1.5 border-slate-300 bg-white/95 px-3 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" aria-hidden />
          Yazdır
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-1.5 border-slate-300 bg-white/95 px-3 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
          onClick={props.onClose}
        >
          <X className="h-4 w-4" aria-hidden />
          Kapat
        </Button>
      </div>

      <div className="finance-print-portal-sheet mx-auto w-full max-w-[210mm]">
        <div className="min-h-[calc(100vh-6rem)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
          {props.variant === "payment-plan" && props.paymentPlan ? (
            <PrintablePaymentPlanContent
              {...props.paymentPlan}
              className="w-full p-3 sm:p-4 md:p-[10mm]"
            />
          ) : null}
          {props.variant === "calculation-summary" &&
          props.calculationSummary ? (
            <PrintableCalculationSummaryContent
              {...props.calculationSummary}
              className="w-full p-3 sm:p-4 md:p-[10mm]"
            />
          ) : null}
          {props.variant === "reverse-summary" && props.reverseSummary ? (
            <PrintableReverseSummaryContent
              {...props.reverseSummary}
              className="w-full p-3 sm:p-4 md:p-[10mm]"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

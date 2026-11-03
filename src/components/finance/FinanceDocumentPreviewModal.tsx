"use client";

import { createPortal } from "react-dom";
import {
  PrintableCalculationSummaryContent,
  type PrintableCalculationSummaryProps,
} from "@/components/finance/PrintableCalculationSummary";
import {
  PrintableGraceBalloonSummaryContent,
  type PrintableGraceBalloonSummaryProps,
} from "@/components/finance/PrintableGraceBalloonSummary";
import {
  PrintableReverseSummaryContent,
  type PrintableReverseSummaryProps,
} from "@/components/finance/PrintableReverseSummary";
import {
  PrintablePaymentPlanContent,
  type PrintablePdfProps,
} from "@/components/finance/PrintablePDF";
import PreviewDocumentActions from "@/components/finance/PreviewDocumentActions";
import { financePdfFileName } from "@/lib/saveFinanceDocumentPdf";

export type FinancePreviewVariant =
  | "payment-plan"
  | "calculation-summary"
  | "reverse-summary"
  | "grace-balloon-summary";

export function FinanceDocumentPreviewModal(props: {
  open: boolean;
  onClose: () => void;
  variant: FinancePreviewVariant;
  paymentPlan?: PrintablePdfProps;
  calculationSummary?: PrintableCalculationSummaryProps;
  reverseSummary?: PrintableReverseSummaryProps;
  graceBalloonSummary?: PrintableGraceBalloonSummaryProps;
}) {
  if (!props.open || typeof document === "undefined") {
    return null;
  }

  const fileName = financePdfFileName(
    props.paymentPlan?.params.firma ??
      props.calculationSummary?.firma ??
      props.reverseSummary?.firma ??
      props.graceBalloonSummary?.firma,
  );

  return createPortal(
    <div className="finance-print-portal fixed inset-0 z-[9999] overflow-auto bg-[#5b616a] p-3 sm:p-4">
      <PreviewDocumentActions
        fileName={fileName}
        onClose={props.onClose}
        closeActionAttr="modal-close"
      />

      <div className="finance-print-portal-sheet mx-auto w-full max-w-[210mm]">
        <div className="min-h-[calc(100vh-6rem)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] print:min-h-0 print:h-auto print:shadow-none">
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
          {props.variant === "grace-balloon-summary" &&
          props.graceBalloonSummary ? (
            <PrintableGraceBalloonSummaryContent
              {...props.graceBalloonSummary}
              className="w-full p-3 sm:p-4 md:p-[10mm]"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

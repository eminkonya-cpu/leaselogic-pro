"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { formatInterestRate, formatNumber } from "@/components/finance/format";
import PreviewDocumentActions from "@/components/finance/PreviewDocumentActions";
import {
  PaymentScheduleTable,
  type PrintablePdfProps,
} from "@/components/finance/PrintablePDF";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { financePdfFileName } from "@/lib/saveFinanceDocumentPdf";
import type { PrintableReverseSummaryProps } from "@/components/finance/PrintableReverseSummary";

export type PrintableReversePdfProps = {
  summary: PrintableReverseSummaryProps;
  schedule: AmortizationRow[];
  printCurrency: "EUR" | "TRY";
  paymentMode: "monthly" | "annual";
  downPayment: number;
  planInterest: number;
};

function useReversePrintDerived(props: PrintableReversePdfProps) {
  const symbol = props.printCurrency === "TRY" ? "₺" : "€";
  const totalPayment =
    props.schedule.reduce((sum, r) => sum + r.payment, 0) + props.downPayment;
  return {
    schedule: props.schedule,
    symbol,
    downPayment: props.downPayment,
    planInterest: props.planInterest,
    isCampaignMode: false,
    paymentMode: props.paymentMode,
    totalPayment,
  };
}

function fmt(v: number) {
  return formatNumber(v, { decimals: 2 });
}

export function PrintableReversePDFContent(
  props: PrintableReversePdfProps & { className?: string },
) {
  const s = props.summary;
  const table = useReversePrintDerived(props);
  const sym = s.currencySymbol;
  const firma = (s.firma ?? "").trim();
  const makine = (s.makine ?? "").trim();
  const financingSupport = Math.max(0, s.financingSupportDisplay ?? 0);
  const termText = s.termUnit === "year" ? `${s.term} yıl` : `${s.term} ay`;

  return (
    <div
      id="pdf-print-area"
      className={cn("text-[#0b1c30] print:text-[12px]", props.className)}
    >
      <div className="border-b-2 border-[#004ac6] pb-2 print:pb-1.5">
        <h1 className="text-lg font-extrabold tracking-tight print:text-[17px]">
          Geri hesaplama
        </h1>
        <p className="mt-0.5 text-xs text-slate-600 print:text-[10px]">
          Ödeme planı · {s.termUnit === "year" ? "Yıllık" : "Aylık"} ·{" "}
          {new Date().toLocaleDateString("tr-TR")}
        </p>
      </div>

      {firma || makine ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 print:mt-2 print:py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">
            Müşteri
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[10px]">
            {firma ? (
              <>
                <div className="text-slate-600">Firma</div>
                <div className="text-right font-bold">{firma}</div>
              </>
            ) : null}
            {makine ? (
              <>
                <div className="text-slate-600">Makine modeli</div>
                <div className="text-right font-bold">{makine}</div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:mt-2 print:gap-y-0.5 print:text-[10px]">
        <div className="text-slate-600">Peşinat</div>
        <div className="text-right tabular-nums">
          {fmt(s.downPayment)} {sym}
        </div>
        {financingSupport > 0 ? (
          <>
            <div className="text-slate-600">Finansman desteği</div>
            <div className="text-right tabular-nums">
              {fmt(financingSupport)} {sym}
            </div>
          </>
        ) : null}
        <div className="text-slate-600">Yıllık nominal faiz</div>
        <div className="text-right tabular-nums">
          %{formatInterestRate(s.planInterest)}
        </div>
        <div className="text-slate-600">Vade</div>
        <div className="text-right font-bold">{termText}</div>
        <div className="text-slate-600">Para birimi</div>
        <div className="text-right font-bold">{s.currency}</div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2.5 print:mt-2 print:p-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs print:text-[10px]">
          <div className="text-slate-600">Taksit</div>
          <div className="text-right font-bold tabular-nums">
            {fmt(s.installment)} {sym}
          </div>
          <div className="col-span-2 mt-1 border-t border-slate-300 pt-2 font-extrabold print:text-[11px]">
            <div className="flex justify-between gap-3">
              <span>Müşterinin toplam ödemesi</span>
              <span className="tabular-nums">
                {fmt(s.allInTotal)} {sym}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-300 print:mt-2">
        <div className="border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-sm font-extrabold print:py-1 print:text-[11px]">
          Ödeme planı
        </div>
        <PaymentScheduleTable
          {...table}
          compact
          hideCaption
          hideDownPaymentRow
          hideFooter
        />
      </div>

      <div className="mt-3 space-y-0.5 text-[10px] text-slate-600 print:mt-2">
        <p>Tüm tutarlar KDV hariçtir.</p>
        <p>Bu plan bilgilendirme amaçlıdır; leasing şirketi onayı ile değişebilir.</p>
      </div>
    </div>
  );
}

export function PrintableReversePDFPreviewModal(
  props: PrintableReversePdfProps & {
    open: boolean;
    onClose: () => void;
  },
) {
  if (!props.open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="finance-print-portal fixed inset-0 z-[9999] overflow-auto bg-[#5b616a] p-3 sm:p-4">
      <PreviewDocumentActions
        fileName={financePdfFileName(props.summary.firma)}
        onClose={props.onClose}
      />
      <div className="finance-print-portal-sheet mx-auto w-full max-w-[210mm]">
        <div className="min-h-[calc(100vh-6rem)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] print:min-h-0 print:h-auto print:shadow-none">
          <PrintableReversePDFContent
            {...props}
            className="w-full p-3 sm:p-4 md:p-[10mm]"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function PrintableReversePDF(props: PrintableReversePdfProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <PrintableReversePDFContent
      {...props}
      className={cn(
        "llp-print-sheet hidden print:bg-white",
        "print:px-3 print:pb-2 print:pt-0",
      )}
    />,
    document.body,
  );
}

/** Ödeme planı PDF prop uyumluluğu (mobil önizleme vb.) */
export function reverseToPrintablePdfProps(args: {
  params: {
    firma?: string;
    makine?: string;
    term: number;
    euroInterest: number;
    euroRate: number;
    downPaymentEuro: number;
  };
  scheduleEuro: AmortizationRow[];
  scheduleTl: AmortizationRow[];
  monthlyEuro: number;
  monthlyTl: number;
  paymentMode: "monthly" | "annual";
}): PrintablePdfProps {
  return {
    params: args.params,
    calc: {
      plainScheduleEuro: args.scheduleEuro,
      plainScheduleTL: args.scheduleTl,
      plainMonthlyEuro: args.monthlyEuro,
      plainMonthlyTL: args.monthlyTl,
    },
    mode: "plain",
    paymentMode: args.paymentMode,
  };
}

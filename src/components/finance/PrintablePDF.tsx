"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/components/finance/format";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { cn } from "@/lib/utils";
import { printFinanceDocument } from "@/lib/printFinanceDocument";
import { Printer, X } from "lucide-react";

export type PrintablePdfProps = {
  params: {
    firma?: string;
    makine?: string;
    machinePriceEuro?: number;
    term?: number;
    euroInterest?: number;
    tlInterest?: number;
    euroRate?: number;
    downPaymentEuro?: number;
  };
  calc: {
    plainScheduleEuro?: AmortizationRow[];
    plainScheduleTL?: AmortizationRow[];
    plainMonthlyEuro?: number;
    plainMonthlyTL?: number;
    totalExpenses?: number;
  };
  mode: string;
  expenses?: Record<string, number>;
  printCurrency?: "EUR" | "TRY";
  /** Yıllık modda tablo: aylık satırlar, taksitler yıl sonlarında; özet vade/yıllık taksit metinleri. */
  paymentMode?: "monthly" | "annual";
  /** Tanımlıysa ödeme tablosunda kullanılır (ör. yıllık modda genişletilmiş aylık satırlar). */
  printScheduleEuro?: AmortizationRow[];
  printScheduleTL?: AmortizationRow[];
};

export function PaymentScheduleTable(props: {
  schedule: AmortizationRow[];
  symbol: string;
  downPayment: number;
  planInterest: number;
  isCampaignMode: boolean;
  paymentMode: "monthly" | "annual";
  totalPayment: number;
}) {
  const {
    schedule,
    symbol,
    downPayment,
    planInterest,
    isCampaignMode,
    paymentMode,
    totalPayment,
  } = props;
  return (
    <div className="mt-1 rounded-lg border border-slate-300 bg-white print:break-inside-auto">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:px-2 print:py-1 print:text-[12px]">
        Ödeme Planı ({symbol}){!isCampaignMode
          ? ` — %${formatNumber(planInterest, { decimals: 1 })} Faiz`
          : " — Kampanyali fiyat"}
        {paymentMode === "annual" ? " — Yılda bir taksit" : ""}
      </div>
      <div className="px-0 py-0 print:break-inside-auto">
        <table className="w-full text-xs print:text-[10px]">
          <thead className="bg-slate-100">
            <tr className="border-b font-bold">
              <th className="p-2 text-left print:px-1.5 print:py-1">Ay</th>
              <th className="p-2 text-right print:px-1.5 print:py-1">Taksit</th>
              <th className="p-2 text-right print:px-1.5 print:py-1">Faiz</th>
              <th className="p-2 text-right print:px-1.5 print:py-1">Anapara</th>
              <th className="p-2 text-right print:px-1.5 print:py-1">Kalan</th>
            </tr>
          </thead>
          <tbody>
            {downPayment > 0 && (
              <tr className="border-b">
                <td className="p-2 font-bold print:px-1.5 print:py-1">0</td>
                <td className="p-2 text-right tabular-nums font-bold print:px-1.5 print:py-1">
                  {formatNumber(downPayment)} {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  0 {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  0 {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">-</td>
              </tr>
            )}
            {schedule.map((r, i) => (
              <tr
                key={`${r.month}-${i}`}
                className="border-b last:border-b-0 print:break-inside-avoid"
              >
                <td className="p-2 print:px-1.5 print:py-1">{r.month}</td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  {formatNumber(r.payment)} {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  {formatNumber(r.interest)} {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  {formatNumber(r.principal)} {symbol}
                </td>
                <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">
                  {formatNumber(r.balance)} {symbol}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-extrabold">
              <td className="p-2 print:px-1.5 print:py-1" colSpan={2}>
                Toplam tutar
              </td>
              <td
                className="p-2 text-right tabular-nums print:px-1.5 print:py-1"
                colSpan={3}
              >
                {formatNumber(totalPayment)} {symbol}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function usePrintablePdfDerived(props: PrintablePdfProps) {
  const isCampaignMode = props.mode === "campaign";
  const scheduleEuro = props.calc.plainScheduleEuro ?? [];
  const scheduleTL = props.calc.plainScheduleTL ?? [];
  const paymentMode = props.paymentMode ?? "monthly";
  const scheduleEuroForPrint = props.printScheduleEuro ?? scheduleEuro;
  const scheduleTLForPrint = props.printScheduleTL ?? scheduleTL;
  const selectedCurrency = props.printCurrency ?? "EUR";
  const schedule =
    selectedCurrency === "EUR" ? scheduleEuroForPrint : scheduleTLForPrint;
  const symbol = selectedCurrency === "EUR" ? "€" : "₺";
  const euroInterest = props.params.euroInterest ?? 0;
  const tlInterest = props.params.tlInterest ?? 0;
  const planInterest = selectedCurrency === "EUR" ? euroInterest : tlInterest;
  const downPayment =
    selectedCurrency === "EUR"
      ? Number(props.params.downPaymentEuro ?? 0)
      : Number(
          (props.params.downPaymentEuro ?? 0) * (props.params.euroRate ?? 0),
        );
  const totalPayment =
    schedule.reduce((sum, r) => sum + r.payment, 0) + downPayment;
  return {
    isCampaignMode,
    schedule,
    symbol,
    planInterest,
    downPayment,
    paymentMode,
    totalPayment,
  };
}

/** Yalnızca ödeme planı tablosu (önizleme / yazdır). */
export function PrintablePaymentPlanContent(
  props: PrintablePdfProps & { className?: string },
) {
  const firma = props.params.firma ?? "-";
  const makine = props.params.makine ?? "-";
  const term = props.params.term ?? 0;
  const derived = usePrintablePdfDerived(props);

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        Ödeme Planı
      </div>
      <Separator className="my-2 print:my-0.5" />
      <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold print:text-[10px]">
        <div className="text-slate-600">Müşteri</div>
        <div className="text-right font-bold">{firma}</div>
        <div className="text-slate-600">Makine</div>
        <div className="text-right font-bold">{makine}</div>
        <div className="text-slate-600">Vade</div>
        <div className="text-right font-bold">
          {derived.paymentMode === "annual" ? `${term} yıl` : `${term} ay`}
        </div>
      </div>
      <PaymentScheduleTable {...derived} />
    </div>
  );
}

export function PrintablePDFPreviewModal(
  props: PrintablePdfProps & {
    open: boolean;
    onClose: () => void;
  },
) {
  if (!props.open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="finance-print-portal fixed inset-0 z-[9999] overflow-auto bg-[#5b616a] p-3 sm:p-4">
      <div className="no-print sticky top-3 z-10 mb-3 flex justify-end gap-2 sm:top-4 sm:mb-4">
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-1.5 border-slate-300 bg-white/95 px-3 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
          onClick={() => printFinanceDocument("preview")}
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
          <PrintablePaymentPlanContent
            {...props}
            className="w-full p-3 sm:p-4 md:p-[10mm]"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function PrintablePDF(props: PrintablePdfProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <PrintablePaymentPlanContent
      {...props}
      className={cn(
        "llp-print-sheet hidden print:bg-white",
        "print:px-3 print:pb-2 print:pt-0",
      )}
    />,
    document.body,
  );
}

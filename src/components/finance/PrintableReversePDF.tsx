"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { formatAmount } from "@/components/finance/format";
import {
  PaymentScheduleTable,
  type PrintablePdfProps,
} from "@/components/finance/PrintablePDF";
import type { AmortizationRow } from "@/lib/financeCalculations";
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

export function PrintableReversePDFContent(
  props: PrintableReversePdfProps & { className?: string },
) {
  const s = props.summary;
  const table = useReversePrintDerived(props);
  const sym = s.currencySymbol;

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        Geri Hesaplama Raporu
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600 print:text-[10px]">
        {s.frequencyLabel} · KDV hariç · Ön bilgilendirme
      </p>
      <Separator className="my-2 print:my-0.5" />
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold print:text-[10px]">
        <div className="text-slate-600">Müşteri</div>
        <div className="text-right font-bold">{s.firma ?? "—"}</div>
        <div className="text-slate-600">Makine</div>
        <div className="text-right font-bold">{s.makine ?? "—"}</div>
        <div className="text-slate-600">Makine fiyatı</div>
        <div className="text-right tabular-nums font-bold">
          {formatAmount(s.allInTotal)} {sym}
        </div>
        <div className="text-slate-600">Net makine bedeli</div>
        <div className="text-right tabular-nums font-extrabold text-[#004ac6]">
          {formatAmount(s.displayNetMachine)} {sym}
        </div>
        <div className="text-slate-600">Peşinat</div>
        <div className="text-right tabular-nums font-bold">
          {formatAmount(s.downPayment)} {sym}
        </div>
        <div className="text-slate-600">Vade</div>
        <div className="text-right font-bold">
          {s.termUnit === "year" ? `${s.term} yıl` : `${s.term} ay`}
        </div>
      </div>

      <PaymentScheduleTable {...table} />

      <div className="mt-4 space-y-1 text-xs font-semibold text-slate-700 print:text-[10px]">
        <div>Bu dokümandaki tüm tutarlar KDV hariçtir.</div>
        <div>Bu plan ön bilgilendirme amaçlıdır, bağlayıcı değildir.</div>
        <div>
          Net makine bedeli, makine fiyatından masraflar, vade farkı ve
          seçilen opsiyonlar düşülerek hesaplanır.
        </div>
      </div>
    </div>
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

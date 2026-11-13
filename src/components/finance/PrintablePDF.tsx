"use client";

import { Fragment } from "react";
import { createPortal } from "react-dom";
import { formatInterestRate, formatNumber } from "@/components/finance/format";
import type { AmortizationRow } from "@/lib/financeCalculations";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import { cn } from "@/lib/utils";
import PreviewDocumentActions from "@/components/finance/PreviewDocumentActions";
import { financePdfFileName } from "@/lib/saveFinanceDocumentPdf";

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
    financingSupportEuro?: number;
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
  tabLabel?: string;
  machinePrice?: number;
  financingSupport?: number;
  installment?: number;
  customerTotal?: number;
  supportCompare?: FinancingSupportCompare | null;
  unsupportedInstallment?: number;
  /** Ataşman / bakım / donanım ve (her şey dahil) masraflar. */
  extraLines?: { label: string; value: number }[];
};

export function PaymentScheduleTable(props: {
  schedule: AmortizationRow[];
  symbol: string;
  downPayment: number;
  planInterest: number;
  isCampaignMode: boolean;
  paymentMode: "monthly" | "annual";
  totalPayment: number;
  compact?: boolean;
  hideCaption?: boolean;
  hideDownPaymentRow?: boolean;
  hideFooter?: boolean;
}) {
  const {
    schedule,
    symbol,
    downPayment,
    planInterest,
    isCampaignMode,
    paymentMode,
    totalPayment,
    compact,
    hideCaption,
    hideDownPaymentRow,
    hideFooter,
  } = props;
  const cell = compact
    ? "px-1.5 py-0.5"
    : "p-2 print:px-1.5 print:py-1";
  const framed = !hideCaption;
  return (
    <div className={cn(
      "print:break-inside-auto",
      framed && "mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white",
    )}>
      {hideCaption ? null : (
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:px-2 print:py-1 print:text-[12px]">
          Ödeme Planı ({symbol}){!isCampaignMode
            ? ` — %${formatInterestRate(planInterest)} Faiz`
            : " — Kampanyali fiyat"}
          {paymentMode === "annual" ? " — Yılda bir taksit" : ""}
        </div>
      )}
      <div className="px-0 py-0 print:break-inside-auto">
        <table className="w-full text-xs print:text-[11px]">
          <thead className={compact ? "bg-slate-50" : "bg-slate-100"}>
            <tr className="border-b font-bold">
              <th className={cn(cell, "text-left")}>Ay</th>
              <th className={cn(cell, "text-right")}>Taksit</th>
              <th className={cn(cell, "text-right")}>Kalan</th>
            </tr>
          </thead>
          <tbody>
            {!hideDownPaymentRow && downPayment > 0 ? (
              <tr className="border-b">
                <td className={cn(cell, "font-bold")}>0</td>
                <td className={cn(cell, "text-right tabular-nums font-bold")}>
                  {formatNumber(downPayment)} {symbol}
                </td>
                <td className={cn(cell, "text-right tabular-nums")}>-</td>
              </tr>
            ) : null}
            {schedule.map((r, i) => (
              <tr
                key={`${r.month}-${i}`}
                className="border-b border-slate-100 last:border-b-0 print:break-inside-avoid"
              >
                <td className={cn(cell, compact && "font-medium")}>{r.month}</td>
                <td className={cn(cell, "text-right tabular-nums")}>
                  {formatNumber(r.payment)}
                  {compact ? null : ` ${symbol}`}
                </td>
                <td className={cn(cell, "text-right tabular-nums")}>
                  {formatNumber(r.balance)}
                  {compact ? null : ` ${symbol}`}
                </td>
              </tr>
            ))}
          </tbody>
          {hideFooter ? null : (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-extrabold">
                <td className={cell} colSpan={2}>
                  Toplam tutar
                </td>
                <td className={cn(cell, "text-right tabular-nums")}>
                  {formatNumber(totalPayment)} {symbol}
                </td>
              </tr>
            </tfoot>
          )}
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

function fmt(v: number) {
  return formatNumber(v, { decimals: 2 });
}

function ForwardPlanTotalsBox(props: {
  symbol: string;
  installment: number;
  customerTotal: number;
  financingSupport: number;
  supportCompare?: FinancingSupportCompare | null;
  unsupportedInstallment?: number;
}) {
  const { symbol } = props;
  const compare = props.supportCompare;
  const showSupportSplit =
    props.financingSupport > 0 && compare != null;
  const showInstallmentSplit =
    showSupportSplit &&
    props.unsupportedInstallment != null &&
    Math.abs(props.unsupportedInstallment - props.installment) > 0.005;

  if (!showSupportSplit || !compare) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs print:text-[10px]">
        <div className="text-slate-600">Taksit</div>
        <div className="text-right font-bold tabular-nums">
          {fmt(props.installment)} {symbol}
        </div>
        <div className="col-span-2 mt-1 border-t border-slate-300 pt-2 font-extrabold print:text-[11px]">
          <div className="flex justify-between gap-3">
            <span>Müşterinin toplam ödemesi</span>
            <span className="tabular-nums">
              {fmt(props.customerTotal)} {symbol}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs print:text-[10px]">
      {showInstallmentSplit ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="text-slate-500">Taksit (desteksiz)</div>
          <div className="text-right tabular-nums text-slate-500 line-through decoration-slate-400">
            {fmt(props.unsupportedInstallment!)} {symbol}
          </div>
          <div className="font-bold text-[#0b1c30]">Taksit (destekli)</div>
          <div className="text-right font-extrabold tabular-nums text-[#004ac6]">
            {fmt(props.installment)} {symbol}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3">
          <div className="text-slate-600">Taksit</div>
          <div className="text-right font-bold tabular-nums">
            {fmt(props.installment)} {symbol}
          </div>
        </div>
      )}
      <div className="space-y-1.5 border-t border-slate-300 pt-2">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Müşterinin toplam ödemesi (desteksiz)</span>
          <span className="tabular-nums text-slate-500 line-through decoration-slate-400">
            {fmt(compare.baselineValue)} {symbol}
          </span>
        </div>
        <div className="flex justify-between gap-3 font-extrabold print:text-[11px]">
          <span>Müşterinin toplam ödemesi (destekli)</span>
          <span className="tabular-nums text-[#004ac6]">
            {fmt(props.customerTotal)} {symbol}
          </span>
        </div>
        <div className="flex justify-between gap-3 rounded-md bg-[#ecfdf5] px-2 py-1.5 font-bold text-emerald-800">
          <span>Destek ile sağlanan fark</span>
          <span className="tabular-nums">
            +{fmt(Math.abs(compare.deltaValue))} {symbol}
          </span>
        </div>
        <p className="text-[10px] font-medium leading-snug text-emerald-800/80">
          Desteksiz tutar, destek olmasaydı ödenecek toplamdır. Destek bu farkı
          düşürür.
        </p>
      </div>
    </div>
  );
}

/** Yalnızca ödeme planı (önizleme / yazdır) — 3 ay ödemesiz belgesi ile aynı düzen. */
export function PrintablePaymentPlanContent(
  props: PrintablePdfProps & { className?: string },
) {
  const firma = (props.params.firma ?? "").trim();
  const makine = (props.params.makine ?? "").trim();
  const term = props.params.term ?? 0;
  const derived = usePrintablePdfDerived(props);
  const { symbol, paymentMode, isCampaignMode, planInterest } = derived;
  const rate = Number(props.params.euroRate ?? 0);
  const isTry = (props.printCurrency ?? "EUR") === "TRY";
  const scale = (euro: number) => (isTry ? euro * rate : euro);
  const machinePrice =
    props.machinePrice ?? scale(Number(props.params.machinePriceEuro ?? 0));
  const financingSupport =
    props.financingSupport ??
    scale(Number(props.params.financingSupportEuro ?? 0));
  const installment =
    props.installment ??
    (isTry
      ? Number(props.calc.plainMonthlyTL ?? 0)
      : Number(props.calc.plainMonthlyEuro ?? 0));
  const customerTotal = props.customerTotal ?? derived.totalPayment;
  const termText = paymentMode === "annual" ? `${term} yıl` : `${term} ay`;

  return (
    <div
      id="pdf-print-area"
      className={cn("text-[#0b1c30] print:text-[12px]", props.className)}
    >
      <div className="border-b-2 border-[#004ac6] pb-2 print:pb-1.5">
        <h1 className="text-lg font-extrabold tracking-tight print:text-[17px]">
          İleri hesaplama
        </h1>
        <p className="mt-0.5 text-xs text-slate-600 print:text-[10px]">
          Ödeme planı
          {props.tabLabel ? ` · ${props.tabLabel}` : ""}
          {" · "}
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
        <div className="text-slate-600">Makine bedeli</div>
        <div className="text-right font-bold tabular-nums">
          {fmt(machinePrice)} {symbol}
        </div>
        {(props.extraLines ?? []).map((line) => (
          <Fragment key={line.label}>
            <div className="text-slate-600">{line.label}</div>
            <div className="text-right tabular-nums">
              {fmt(line.value)} {symbol}
            </div>
          </Fragment>
        ))}
        <div className="text-slate-600">Peşinat</div>
        <div className="text-right tabular-nums">
          {fmt(derived.downPayment)} {symbol}
        </div>
        {financingSupport > 0 ? (
          <>
            <div className="text-slate-600">Finansman desteği</div>
            <div className="text-right tabular-nums">
              {fmt(financingSupport)} {symbol}
            </div>
          </>
        ) : null}
        <div className="text-slate-600">
          {isCampaignMode ? "Faiz" : "Yıllık nominal faiz"}
        </div>
        <div className="text-right tabular-nums">
          {isCampaignMode
            ? "Kampanyalı fiyat (finansman dahil)"
            : `%${formatInterestRate(planInterest)}`}
        </div>
        <div className="text-slate-600">Vade</div>
        <div className="text-right font-bold">{termText}</div>
        <div className="text-slate-600">Para birimi</div>
        <div className="text-right font-bold">
          {props.printCurrency ?? "EUR"}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2.5 print:mt-2 print:p-2">
        <ForwardPlanTotalsBox
          symbol={symbol}
          installment={installment}
          customerTotal={customerTotal}
          financingSupport={financingSupport}
          supportCompare={props.supportCompare}
          unsupportedInstallment={props.unsupportedInstallment}
        />
      </div>

      <div className="mt-3 print:mt-2">
        <div className="overflow-hidden rounded-lg border border-slate-300">
          <div className="border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-sm font-extrabold print:py-1 print:text-[11px]">
            Ödeme planı
          </div>
          <PaymentScheduleTable
            {...derived}
            compact
            hideCaption
            hideDownPaymentRow
            hideFooter
          />
        </div>
      </div>

      <div className="mt-3 space-y-0.5 text-[10px] text-slate-600 print:mt-2">
        <p>Tüm tutarlar KDV hariçtir.</p>
        <p>Bu plan bilgilendirme amaçlıdır; leasing şirketi onayı ile değişebilir.</p>
      </div>
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
      <PreviewDocumentActions
        fileName={financePdfFileName(props.params.firma)}
        onClose={props.onClose}
      />

      <div className="finance-print-portal-sheet mx-auto w-full max-w-[210mm]">
        <div className="min-h-[calc(100vh-6rem)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] print:min-h-0 print:h-auto print:shadow-none">
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

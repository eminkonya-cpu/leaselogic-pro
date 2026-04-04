"use client";

import { createPortal } from "react-dom";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/components/finance/format";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { cn } from "@/lib/utils";
import { expenseFieldLabels } from "./ExpenseInputCard";

export default function PrintablePDF(props: {
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
}) {
  const firma = props.params.firma ?? "-";
  const makine = props.params.makine ?? "-";
  const unitPriceEuro = props.params.machinePriceEuro ?? 0;
  const term = props.params.term ?? 0;
  const euroInterest = props.params.euroInterest ?? 0;
  const tlInterest = props.params.tlInterest ?? 0;
  const scheduleEuro = props.calc.plainScheduleEuro ?? [];
  const scheduleTL = props.calc.plainScheduleTL ?? [];
  const monthlyEuro = props.calc.plainMonthlyEuro ?? 0;
  const monthlyTL = props.calc.plainMonthlyTL ?? 0;
  const paymentMode = props.paymentMode ?? "monthly";
  const scheduleEuroForPrint =
    props.printScheduleEuro ?? scheduleEuro;
  const scheduleTLForPrint =
    props.printScheduleTL ?? scheduleTL;

  const selectedCurrency = props.printCurrency ?? "EUR";
  const schedule =
    selectedCurrency === "EUR" ? scheduleEuroForPrint : scheduleTLForPrint;
  const monthly = selectedCurrency === "EUR" ? monthlyEuro : monthlyTL;
  const symbol = selectedCurrency === "EUR" ? "€" : "₺";
  const planInterest = selectedCurrency === "EUR" ? euroInterest : tlInterest;
  const downPayment =
    selectedCurrency === "EUR"
      ? Number(props.params.downPaymentEuro ?? 0)
      : Number((props.params.downPaymentEuro ?? 0) * (props.params.euroRate ?? 0));

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      id="pdf-print-area"
      className={cn(
        "hidden",
        "pdf-print-root",
        "print:block print:bg-white",
        "print:px-3 print:pb-2 print:pt-0",
      )}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:mt-0 print:text-[14px]">
        Leasing Ödeme Planı
      </div>
      <Separator className="my-2 print:my-0.5" />
      <div className="rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:px-2 print:py-1 print:text-[12px]">
          Özet Bilgiler
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-2 text-sm font-semibold print:gap-x-4 print:gap-y-1 print:px-2 print:py-1.5 print:text-[10px]">
          <div className="text-slate-600">Müşteri</div>
          <div className="text-right font-extrabold">{firma}</div>

          <div className="text-slate-600">Makine Modeli</div>
          <div className="text-right font-extrabold">{makine}</div>

          <div className="text-slate-600">Birim Fiyat (KDV hariç)</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(unitPriceEuro)} €
          </div>

          <div className="text-slate-600">Vade</div>
          <div className="text-right font-extrabold">
            {paymentMode === "annual" ? `${term} yıl` : `${term} ay`}
          </div>

          <div className="text-slate-600">Euro Faiz</div>
          <div className="text-right tabular-nums font-extrabold">
            %{formatNumber(euroInterest, { decimals: 1 })}
          </div>

          <div className="text-slate-600">TL Faiz</div>
          <div className="text-right tabular-nums font-extrabold">
            %{formatNumber(tlInterest, { decimals: 1 })}
          </div>

          <div className="text-slate-600">PDF Para Birimi</div>
          <div className="text-right font-extrabold">
            {selectedCurrency === "EUR" ? "Euro" : "TL"}
          </div>

          <div className="text-slate-600">
            {paymentMode === "annual" ? "Yıllık Taksit" : "Aylık Taksit"} ({symbol})
          </div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(monthly)} {symbol}
          </div>
        </div>

        {props.mode === "allin" && props.expenses ? (
          <div className="border-t border-slate-200 px-3 py-2 print:px-2 print:py-1.5">
            <div className="mb-1 text-xs font-extrabold print:text-[10px]">
              Ek Maliyetler
            </div>
            <div className="space-y-1 text-xs print:space-y-0.5 print:text-[10px]">
              {Object.entries(props.expenses)
                .filter(([, v]) => (v || 0) !== 0)
                .map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <div className="text-slate-600">
                      {(expenseFieldLabels as Record<string, string>)[k] ?? k}
                    </div>
                    <div className="tabular-nums font-bold">{formatNumber(v)} €</div>
                  </div>
                ))}
              <div className="flex items-center justify-between border-t pt-1 font-extrabold">
                <div>Toplam</div>
                <div className="tabular-nums">
                  {formatNumber(props.calc.totalExpenses ?? 0)} €
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-1 rounded-lg border border-slate-300 bg-white print:break-inside-auto">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:px-2 print:py-1 print:text-[12px]">
          Ödeme Planı ({symbol}) — %{formatNumber(planInterest, { decimals: 1 })} Faiz
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
                  <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">0 {symbol}</td>
                  <td className="p-2 text-right tabular-nums print:px-1.5 print:py-1">0 {symbol}</td>
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
          </table>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs font-semibold text-slate-700 print:mt-1.5 print:break-inside-avoid print:space-y-0.5 print:text-[10px]">
        <div>Bu dokümandaki tüm tutarlar KDV hariçtir.</div>
        <div>Bu plan ön bilgilendirme amaçlıdır, bağlayıcı değildir.</div>
        <div>
          Kasko ve masraf bedellerine vade farkı yansıyabileceği için küçük ilave tutarlar
          oluşabilir.
        </div>
      </div>
    </div>,
    document.body
  );
}

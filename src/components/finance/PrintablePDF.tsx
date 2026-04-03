"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div
      id="pdf-print-area"
      className={cn(
        "hidden",
        "pdf-print-root",
        "print:block print:fixed print:inset-0 print:z-[9999] print:bg-white",
        "print:px-5 print:pb-5 print:pt-1",
      )}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[15px]">
        Leasing Ödeme Planı
      </div>
      <Separator className="my-2 print:my-1.5" />
      <div className="grid grid-cols-1 gap-4 print:gap-3">
        <Card className="border-2 border-slate-200 gap-3 py-3 shadow-none print:gap-2 print:py-2">
          <CardHeader className="pb-2 pt-0 print:pb-1.5">
            <CardTitle className="text-sm font-extrabold">Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-semibold">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Müşteri</div>
              <div className="font-extrabold">{firma}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Makine Modeli</div>
              <div className="font-extrabold">{makine}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Birim Fiyat (KDV hariç)</div>
              <div className="tabular-nums font-extrabold">
                {formatNumber(unitPriceEuro)} €
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Vade</div>
              <div className="font-extrabold">
                {paymentMode === "annual" ? `${term} yıl` : `${term} ay`}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Euro Faiz</div>
              <div className="tabular-nums font-extrabold">
                %{formatNumber(euroInterest, { decimals: 1 })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600">TL Faiz</div>
              <div className="tabular-nums font-extrabold">
                %{formatNumber(tlInterest, { decimals: 1 })}
              </div>
            </div>
            <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-extrabold">
              <div className="flex items-center justify-between">
                <div className="text-slate-600">PDF Para Birimi</div>
                <div>{selectedCurrency === "EUR" ? "Euro" : "TL"}</div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-slate-600">
                  {paymentMode === "annual" ? "Yıllık Taksit" : "Aylık Taksit"}{" "}
                  ({symbol})
                </div>
                <div className="tabular-nums">
                  {formatNumber(monthly)} {symbol}
                </div>
              </div>
            </div>
            {props.mode === "allin" && props.expenses && (
              <>
                <Separator className="my-3" />
                <div className="text-xs font-extrabold">Ek Maliyetler</div>
                <div className="space-y-1 text-xs">
                  {Object.entries(props.expenses)
                    .filter(([, v]) => (v || 0) !== 0)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <div className="text-slate-600">
                          {(expenseFieldLabels as Record<string, string>)[k] ?? k}
                        </div>
                        <div className="tabular-nums font-bold">
                          {formatNumber(v)} €
                        </div>
                      </div>
                    ))}
                  <div className="flex items-center justify-between border-t pt-1 font-extrabold">
                    <div>Toplam</div>
                    <div className="tabular-nums">
                      {formatNumber(props.calc.totalExpenses ?? 0)} €
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 gap-3 py-3 shadow-none print:gap-2 print:py-2">
          <CardHeader className="pb-2 pt-0 print:pb-1.5">
            <CardTitle className="text-sm font-extrabold">
              Leasing Ödeme Planı ({symbol}) — %{formatNumber(planInterest, { decimals: 1 })}{" "}
              Faiz
              {paymentMode === "annual" ? " — Yılda bir taksit (aylık satır yapısı)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr className="border-b font-bold">
                    <th className="p-2 text-left">Ay</th>
                    <th className="p-2 text-right">Taksit</th>
                    <th className="p-2 text-right">Faiz</th>
                    <th className="p-2 text-right">Anapara</th>
                    <th className="p-2 text-right">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {downPayment > 0 && (
                    <tr className="border-b">
                      <td className="p-2 font-bold">0</td>
                      <td className="p-2 text-right tabular-nums font-bold">
                        {formatNumber(downPayment)} {symbol}
                      </td>
                      <td className="p-2 text-right tabular-nums">0 {symbol}</td>
                      <td className="p-2 text-right tabular-nums">0 {symbol}</td>
                      <td className="p-2 text-right tabular-nums">-</td>
                    </tr>
                  )}
                  {schedule.map((r, i) => (
                    <tr key={`${r.month}-${i}`} className="border-b last:border-b-0">
                      <td className="p-2">{r.month}</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(r.payment)} {symbol}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(r.interest)} {symbol}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(r.principal)} {symbol}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(r.balance)} {symbol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 space-y-1 text-xs font-semibold text-slate-700 print:mt-3">
        <div>Bu dokümandaki tüm tutarlar KDV hariçtir.</div>
        <div>Bu plan ön bilgilendirme amaçlıdır, bağlayıcı değildir.</div>
        <div>
          Kasko ve masraf bedellerine vade farkı yansıyabileceği için küçük ilave tutarlar
          oluşabilir.
        </div>
      </div>
    </div>
  );
}

"use client";

import type { AmortizationRow } from "@/lib/financeCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { formatNumber } from "./format";

function sumPayments(schedule: AmortizationRow[]) {
  return schedule.reduce((s, r) => s + (Number(r.payment) || 0), 0);
}

export default function CurrencyComparisonReport(props: {
  scheduleEuro: AmortizationRow[];
  scheduleTL: AmortizationRow[];
  projectedRates: { month: number; rate: number }[];
  euroRate: number;
  monthlyGrowthPct: number;
  downPaymentEuro?: number;
  downPaymentTL?: number;
  term?: number;
  /** Yıllık taksit: açıklamalar ve sayım birimleri yıla göre uyarlanır. */
  paymentFrequency?: "monthly" | "annual";
}) {
  const dpEur = Number(props.downPaymentEuro) || 0;
  const dpTl = Number(props.downPaymentTL) || 0;
  const sumTlInst = sumPayments(props.scheduleTL);
  const tlTotal = dpTl + sumTlInst;

  const installmentsEuroToTl = props.scheduleEuro.reduce((s, r, idx) => {
    const rate = props.projectedRates[idx]?.rate ?? props.euroRate;
    return s + r.payment * rate;
  }, 0);
  const euroToTlProjected = dpEur * props.euroRate + installmentsEuroToTl;

  const advantage = tlTotal - euroToTlProjected;
  const pct = tlTotal === 0 ? 0 : (advantage / tlTotal) * 100;
  const euroLooksBetter = advantage > 0;

  const isAnnual = props.paymentFrequency === "annual";
  const term = props.term ?? props.scheduleEuro.length;
  let cheaperEuroMonths = 0;
  const n = Math.min(
    props.scheduleEuro.length,
    props.scheduleTL.length,
    props.projectedRates.length,
  );
  for (let i = 0; i < n; i++) {
    const rate = props.projectedRates[i]?.rate ?? props.euroRate;
    if (props.scheduleEuro[i].payment * rate < props.scheduleTL[i].payment) {
      cheaperEuroMonths += 1;
    }
  }

  const maxBar = Math.max(euroToTlProjected, tlTotal, 1);
  const widthEuroPath = (euroToTlProjected / maxBar) * 100;
  const widthTlPath = (tlTotal / maxBar) * 100;

  const accent = euroLooksBetter
    ? {
        barEuro: "bg-emerald-500",
        barTl: "bg-slate-400",
        border: "border-emerald-300",
        bg: "from-emerald-50 to-white",
      }
    : {
        barEuro: "bg-slate-400",
        barTl: "bg-amber-500",
        border: "border-amber-300",
        bg: "from-amber-50 to-white",
      };

  const cheaperPeriodsLabel = isAnnual ? "yılda" : "ayda";
  const totalPeriodsLabel = isAnnual ? "yıllık taksit döneminin" : "taksit döneminin";
  const euroPathLabel = isAnnual
    ? "Euro Finansman (TL karşılığı)"
    : "Euro Finansman (TL karşılığı)";
  const tlPathLabel = "TL Finansman";

  return (
    <div className="space-y-4">
      <div className="text-[13px] font-semibold text-slate-900 sm:text-sm">
        Finansman Karşılaştırması (Özet)
      </div>

      <Alert
        className={`border shadow-sm ${accent.border} bg-gradient-to-r ${accent.bg}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle className="font-semibold">
          {euroLooksBetter
            ? "Euro finansmanı daha avantajlı"
            : "TL finansmanı daha avantajlı"}
        </AlertTitle>
        <AlertDescription className="space-y-3 text-[13px] leading-relaxed text-slate-700 sm:space-y-4 sm:text-sm">
          <div className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm sm:p-4">
            <p className="text-[12px] leading-relaxed text-slate-700 sm:text-[13px]">
              Aylık <strong>%{formatNumber(props.monthlyGrowthPct, { decimals: 2 })}</strong>{" "}
              kur artışı varsayımıyla yapılan analiz sonucunda,{" "}
              <strong className="text-slate-900">
                {euroLooksBetter ? "Euro finansman" : "TL finansman"}
              </strong>{" "}
              diğer seçeneğe göre yaklaşık{" "}
              <strong className="text-slate-900">
                %{formatNumber(Math.abs(pct), { decimals: 1 })}
              </strong>{" "}
              daha avantajlı görünüyor.
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-slate-900 sm:text-base">
              Yani bu varsayım altında cebinizden yaklaşık{" "}
              <span className={euroLooksBetter ? "text-emerald-700" : "text-amber-700"}>
                {formatNumber(Math.abs(advantage), { decimals: 2 })} ₺
              </span>{" "}
              daha az para çıkıyor.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-[13px] sm:text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {euroPathLabel}
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 sm:text-xl">
                {formatNumber(euroToTlProjected, { decimals: 2 })} ₺
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-[13px] sm:text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tlPathLabel}
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 sm:text-xl">
                {formatNumber(tlTotal, { decimals: 2 })} ₺
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Toplam nakit çıkışı
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>{euroPathLabel}</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {formatNumber(euroToTlProjected, { decimals: 2 })} ₺
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${accent.barEuro}`}
                    style={{ width: `${widthEuroPath}%` }}
                    title={`${formatNumber(euroToTlProjected, { decimals: 2 })} ₺`}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>{tlPathLabel}</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {formatNumber(tlTotal, { decimals: 2 })} ₺
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${accent.barTl}`}
                    style={{ width: `${widthTlPath}%` }}
                    title={`${formatNumber(tlTotal, { decimals: 2 })} ₺`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-md border p-3 text-sm font-semibold ${euroLooksBetter ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}
          >
            {isAnnual ? (
              <>
                Toplam <strong>{term}</strong> {totalPeriodsLabel}{" "}
                <strong>{cheaperEuroMonths}</strong> {cheaperPeriodsLabel} euro tarafı daha
                düşük kalıyor.
              </>
            ) : (
              <>
                Toplam <strong>{term}</strong> {totalPeriodsLabel}{" "}
                <strong>{cheaperEuroMonths}</strong> {cheaperPeriodsLabel} euro tarafı daha
                düşük kalıyor.
              </>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

"use client";

import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/components/finance/format";
import type { ForwardTabId } from "@/lib/forwardDisplayMetrics";
import type { SummaryReportRow } from "@/lib/calculationSummaryReport";
import { cn } from "@/lib/utils";

export type PrintableCalculationSummaryProps = {
  firma?: string;
  makine?: string;
  tabLabel: string;
  activeTab: ForwardTabId;
  machinePriceEuro: number;
  machinePriceLabel: string;
  downPaymentEuro: number;
  term: number;
  termUnit: "month" | "year";
  euroInterest: number;
  tlInterest: number;
  euroRate: number;
  rows: SummaryReportRow[];
  totalEuro: number;
  totalTl: number;
  monthlyInstallmentEuro: number;
  monthlyInstallmentTl: number;
  installmentLabel: string;
  currency: "EUR" | "TRY";
};

export function PrintableCalculationSummaryContent(
  props: PrintableCalculationSummaryProps & { className?: string },
) {
  const isTry = props.currency === "TRY";
  const sym = isTry ? "₺" : "€";
  const rate = props.euroRate;
  const machinePrice = isTry
    ? props.machinePriceEuro * rate
    : props.machinePriceEuro;
  const downPayment = isTry
    ? props.downPaymentEuro * rate
    : props.downPaymentEuro;
  const total = isTry ? props.totalTl : props.totalEuro;
  const monthly = isTry
    ? props.monthlyInstallmentTl
    : props.monthlyInstallmentEuro;
  const planInterest = isTry ? props.tlInterest : props.euroInterest;
  const interestLabel = isTry ? "TL faiz oranı" : "Euro faiz oranı";

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        Hesaplama Özeti (Detaylı)
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600 print:text-[10px]">
        {props.tabLabel} · Yönetim / iç kullanım · KDV hariç
        {isTry ? " · TL leasing (TL faiz)" : ""}
      </p>
      <Separator className="my-2 print:my-0.5" />

      <div className="rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Müşteri
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-2 text-sm font-semibold print:text-[10px]">
          <div className="text-slate-600">Firma</div>
          <div className="text-right font-extrabold">{props.firma ?? "—"}</div>
          <div className="text-slate-600">Makine modeli</div>
          <div className="text-right font-extrabold">{props.makine ?? "—"}</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Finansman bilgileri
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-2 text-sm font-semibold print:text-[10px]">
          <div className="text-slate-600">{props.machinePriceLabel}</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(machinePrice, { noDecimals: true })} {sym}
          </div>
          <div className="text-slate-600">Peşinat</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(downPayment, { noDecimals: true })} {sym}
          </div>
          <div className="text-slate-600">Vade</div>
          <div className="text-right font-extrabold">
            {props.termUnit === "year"
              ? `${props.term} yıl`
              : `${props.term} ay`}
          </div>
          {props.activeTab === "campaign" ? (
            <>
              <div className="text-slate-600">Faiz</div>
              <div className="text-right text-xs font-bold leading-snug text-slate-800">
                Kampanyalı fiyat (finansman dahil)
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-600">{interestLabel}</div>
              <div className="text-right tabular-nums font-extrabold">
                %{formatNumber(planInterest, { decimals: 1 })}
              </div>
              {!isTry ? (
                <>
                  <div className="text-slate-600">TL faiz oranı</div>
                  <div className="text-right tabular-nums font-extrabold">
                    %{formatNumber(props.tlInterest, { decimals: 1 })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-slate-600">Euro faiz oranı</div>
                  <div className="text-right tabular-nums font-extrabold">
                    %{formatNumber(props.euroInterest, { decimals: 1 })}
                  </div>
                </>
              )}
            </>
          )}
          <div className="text-slate-600">Kur (₺ / €)</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(props.euroRate, { decimals: 2 })}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Kalemler (detay)
        </div>
        <div className="divide-y divide-slate-100 px-3 py-1 text-sm print:text-[10px]">
          {props.rows.length === 0 ? (
            <p className="py-2 text-slate-500">Seçili kalem yok.</p>
          ) : (
            props.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2 font-semibold"
              >
                <span className="min-w-0 text-slate-700">{row.label}</span>
                <span className="shrink-0 tabular-nums font-bold text-slate-900">
                  {formatNumber(row.valueEuro, { noDecimals: true })} {sym}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="border-t border-slate-100 px-3 py-2 text-[10px] font-medium text-slate-500">
          {isTry
            ? "Opsiyon ve masraf kalemleri belirtilen kur ile TL cinsinden gösterilir."
            : "Opsiyon ve masraf kalemleri euro cinsinden listelenir."}
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-3 print:break-inside-avoid">
        <div className="flex items-center justify-between gap-3 border-b border-blue-200/80 pb-2">
          <span className="text-sm font-bold text-slate-900">
            {isTry ? "Toplam ödeme (TL)" : "Toplam (EUR)"}
          </span>
          <span className="text-xl font-extrabold tabular-nums text-[#004ac6]">
            {formatNumber(total, { noDecimals: true })} {sym}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-blue-200/60 pt-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            {props.installmentLabel}
          </span>
          <span className="text-base font-extrabold tabular-nums">
            {formatNumber(monthly, { noDecimals: true })} {sym}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-600 print:text-[10px]">
        Bu özet yalnızca detaylı kalem dökümü içindir; ödeme planı ayrı alınır.
        Tutarlar bilgilendirme amaçlıdır.
      </p>
    </div>
  );
}

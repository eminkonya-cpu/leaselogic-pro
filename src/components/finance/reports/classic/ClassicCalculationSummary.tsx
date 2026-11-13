"use client";

import { Separator } from "@/components/ui/separator";
import { formatInterestRate, formatNumber } from "@/components/finance/format";
import type { PrintableCalculationSummaryProps } from "@/components/finance/PrintableCalculationSummary";
import {
  FINANCING_SUPPORT_LABEL,
  isKatkiPayiLabel,
  KATKI_PAYI_NOTE,
  isFinancingSupportLabel,
  sumKalemlerToplam,
} from "@/lib/kalemlerToplam";
import { cn } from "@/lib/utils";

export function ClassicCalculationSummaryContent(
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
  const planInterest = isTry ? props.tlInterest : props.euroInterest;
  const interestLabel = isTry ? "TL faiz oranı" : "Euro faiz oranı";
  const financingSupport = Math.max(0, props.financingSupportDisplay ?? 0);
  const itemRows = props.rows.filter((row) => !isFinancingSupportLabel(row.label));
  const kalemlerToplam = sumKalemlerToplam(itemRows);
  const totalLabel =
    props.primaryTotalLabel ??
    (isTry ? "Toplam ödeme (TL)" : "Toplam (EUR)");

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root llp-report llp-report-dense bg-white", props.className)}
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
                %{formatInterestRate(planInterest)}
              </div>
              {!isTry ? (
                <>
                  <div className="text-slate-600">TL faiz oranı</div>
                  <div className="text-right tabular-nums font-extrabold">
                    %{formatInterestRate(props.tlInterest)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-slate-600">Euro faiz oranı</div>
                  <div className="text-right tabular-nums font-extrabold">
                    %{formatInterestRate(props.euroInterest)}
                  </div>
                </>
              )}
            </>
          )}
          <div className="text-slate-600">Kur (₺ / €)</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(props.euroRate, { decimals: 2 })}
          </div>
          {financingSupport > 0 ? (
            <>
              <div className="text-slate-600">Finansman desteği</div>
              <div className="text-right tabular-nums font-extrabold">
                {formatNumber(financingSupport, { noDecimals: true })} {sym}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Kalemler (detay)
        </div>
        <div className="divide-y divide-slate-100 px-3 py-1 text-sm print:text-[10px]">
          {itemRows.length === 0 ? (
            <p className="py-2 text-slate-500">Seçili kalem yok.</p>
          ) : (
            itemRows.map((row) => (
              <div
                key={row.label}
                className={cn(
                  "flex items-start justify-between gap-4 py-2 font-semibold",
                  isKatkiPayiLabel(row.label) &&
                    "bg-[#fff7ed] px-2 font-extrabold text-[#9a3412] shadow-[inset_3px_0_0_0_#ea580c]",
                )}
              >
                <span
                  className={cn(
                    "min-w-0",
                    isKatkiPayiLabel(row.label) ? "text-[#9a3412]" : "text-slate-700",
                  )}
                >
                  {row.label}
                  {isKatkiPayiLabel(row.label) ? (
                    <span className="ml-1 font-medium text-[#c2410c]/70">
                      {KATKI_PAYI_NOTE}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums font-bold",
                    isKatkiPayiLabel(row.label)
                      ? "text-[#9a3412]"
                      : row.valueEuro < 0
                        ? "text-emerald-800"
                        : "text-slate-900",
                  )}
                >
                  {formatNumber(row.valueEuro, { noDecimals: true })} {sym}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold print:text-[10px]">
          <span>Kalemler toplamı</span>
          <span className="tabular-nums">
            {formatNumber(kalemlerToplam, { noDecimals: true })} {sym}
          </span>
        </div>
        {financingSupport > 0 ? (
          <div className="flex items-center justify-between gap-4 border-t border-dashed border-slate-200 px-3 py-2 text-sm font-semibold text-red-700 print:text-[10px]">
            <span className="min-w-0 leading-snug">
              {FINANCING_SUPPORT_LABEL}{" "}
              <span className="font-medium text-slate-500">
                (kalemler toplamına dahil değil)
              </span>
            </span>
            <span className="shrink-0 tabular-nums font-bold">
              − {formatNumber(financingSupport, { noDecimals: true })} {sym}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-lg border-2 border-[#2563eb]/30 bg-[#eff4ff] p-3 print:mt-1.5 print:p-2 print:break-inside-avoid">
        <div className="space-y-2 text-sm font-semibold print:text-[10px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#434655]">Makine bedeli</span>
            <span className="tabular-nums font-bold">
              {formatNumber(machinePrice, { noDecimals: true })} {sym}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-800">
            <span>+ Kalemler toplamı</span>
            <span className="tabular-nums font-bold">
              {formatNumber(kalemlerToplam, { noDecimals: true })} {sym}
            </span>
          </div>
          {financingSupport > 0 ? (
            <div className="flex items-center justify-between gap-3 text-red-700">
              <span>− {FINANCING_SUPPORT_LABEL}</span>
              <span className="tabular-nums font-bold">
                {formatNumber(financingSupport, { noDecimals: true })} {sym}
              </span>
            </div>
          ) : null}
        </div>
        <div className="my-3 h-px bg-[#c3c6d7]/60" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-900 print:text-[11px]">
            {totalLabel}
          </span>
          <span className="text-xl font-extrabold tabular-nums text-[#004ac6] print:text-[16px]">
            {formatNumber(total, { noDecimals: true })} {sym}
          </span>
        </div>
      </div>

      {props.supportCompare && financingSupport > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4 print:break-inside-avoid">
          <div className="text-sm font-extrabold text-slate-900 print:text-[12px]">
            Finansman desteği — müşteri toplam ödemesi karşılaştırması
          </div>
          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200 text-sm font-semibold print:text-[10px]">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-slate-700">
                {props.supportCompare.baselineLabel}
              </span>
              <span className="tabular-nums font-bold text-slate-800">
                {formatNumber(props.supportCompare.baselineValue, {
                  noDecimals: true,
                })}{" "}
                {sym}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[#eff4ff]/80 px-3 py-2.5">
              <span className="font-bold text-[#0b1c30]">
                Müşteri toplam ödemesi (destekli)
              </span>
              <span className="tabular-nums text-lg font-extrabold text-[#004ac6] print:text-[13px]">
                {formatNumber(total, { noDecimals: true })} {sym}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-emerald-800">
              <span>{props.supportCompare.deltaLabel}</span>
              <span className="tabular-nums font-extrabold">
                {props.supportCompare.deltaValue >= 0 ? "+" : "−"}
                {formatNumber(Math.abs(props.supportCompare.deltaValue), {
                  noDecimals: true,
                })}{" "}
                {sym}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold text-slate-600 print:text-[10px]">
        Bu özet yalnızca detaylı kalem dökümü içindir; ödeme planı ayrı alınır.
        Tutarlar bilgilendirme amaçlıdır.
      </p>
    </div>
  );
}

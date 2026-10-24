"use client";

import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/components/finance/format";
import type { PrintableGraceBalloonSummaryProps } from "@/components/finance/PrintableGraceBalloonSummary";
import { cn } from "@/lib/utils";

const DOCUMENT_TITLE = "3 Ay Ödemesiz & Balon Hesaplama";

export function ClassicGraceBalloonSummaryContent(
  props: PrintableGraceBalloonSummaryProps & { className?: string },
) {
  const sym = props.currencySymbol;
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });
  const support = Math.max(0, props.financingSupport);

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        {DOCUMENT_TITLE} — Özet (Detaylı)
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600 print:text-[10px]">
        {props.direction === "reverse" ? "Geri hesaplama" : "İleri hesaplama"} ·
        Yönetim / iç kullanım · KDV hariç
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
          {props.direction === "reverse" && props.targetCustomerTotal != null ? (
            <>
              <div className="text-slate-600">Hedef müşteri toplam ödemesi</div>
              <div className="text-right tabular-nums font-extrabold">
                {fmt(props.targetCustomerTotal)} {sym}
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-600">Makine bedeli</div>
              <div className="text-right tabular-nums font-extrabold">
                {fmt(props.machinePrice)} {sym}
              </div>
            </>
          )}
          <div className="text-slate-600">Peşinat</div>
          <div className="text-right tabular-nums font-extrabold">
            {fmt(props.downPayment)} {sym}
          </div>
          <div className="text-slate-600">Plan süresi</div>
          <div className="text-right text-xs font-bold leading-snug text-slate-900">
            {props.planTermLabel}
          </div>
          <div className="text-slate-600">Aylık taksit</div>
          <div className="text-right tabular-nums font-extrabold">
            {fmt(props.monthlyInstallment)} {sym}
          </div>
          <div className="text-slate-600">Yıllık nominal faiz</div>
          <div className="text-right tabular-nums font-extrabold">
            %{fmt(props.annualRatePct)}
          </div>
          <div className="text-slate-600">Finansman başlangıcı</div>
          <div className="text-right tabular-nums font-extrabold">
            {props.startDate}
          </div>
          {support > 0 ? (
            <>
              <div className="text-slate-600">Finansman desteği</div>
              <div className="text-right tabular-nums font-extrabold">
                {fmt(support)} {sym}
              </div>
            </>
          ) : null}
          <div className="text-slate-600">Toplam balon</div>
          <div className="text-right tabular-nums font-extrabold">
            {fmt(props.totalBalloon)} {sym}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Kalemler (detay)
        </div>
        <div className="divide-y divide-slate-100 px-3 py-1 text-sm print:text-[10px]">
          {props.detailRows.length === 0 ? (
            <p className="py-2 text-slate-500">Ek kalem yok.</p>
          ) : (
            props.detailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2 font-semibold"
              >
                <span className="min-w-0 text-slate-700">{row.label}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums font-bold",
                    row.value < 0 ? "text-emerald-800" : "text-slate-900",
                  )}
                >
                  {fmt(row.value)} {sym}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-3 print:break-inside-avoid">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-900">
            {props.primaryTotalLabel}
          </span>
          <span className="text-xl font-extrabold tabular-nums text-[#004ac6]">
            {fmt(props.primaryTotal)} {sym}
          </span>
        </div>
      </div>

      {props.supportCompare && support > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4 print:break-inside-avoid">
          <div className="text-sm font-extrabold text-slate-900 print:text-[12px]">
            {props.compareSectionTitle ??
              "Finansman desteği — karşılaştırma"}
          </div>
          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200 text-sm font-semibold print:text-[10px]">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-slate-700">
                {props.supportCompare.baselineLabel}
              </span>
              <span className="tabular-nums font-bold text-slate-800">
                {fmt(props.supportCompare.baselineValue)} {sym}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[#eff4ff]/80 px-3 py-2.5">
              <span className="font-bold text-[#0b1c30]">
                {props.compareSupportedLabel ?? props.primaryTotalLabel}
              </span>
              <span className="tabular-nums text-lg font-extrabold text-[#004ac6] print:text-[13px]">
                {fmt(props.primaryTotal)} {sym}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-emerald-800">
              <span>{props.supportCompare.deltaLabel}</span>
              <span className="tabular-nums font-extrabold">
                {props.supportCompare.deltaValue >= 0 ? "+" : "−"}
                {fmt(Math.abs(props.supportCompare.deltaValue))} {sym}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold text-slate-600 print:text-[10px]">
        Ödeme planı ayrı alınır. Peşinat, taksitler, balonlar ve peşin ek
        maliyetler müşteri toplamına dahildir.
      </p>
    </div>
  );
}

"use client";

import { Separator } from "@/components/ui/separator";
import { formatAmount, formatNumber } from "@/components/finance/format";
import type { PrintableGraceBalloonSummaryProps } from "@/components/finance/PrintableGraceBalloonSummary";
import { sumGraceBalloonDetailRows } from "@/lib/graceBalloonSummaryRows";
import { isKatkiPayiLabel, KATKI_PAYI_NOTE } from "@/lib/kalemlerToplam";
import { cn } from "@/lib/utils";

const DOCUMENT_TITLE = "3 Ay Ödemesiz & Balon Hesaplama";

function Row(props: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-1.5 text-sm font-semibold print:text-[10px]",
        props.bold && "font-extrabold text-[#0b1c30]",
      )}
    >
      <span className={props.bold ? "text-[#0b1c30]" : "text-slate-700"}>
        {props.label}
      </span>
      <span className="shrink-0 tabular-nums">{props.value}</span>
    </div>
  );
}

export function ClassicGraceBalloonSummaryContent(
  props: PrintableGraceBalloonSummaryProps & { className?: string },
) {
  const sym = props.currencySymbol;
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });
  const support = Math.max(0, props.financingSupport);
  const isReverse = props.direction === "reverse";
  const kalemlerToplam = sumGraceBalloonDetailRows(props.detailRows);
  const customerTotal = Math.max(0, props.customerTotalPayment);
  const financeInterest = Math.max(0, props.financeInterest);
  const leasingPrincipal = isReverse ? customerTotal : props.machinePrice;
  const remaining = leasingPrincipal - props.downPayment;
  const totalExcludingVadeFarki = Math.max(0, customerTotal - financeInterest);

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root llp-report llp-report-dense bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        {DOCUMENT_TITLE} — Özet (Detaylı)
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600 print:text-[10px]">
        {isReverse ? "Geri hesaplama" : "İleri hesaplama"} · Yönetim / iç
        kullanım · KDV hariç
      </p>
      <Separator className="my-1.5 print:my-0.5" />

      <div className="rounded-lg border border-slate-300 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1 text-sm font-extrabold print:py-0.5 print:text-[11px]">
          Müşteri ve finansman
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-3 py-1.5 text-sm font-semibold print:gap-y-0.5 print:py-1 print:text-[10px]">
          <div className="text-slate-600">Firma</div>
          <div className="text-right font-extrabold">{props.firma ?? "—"}</div>
          <div className="text-slate-600">Makine modeli</div>
          <div className="text-right font-extrabold">{props.makine ?? "—"}</div>
          {isReverse && props.targetCustomerTotal != null ? (
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
          {props.totalBalloon > 0.005 ? (
            <>
              <div className="text-slate-600">Toplam balon</div>
              <div className="text-right tabular-nums font-extrabold">
                {fmt(props.totalBalloon)} {sym}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-slate-300 bg-white print:mt-1.5">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1 text-sm font-extrabold print:py-0.5 print:text-[11px]">
          Leasing hesaplaması
        </div>
        <div className="divide-y divide-slate-100 py-0.5">
          <Row
            label={
              isReverse
                ? "Hedef müşteri toplam ödemesi"
                : "Makine bedeli (KDV hariç)"
            }
            value={`${formatAmount(leasingPrincipal)} ${sym}`}
            bold
          />
          <Row
            label="Peşinat"
            value={`− ${formatAmount(props.downPayment)} ${sym}`}
          />
          <Row
            label="Kalan tutar"
            value={`${formatAmount(remaining)} ${sym}`}
            bold
          />
          <Row
            label="Vade farkı"
            value={`${isReverse ? "− " : ""}${formatAmount(financeInterest)} ${sym}`}
          />
          {support > 0 ? (
            <Row
              label="Finansman desteği"
              value={`+ ${formatAmount(support)} ${sym}`}
            />
          ) : null}
          <div className="border-t border-slate-200 bg-slate-50/80">
            <Row
              label="Peşinat dahil, vade farkı düşülmüş tutar"
              value={`${formatAmount(totalExcludingVadeFarki)} ${sym}`}
              bold
            />
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-slate-300 bg-white print:mt-1.5">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1 text-sm font-extrabold print:py-0.5 print:text-[11px]">
          {isReverse
            ? "Toplam ödemeden düşülen kalemler"
            : "Maliyet kalemleri"}
        </div>
        <div className="divide-y divide-slate-200">
          {props.detailRows.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500 print:text-[10px]">
              Ek kalem yok
            </div>
          ) : (
            props.detailRows.map((row) => (
              <div
                key={row.label}
                className={cn(
                  "flex items-center justify-between gap-4 px-3 py-1.5 text-sm font-semibold print:text-[10px]",
                  isKatkiPayiLabel(row.label) &&
                    "bg-[#fff7ed] font-extrabold text-[#9a3412] shadow-[inset_3px_0_0_0_#ea580c]",
                )}
              >
                <span
                  className={cn(
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
                    isKatkiPayiLabel(row.label) && "text-[#9a3412]",
                  )}
                >
                  {formatAmount(row.value)} {sym}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold print:text-[10px]">
          <span>Kalemler toplamı</span>
          <span className="tabular-nums">
            {formatAmount(kalemlerToplam)} {sym}
          </span>
        </div>
        {support > 0 ? (
          <div className="flex items-center justify-between gap-4 border-t border-dashed border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-800 print:text-[10px]">
            <span className="min-w-0 leading-snug">
              Finansman desteği{" "}
              <span className="font-medium text-slate-500">
                (kalemler toplamına dahil değil)
              </span>
            </span>
            <span className="shrink-0 tabular-nums font-bold">
              + {formatAmount(support)} {sym}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-2 rounded-lg border-2 border-[#2563eb]/30 bg-[#eff4ff] p-3 print:mt-1.5 print:p-2">
        <div className="space-y-2 text-sm font-semibold print:text-[10px]">
          {isReverse ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#434655]">
                  Toplam ödeme (peşinat dahil)
                </span>
                <span className="tabular-nums font-bold">
                  {formatAmount(customerTotal)} {sym}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-red-700">
                <span>− Kalemler toplamı</span>
                <span className="tabular-nums font-bold">
                  {formatAmount(kalemlerToplam)} {sym}
                </span>
              </div>
              {support > 0 ? (
                <div className="flex items-center justify-between gap-3 text-emerald-800">
                  <span>+ Finansman desteği</span>
                  <span className="tabular-nums font-bold">
                    {formatAmount(support)} {sym}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#434655]">Makine bedeli</span>
                <span className="tabular-nums font-bold">
                  {formatAmount(props.machinePrice)} {sym}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-800">
                <span>+ Kalemler toplamı</span>
                <span className="tabular-nums font-bold">
                  {formatAmount(kalemlerToplam)} {sym}
                </span>
              </div>
              {support > 0 ? (
                <div className="flex items-center justify-between gap-3 text-red-700">
                  <span>− Finansman desteği</span>
                  <span className="tabular-nums font-bold">
                    {formatAmount(support)} {sym}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="my-3 h-px bg-[#c3c6d7]/60" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#0b1c30] print:text-[11px]">
            {props.primaryTotalLabel}
          </span>
          <span className="text-2xl font-extrabold tabular-nums text-[#004ac6] print:text-[16px]">
            {formatAmount(props.primaryTotal)} {sym}
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
        {isReverse
          ? "Net fiyat, opsiyon ve masraflar düşüldükten sonra kalan makine satış bedelidir (KDV hariç). Ödeme planı ayrı alınır."
          : "Ödeme planı ayrı alınır. Peşinat, taksitler, balonlar ve peşin ek maliyetler müşteri toplamına dahildir."}
      </p>
    </div>
  );
}

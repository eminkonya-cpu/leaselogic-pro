"use client";

import { Separator } from "@/components/ui/separator";
import { formatAmount, formatNumber } from "@/components/finance/format";
import {
  sumReverseDetailRows,
  type SummaryReportRow,
} from "@/lib/reverseSummaryReport";
import { cn } from "@/lib/utils";

export type PrintableReverseSummaryProps = {
  firma?: string;
  makine?: string;
  frequencyLabel: string;
  currency: "EUR" | "TRY";
  currencySymbol: "€" | "₺";
  allInTotal: number;
  downPayment: number;
  term: number;
  termUnit: "month" | "year";
  planInterest: number;
  euroRate: number;
  interestDiff: number;
  displayNetMachine: number;
  detailRows: SummaryReportRow[];
  totalPayment: number;
  installment: number;
  installmentLabel: string;
};

function Row(props: {
  label: string;
  value: string;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-1.5 text-sm font-semibold print:text-[10px]",
        props.indent && "pl-6",
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

export function PrintableReverseSummaryContent(
  props: PrintableReverseSummaryProps & { className?: string },
) {
  const sym = props.currencySymbol;
  const kalemlerToplam = sumReverseDetailRows(props.detailRows);
  const netSatis = Math.max(0, props.totalPayment - kalemlerToplam);
  const totalExcludingVadeFarki = Math.max(
    0,
    props.totalPayment - props.interestDiff,
  );
  const interestLabel =
    props.currency === "TRY" ? "TL faiz oranı" : "Euro faiz oranı";

  return (
    <div
      id="pdf-print-area"
      className={cn("pdf-print-root bg-white", props.className)}
    >
      <div className="text-base font-extrabold leading-tight text-slate-900 print:text-[14px]">
        Geri Hesaplama Özeti (Detaylı)
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600 print:text-[10px]">
        {props.frequencyLabel} · Yönetim / iç kullanım · KDV hariç
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
          <div className="text-slate-600">Makine fiyatı</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatAmount(props.allInTotal)} {sym}
          </div>
          <div className="text-slate-600">Vade</div>
          <div className="text-right font-extrabold">
            {props.termUnit === "year"
              ? `${props.term} yıl`
              : `${props.term} ay`}
          </div>
          <div className="text-slate-600">{interestLabel}</div>
          <div className="text-right tabular-nums font-extrabold">
            %{formatNumber(props.planInterest, { decimals: 1 })}
          </div>
          <div className="text-slate-600">Kur (₺ / €)</div>
          <div className="text-right tabular-nums font-extrabold">
            {formatNumber(props.euroRate, { decimals: 2 })}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Leasing hesaplaması
        </div>
        <div className="divide-y divide-slate-100 py-0.5">
          <Row
            label="Makine fiyatı (KDV hariç)"
            value={`${formatAmount(props.allInTotal)} ${sym}`}
            bold
          />
          <Row
            label="Peşinat"
            value={`− ${formatAmount(props.downPayment)} ${sym}`}
          />
          <Row
            label="Kalan tutar"
            value={`${formatAmount(
              props.allInTotal - props.downPayment,
            )} ${sym}`}
            bold
          />
          <Row
            label="Vade farkı (finansman katkı payı)"
            value={`− ${formatAmount(props.interestDiff)} ${sym}`}
          />
          <div className="border-t border-slate-200 bg-slate-50/80">
            <Row
              label="Peşinat dahil, vade farkı düşülmüş tutar"
              value={`${formatAmount(totalExcludingVadeFarki)} ${sym}`}
              bold
            />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-white print:break-inside-avoid">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold print:text-[12px]">
          Kalemler (toplam ödemeden düşülen)
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
                className="flex items-center justify-between gap-4 px-3 py-1.5 text-sm font-semibold print:text-[10px]"
              >
                <span className="text-slate-700">{row.label}</span>
                <span className="shrink-0 tabular-nums font-bold">
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
      </div>

      <div className="mt-3 rounded-lg border-2 border-[#2563eb]/30 bg-[#eff4ff] p-4 print:break-inside-avoid">
        <div className="space-y-2 text-sm font-semibold print:text-[10px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#434655]">
              Toplam ödeme (peşinat dahil)
            </span>
            <span className="tabular-nums font-bold">
              {formatAmount(props.totalPayment)} {sym}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-red-700">
            <span>− Kalemler toplamı</span>
            <span className="tabular-nums font-bold">
              {formatAmount(kalemlerToplam)} {sym}
            </span>
          </div>
        </div>
        <div className="my-3 h-px bg-[#c3c6d7]/60" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#0b1c30] print:text-[11px]">
            Net makine satış fiyatı (KDV hariç)
          </span>
          <span className="text-2xl font-extrabold tabular-nums text-[#004ac6] print:text-[16px]">
            {formatAmount(netSatis)} {sym}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium leading-snug text-[#565e74] print:text-[9px]">
          Opsiyonlar kalemlerde ayrı gösterildiği için net fiyat yalnızca makine
          satış bedelini ifade eder (
          {formatAmount(props.displayNetMachine)} {sym}{" "}
          ile uyumlu).
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[#c3c6d7]/40 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#565e74]">
            {props.installmentLabel}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {formatAmount(props.installment)} {sym}
          </span>
        </div>
      </div>
    </div>
  );
}

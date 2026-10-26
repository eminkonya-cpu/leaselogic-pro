"use client";

import { formatMoneyWithSymbol, formatNumber } from "@/components/finance/format";
import {
  ReportDocument,
  ReportKeyValues,
  ReportLineTable,
  ReportMetricStrip,
  ReportResult,
  ReportSection,
  ReportSupportCompare,
  type ReportKeyValue,
  type ReportMetric,
} from "@/components/finance/reports/ExecutiveReport";
import { ClassicCalculationSummaryContent } from "@/components/finance/reports/classic/ClassicCalculationSummary";
import type { ForwardTabId } from "@/lib/forwardDisplayMetrics";
import type { SummaryReportRow } from "@/lib/calculationSummaryReport";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import { REPORT_DESIGN } from "@/lib/reportDesign";

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
  financingSupportDisplay?: number;
  supportCompare?: FinancingSupportCompare | null;
  primaryTotalLabel?: string;
};

export function PrintableCalculationSummaryContent(
  props: PrintableCalculationSummaryProps & { className?: string },
) {
  if (REPORT_DESIGN === "classic") {
    return <ClassicCalculationSummaryContent {...props} />;
  }
  return <ExecutiveCalculationSummary {...props} />;
}

function ExecutiveCalculationSummary(
  props: PrintableCalculationSummaryProps & { className?: string },
) {
  const isTry = props.currency === "TRY";
  const sym = isTry ? "₺" : "€";
  const rate = props.euroRate;
  const money = (v: number) =>
    formatMoneyWithSymbol(v, sym, 0);
  const pct = (v: number) => `%${formatNumber(v, { decimals: 1 })}`;

  const machinePrice = isTry ? props.machinePriceEuro * rate : props.machinePriceEuro;
  const downPayment = isTry ? props.downPaymentEuro * rate : props.downPaymentEuro;
  const total = isTry ? props.totalTl : props.totalEuro;
  const financingSupport = Math.max(0, props.financingSupportDisplay ?? 0);
  const termText = props.termUnit === "year" ? `${props.term} yıl` : `${props.term} ay`;
  const totalLabel =
    props.primaryTotalLabel ?? (isTry ? "Toplam ödeme (TL)" : "Toplam (EUR)");

  const metrics: ReportMetric[] = [
    { label: props.machinePriceLabel, value: money(machinePrice) },
    { label: "Peşinat", value: money(downPayment) },
    { label: "Vade", value: termText },
    ...(financingSupport > 0
      ? [{ label: "Finansman desteği", value: money(financingSupport) }]
      : []),
    { label: totalLabel, value: money(total), emphasis: true },
  ];

  const rateItems: ReportKeyValue[] =
    props.activeTab === "campaign"
      ? [{ label: "Faiz", value: "Kampanyalı fiyat (finansman dahil)" }]
      : isTry
        ? [
            { label: "TL faiz oranı", value: pct(props.tlInterest) },
            { label: "Euro faiz oranı", value: pct(props.euroInterest) },
          ]
        : [
            { label: "Euro faiz oranı", value: pct(props.euroInterest) },
            { label: "TL faiz oranı", value: pct(props.tlInterest) },
          ];

  const conditions: ReportKeyValue[] = [
    { label: "Firma", value: props.firma || "—" },
    { label: "Makine modeli", value: props.makine || "—" },
    { label: props.machinePriceLabel, value: money(machinePrice) },
    { label: "Peşinat", value: money(downPayment) },
    { label: "Vade", value: termText },
    ...rateItems,
    { label: "Kur (₺ / €)", value: formatNumber(props.euroRate, { decimals: 2 }) },
    ...(financingSupport > 0
      ? [{ label: "Finansman desteği", value: money(financingSupport) }]
      : []),
  ];

  const tags = [props.tabLabel, "KDV hariç", isTry ? "TL leasing (TL faiz)" : "EUR"];

  let section = 0;

  return (
    <ReportDocument
      kind="Leasing · İleri hesaplama"
      title="Hesaplama Özeti"
      tags={tags}
      className={props.className}
      footnote="Bu özet detaylı kalem dökümü içindir; ödeme planı ayrı alınır. Tutarlar bilgilendirme amaçlıdır."
    >
      <ReportMetricStrip items={metrics} />

      <ReportSection index={++section} title="Müşteri ve finansman koşulları">
        <ReportKeyValues items={conditions} />
      </ReportSection>

      <ReportSection
        index={++section}
        title="Maliyet kalemleri"
        aside={`${props.rows.length} kalem`}
      >
        <ReportLineTable
          head={["Kalem", `Tutar (${sym})`]}
          emptyText="Seçili kalem yok."
          lines={props.rows.map((row) => ({
            label: row.label,
            value: money(row.valueEuro),
            tone: row.valueEuro < 0 ? "positive" : "default",
          }))}
        />
      </ReportSection>

      <ReportSection index={++section} title="Sonuç">
        <ReportResult label={totalLabel} value={money(total)} />
      </ReportSection>

      {props.supportCompare && financingSupport > 0 ? (
        <ReportSection index={++section} title="Finansman desteği etkisi">
          <ReportSupportCompare
            baselineLabel={props.supportCompare.baselineLabel}
            baselineValue={props.supportCompare.baselineValue}
            supportedLabel="Müşteri toplam ödemesi (destekli)"
            supportedValue={total}
            deltaLabel={props.supportCompare.deltaLabel}
            deltaText={`${props.supportCompare.deltaValue >= 0 ? "+" : "−"}${money(
              Math.abs(props.supportCompare.deltaValue),
            )}`}
            format={money}
          />
        </ReportSection>
      ) : null}
    </ReportDocument>
  );
}

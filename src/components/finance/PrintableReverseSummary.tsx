"use client";

import { formatAmount, formatNumber } from "@/components/finance/format";
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
import { ClassicReverseSummaryContent } from "@/components/finance/reports/classic/ClassicReverseSummary";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import { REPORT_DESIGN } from "@/lib/reportDesign";
import {
  sumReverseDetailRows,
  type SummaryReportRow,
} from "@/lib/reverseSummaryReport";

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
  financingSupportDisplay?: number;
  supportCompare?: FinancingSupportCompare | null;
  netMachineTotalLabel?: string;
};

export function PrintableReverseSummaryContent(
  props: PrintableReverseSummaryProps & { className?: string },
) {
  if (REPORT_DESIGN === "classic") {
    return <ClassicReverseSummaryContent {...props} />;
  }
  return <ExecutiveReverseSummary {...props} />;
}

function ExecutiveReverseSummary(
  props: PrintableReverseSummaryProps & { className?: string },
) {
  const sym = props.currencySymbol;
  const money = (v: number) => `${formatAmount(v)} ${sym}`;
  const kalemlerToplam = sumReverseDetailRows(props.detailRows);
  const financingSupport = Math.max(0, props.financingSupportDisplay ?? 0);
  const netSatis = Math.max(0, props.displayNetMachine);
  const totalExcludingVadeFarki = Math.max(0, props.totalPayment - props.interestDiff);
  const interestLabel = props.currency === "TRY" ? "TL faiz oranı" : "Euro faiz oranı";
  const termText = props.termUnit === "year" ? `${props.term} yıl` : `${props.term} ay`;
  const netLabel = props.netMachineTotalLabel ?? "Net makine satış fiyatı (KDV hariç)";

  const metrics: ReportMetric[] = [
    { label: "Makine fiyatı", value: money(props.allInTotal) },
    { label: "Vade", value: termText },
    { label: "Vade farkı", value: money(props.interestDiff) },
    ...(financingSupport > 0
      ? [{ label: "Finansman desteği", value: money(financingSupport) }]
      : []),
    { label: "Net makine bedeli", value: money(netSatis), emphasis: true },
  ];

  const conditions: ReportKeyValue[] = [
    { label: "Firma", value: props.firma || "—" },
    { label: "Makine modeli", value: props.makine || "—" },
    { label: "Makine fiyatı", value: money(props.allInTotal) },
    { label: "Vade", value: termText },
    { label: interestLabel, value: `%${formatNumber(props.planInterest, { decimals: 1 })}` },
    { label: "Kur (₺ / €)", value: formatNumber(props.euroRate, { decimals: 2 }) },
    ...(financingSupport > 0
      ? [{ label: "Finansman desteği", value: money(financingSupport) }]
      : []),
  ];

  let section = 0;

  return (
    <ReportDocument
      kind="Leasing · Geri hesaplama"
      title="Geri Hesaplama Özeti"
      tags={[props.frequencyLabel, "KDV hariç", props.currency === "TRY" ? "TL" : "EUR"]}
      className={props.className}
      footnote="Net fiyat, opsiyon ve masraflar düşüldükten sonra kalan makine satış bedelidir (KDV hariç). Tutarlar bilgilendirme amaçlıdır."
    >
      <ReportMetricStrip items={metrics} />

      <ReportSection index={++section} title="Müşteri ve finansman koşulları">
        <ReportKeyValues items={conditions} />
      </ReportSection>

      <ReportSection index={++section} title="Leasing hesaplaması">
        <ReportLineTable
          lines={[
            { label: "Makine fiyatı (KDV hariç)", value: money(props.allInTotal), strong: true },
            { label: "Peşinat", value: `− ${money(props.downPayment)}`, tone: "negative" },
            {
              label: "Kalan tutar",
              value: money(props.allInTotal - props.downPayment),
              strong: true,
            },
            {
              label: "Vade farkı (finansman katkı payı)",
              value: `− ${money(props.interestDiff)}`,
              tone: "negative",
            },
            ...(financingSupport > 0
              ? [
                  {
                    label: "Finansman desteği",
                    value: `+ ${money(financingSupport)}`,
                    tone: "positive" as const,
                  },
                ]
              : []),
          ]}
          totals={[
            {
              label: "Peşinat dahil, vade farkı düşülmüş tutar",
              value: money(totalExcludingVadeFarki),
              strong: true,
            },
          ]}
        />
      </ReportSection>

      <ReportSection
        index={++section}
        title="Toplam ödemeden düşülen kalemler"
        aside={`${props.detailRows.length} kalem`}
      >
        <ReportLineTable
          head={["Kalem", `Tutar (${sym})`]}
          emptyText="Ek kalem yok."
          lines={props.detailRows.map((row) => ({
            label: row.label,
            value: money(row.value),
          }))}
          totals={[
            { label: "Kalemler toplamı", value: money(kalemlerToplam), strong: true },
            ...(financingSupport > 0
              ? [
                  {
                    label: "Finansman desteği",
                    note: "(kalemler toplamına dahil değil)",
                    value: `+ ${money(financingSupport)}`,
                    tone: "positive" as const,
                  },
                ]
              : []),
          ]}
        />
      </ReportSection>

      <ReportSection index={++section} title="Sonuç">
        <ReportResult
          label={netLabel}
          value={money(netSatis)}
          lines={[
            { label: "Toplam ödeme (peşinat dahil)", value: money(props.totalPayment) },
            {
              label: "− Kalemler toplamı",
              value: money(kalemlerToplam),
              tone: "negative",
            },
            ...(financingSupport > 0
              ? [
                  {
                    label: "+ Finansman desteği",
                    value: money(financingSupport),
                    tone: "positive" as const,
                  },
                ]
              : []),
          ]}
        />
      </ReportSection>

      {props.supportCompare && financingSupport > 0 ? (
        <ReportSection index={++section} title="Finansman desteği etkisi">
          <ReportSupportCompare
            baselineLabel="Net makine bedeli (desteksiz)"
            baselineValue={props.supportCompare.baselineValue}
            supportedLabel="Net makine bedeli (destekli)"
            supportedValue={netSatis}
            deltaLabel={props.supportCompare.deltaLabel}
            deltaText={`+${money(props.supportCompare.deltaValue)}`}
            format={money}
          />
        </ReportSection>
      ) : null}
    </ReportDocument>
  );
}

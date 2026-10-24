"use client";

import { formatNumber } from "@/components/finance/format";
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
import { ClassicGraceBalloonSummaryContent } from "@/components/finance/reports/classic/ClassicGraceBalloonSummary";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import { REPORT_DESIGN } from "@/lib/reportDesign";

export type PrintableGraceBalloonSummaryProps = {
  direction: "forward" | "reverse";
  firma?: string;
  makine?: string;
  currencySymbol: string;
  machinePrice: number;
  targetCustomerTotal?: number;
  downPayment: number;
  financingSupport: number;
  annualRatePct: number;
  termMonths: number;
  startDate: string;
  totalBalloon: number;
  payingMonthCount: number;
  /** Örn. Toplam 27 ay vade · 3 ay ödemesiz · 24 ay ödemeli */
  planTermLabel: string;
  monthlyInstallment: number;
  detailRows: { label: string; value: number }[];
  primaryTotal: number;
  primaryTotalLabel: string;
  supportCompare?: FinancingSupportCompare | null;
  compareSectionTitle?: string;
  compareSupportedLabel?: string;
};

export function PrintableGraceBalloonSummaryContent(
  props: PrintableGraceBalloonSummaryProps & { className?: string },
) {
  if (REPORT_DESIGN === "classic") {
    return <ClassicGraceBalloonSummaryContent {...props} />;
  }
  return <ExecutiveGraceBalloonSummary {...props} />;
}

function ExecutiveGraceBalloonSummary(
  props: PrintableGraceBalloonSummaryProps & { className?: string },
) {
  const sym = props.currencySymbol;
  const money = (v: number) => `${formatNumber(v, { decimals: 2 })} ${sym}`;
  const support = Math.max(0, props.financingSupport);
  const isReverse = props.direction === "reverse";
  const hasTarget = isReverse && props.targetCustomerTotal != null;

  const priceItem: ReportKeyValue = hasTarget
    ? { label: "Hedef müşteri toplam ödemesi", value: money(props.targetCustomerTotal!) }
    : { label: "Makine bedeli", value: money(props.machinePrice) };

  const metrics: ReportMetric[] = [
    { label: hasTarget ? "Hedef toplam" : "Makine bedeli", value: priceItem.value },
    { label: "Aylık taksit", value: money(props.monthlyInstallment) },
    { label: "Toplam balon", value: money(props.totalBalloon) },
    ...(support > 0 ? [{ label: "Finansman desteği", value: money(support) }] : []),
    { label: props.primaryTotalLabel, value: money(props.primaryTotal), emphasis: true },
  ];

  const conditions: ReportKeyValue[] = [
    { label: "Firma", value: props.firma || "—" },
    { label: "Makine modeli", value: props.makine || "—" },
    priceItem,
    { label: "Peşinat", value: money(props.downPayment) },
    { label: "Plan süresi", value: props.planTermLabel },
    { label: "Aylık taksit", value: money(props.monthlyInstallment) },
    { label: "Yıllık nominal faiz", value: `%${formatNumber(props.annualRatePct, { decimals: 2 })}` },
    { label: "Finansman başlangıcı", value: props.startDate },
    ...(support > 0 ? [{ label: "Finansman desteği", value: money(support) }] : []),
    { label: "Toplam balon", value: money(props.totalBalloon) },
  ];

  let section = 0;

  return (
    <ReportDocument
      kind={`3 Ay Ödemesiz & Balon · ${isReverse ? "Geri hesaplama" : "İleri hesaplama"}`}
      title="Balon Planı Özeti"
      tags={[props.planTermLabel, "KDV hariç"]}
      className={props.className}
      footnote="Ödeme planı ayrı alınır. Peşinat, taksitler, balonlar ve peşin ek maliyetler müşteri toplamına dahildir."
    >
      <ReportMetricStrip items={metrics} />

      <ReportSection index={++section} title="Müşteri ve finansman koşulları">
        <ReportKeyValues items={conditions} />
      </ReportSection>

      <ReportSection
        index={++section}
        title="Maliyet kalemleri"
        aside={`${props.detailRows.length} kalem`}
      >
        <ReportLineTable
          head={["Kalem", `Tutar (${sym})`]}
          emptyText="Ek kalem yok."
          lines={props.detailRows.map((row) => ({
            label: row.label,
            value: money(row.value),
            tone: row.value < 0 ? "positive" : "default",
          }))}
        />
      </ReportSection>

      <ReportSection index={++section} title="Sonuç">
        <ReportResult label={props.primaryTotalLabel} value={money(props.primaryTotal)} />
      </ReportSection>

      {props.supportCompare && support > 0 ? (
        <ReportSection
          index={++section}
          title={props.compareSectionTitle ?? "Finansman desteği etkisi"}
        >
          <ReportSupportCompare
            baselineLabel={props.supportCompare.baselineLabel}
            baselineValue={props.supportCompare.baselineValue}
            supportedLabel={props.compareSupportedLabel ?? props.primaryTotalLabel}
            supportedValue={props.primaryTotal}
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

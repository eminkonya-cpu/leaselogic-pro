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
import { ClassicGraceBalloonSummaryContent } from "@/components/finance/reports/classic/ClassicGraceBalloonSummary";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import { sumGraceBalloonDetailRows } from "@/lib/graceBalloonSummaryRows";
import { isKatkiPayiLabel, KATKI_PAYI_NOTE } from "@/lib/kalemlerToplam";
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
  financeInterest: number;
  customerTotalPayment: number;
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
  const money = (v: number) => formatMoneyWithSymbol(v, sym);
  const support = Math.max(0, props.financingSupport);
  const isReverse = props.direction === "reverse";
  const hasTarget = isReverse && props.targetCustomerTotal != null;
  const kalemlerToplam = sumGraceBalloonDetailRows(props.detailRows);
  const customerTotal = Math.max(0, props.customerTotalPayment);
  const financeInterest = Math.max(0, props.financeInterest);
  const leasingPrincipal = isReverse ? customerTotal : props.machinePrice;
  const remaining = leasingPrincipal - props.downPayment;
  const totalExcludingVadeFarki = Math.max(0, customerTotal - financeInterest);

  const priceItem: ReportKeyValue = hasTarget
    ? { label: "Hedef müşteri toplam ödemesi", value: money(props.targetCustomerTotal!) }
    : { label: "Makine bedeli", value: money(props.machinePrice) };

  const metrics: ReportMetric[] = [
    { label: hasTarget ? "Hedef toplam" : "Makine bedeli", value: priceItem.value },
    { label: "Aylık taksit", value: money(props.monthlyInstallment) },
    { label: "Vade farkı", value: money(financeInterest) },
    ...(support > 0 ? [{ label: "Finansman desteği", value: money(support) }] : []),
    { label: props.primaryTotalLabel, value: money(props.primaryTotal), emphasis: true },
  ];

  const conditions: ReportKeyValue[] = [
    { label: "Firma", value: props.firma || "—" },
    { label: "Makine modeli", value: props.makine || "—" },
    { label: "Peşinat", value: money(props.downPayment) },
    { label: "Plan süresi", value: props.planTermLabel },
    { label: "Yıllık nominal faiz", value: `%${formatNumber(props.annualRatePct, { decimals: 2 })}` },
    { label: "Finansman başlangıcı", value: props.startDate },
    ...(props.totalBalloon > 0.005
      ? [{ label: "Toplam balon", value: money(props.totalBalloon) }]
      : []),
  ];

  let section = 0;

  return (
    <ReportDocument
      kind={`3 Ay Ödemesiz & Balon · ${isReverse ? "Geri hesaplama" : "İleri hesaplama"}`}
      title="Balon Planı Özeti"
      tags={["KDV hariç"]}
      dense
      className={props.className}
      footnote={
        isReverse
          ? "Net fiyat, opsiyon ve masraflar düşüldükten sonra kalan makine satış bedelidir (KDV hariç). Ödeme planı ayrı alınır."
          : "Ödeme planı ayrı alınır. Peşinat, taksitler, balonlar ve peşin ek maliyetler müşteri toplamına dahildir."
      }
    >
      <ReportMetricStrip items={metrics} />

      <ReportSection index={++section} title="Müşteri ve finansman koşulları">
        <ReportKeyValues items={conditions} columns={2} />
      </ReportSection>

      <ReportSection index={++section} title="Leasing hesaplaması">
        <ReportLineTable
          lines={[
            {
              label: isReverse
                ? "Hedef müşteri toplam ödemesi"
                : "Makine bedeli (KDV hariç)",
              value: money(leasingPrincipal),
              strong: true,
            },
            { label: "Peşinat", value: `− ${money(props.downPayment)}`, tone: "negative" },
            {
              label: "Kalan tutar",
              value: money(remaining),
              strong: true,
            },
            {
              label: "Vade farkı",
              value: isReverse ? `− ${money(financeInterest)}` : money(financeInterest),
              tone: isReverse ? "negative" : "default",
            },
            ...(support > 0
              ? [
                  {
                    label: "Finansman desteği",
                    value: `+ ${money(support)}`,
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
        title={
          isReverse
            ? "Toplam ödemeden düşülen kalemler"
            : "Maliyet kalemleri"
        }
        aside={`${props.detailRows.length} kalem`}
      >
        <ReportLineTable
          head={["Kalem", `Tutar (${sym})`]}
          emptyText="Ek kalem yok."
          lines={props.detailRows.map((row) => ({
            label: row.label,
            value: money(row.value),
            strong: isKatkiPayiLabel(row.label),
            tone: isKatkiPayiLabel(row.label) ? "highlight" : "default",
            note: isKatkiPayiLabel(row.label) ? KATKI_PAYI_NOTE : undefined,
          }))}
          totals={[
            { label: "Kalemler toplamı", value: money(kalemlerToplam), strong: true },
            ...(support > 0
              ? [
                  {
                    label: "Finansman desteği",
                    note: "(kalemler toplamına dahil değil)",
                    value: `+ ${money(support)}`,
                    tone: "positive" as const,
                  },
                ]
              : []),
          ]}
        />
      </ReportSection>

      <ReportSection index={++section} title="Sonuç">
        <ReportResult
          label={props.primaryTotalLabel}
          value={money(props.primaryTotal)}
          lines={
            isReverse
              ? [
                  { label: "Toplam ödeme (peşinat dahil)", value: money(customerTotal) },
                  {
                    label: "− Kalemler toplamı",
                    value: money(kalemlerToplam),
                    tone: "negative" as const,
                  },
                  ...(support > 0
                    ? [
                        {
                          label: "+ Finansman desteği",
                          value: money(support),
                          tone: "positive" as const,
                        },
                      ]
                    : []),
                ]
              : [
                  { label: "Makine bedeli", value: money(props.machinePrice) },
                  {
                    label: "+ Kalemler toplamı",
                    value: money(kalemlerToplam),
                    tone: "positive" as const,
                  },
                  ...(support > 0
                    ? [
                        {
                          label: "− Finansman desteği",
                          value: money(support),
                          tone: "negative" as const,
                        },
                      ]
                    : []),
                ]
          }
        />
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

import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import {
  buildKatkiPayiRows,
  katkiPayiStitchTone,
} from "@/lib/katkiPayiGroup";
import { sumKalemlerToplam } from "@/lib/kalemlerToplam";
import type { LeasingPlanSummary } from "@/lib/leasingPaymentPlan";
import {
  internalSupportLines,
  type SupportSplit,
} from "@/lib/supportSplit";

export type GraceBalloonExtraAmounts = {
  fileFee: number;
  totalInsurance: number;
  importCost: number;
  attachmentCost: number;
};

const ATTACHMENT_LABEL = "Ataşman ve donanım maliyeti";

function graceKatkiRows(
  extras: GraceBalloonExtraAmounts,
  financeCost: number,
  args?: { sign?: 1 | -1; hasFollowingItems?: boolean },
) {
  return buildKatkiPayiRows({
    kasko: extras.totalInsurance,
    masraflar: extras.fileFee,
    vadeFarki: financeCost,
    ithalat: extras.importCost,
    sign: args?.sign,
    hasFollowingItems: args?.hasFollowingItems,
  });
}

/** Özet rapor / finansman bilgileri: toplam vade ve ödemesiz-ödemeli dağılımı. */
export function formatGraceBalloonPlanTerm(args: {
  termMonths: number;
  graceMonthCount: number;
  payingMonthCount: number;
}): string {
  const term = Math.max(0, Math.trunc(args.termMonths));
  const grace = Math.max(0, Math.trunc(args.graceMonthCount));
  const paying = Math.max(0, Math.trunc(args.payingMonthCount));
  if (term <= 0) return "—";
  if (grace <= 0) {
    return `Toplam ${term} ay vade (tüm aylar ödemeli)`;
  }
  return `Toplam ${term} ay vade · ${grace} ay ödemesiz · ${paying} ay ödemeli`;
}

export function buildGraceBalloonDetailedReportRows(args: {
  extras: GraceBalloonExtraAmounts;
  displayFinanceInterest: number;
  optionRows?: { label: string; value: number }[];
}): { label: string; value: number }[] {
  const rows: { label: string; value: number }[] = [];
  const optionRows = (args.optionRows ?? []).filter((row) => row.value > 0);
  const attachment =
    optionRows.length > 0 ? 0 : Math.max(0, args.extras.attachmentCost);
  const financeCost = Math.max(0, args.displayFinanceInterest);
  const hasFollowing = optionRows.length > 0 || attachment > 0;
  for (const row of graceKatkiRows(args.extras, financeCost, {
    hasFollowingItems: hasFollowing,
  })) {
    rows.push({ label: row.label, value: row.value });
  }
  for (const row of optionRows) {
    rows.push({ label: row.label, value: row.value });
  }
  if (attachment > 0) {
    rows.push({ label: ATTACHMENT_LABEL, value: attachment });
  }
  return rows;
}

export function sumGraceBalloonDetailRows(
  rows: { label: string; value: number }[],
): number {
  return sumKalemlerToplam(rows);
}

/** Sağ panel: geri hesaplama özet satırları ile aynı stitch düzeni. */
export function buildGraceBalloonStitchSummaryRows(args: {
  direction: "forward" | "reverse";
  machinePrice: number;
  targetCustomerTotal: number;
  solvedMachine: number | null;
  summary: LeasingPlanSummary;
  extras: GraceBalloonExtraAmounts;
  financingSupport: number;
  supportSplit?: SupportSplit;
  /** Destek varken desteksiz referans faiz maliyeti. */
  displayFinanceInterest?: number;
  optionRows?: { label: string; value: number }[];
}): CostSummaryRow[] {
  const optionRows = (args.optionRows ?? []).filter((row) => row.value > 0);
  const attachment =
    optionRows.length > 0 ? 0 : Math.max(0, args.extras.attachmentCost);
  const financeCost = Math.max(
    0,
    args.displayFinanceInterest ?? args.summary.totalFinanceInterest,
  );
  const supportLines = internalSupportLines(
    args.supportSplit ??
      (args.financingSupport
        ? { factory: 0, maats: args.financingSupport }
        : undefined),
    args.direction === "reverse" ? 1 : -1,
  );
  const hasFollowing = optionRows.length > 0 || attachment > 0;

  if (args.direction === "reverse") {
    const rows: CostSummaryRow[] = [
      {
        label: "Müşteri toplam ödemesi",
        value: args.targetCustomerTotal,
        tone: "emphasis",
      },
    ];
    for (const row of graceKatkiRows(args.extras, financeCost, {
      sign: -1,
      hasFollowingItems: hasFollowing,
    })) {
      rows.push({
        label: row.label,
        value: row.value,
        tone: katkiPayiStitchTone(row.role, "negative"),
      });
    }
    for (const row of optionRows) {
      rows.push({
        label: row.label,
        value: -row.value,
        tone: "negative",
      });
    }
    if (attachment > 0) {
      rows.push({
        label: ATTACHMENT_LABEL,
        value: -attachment,
        tone: "negative",
      });
    }
    for (const row of supportLines) {
      rows.push({
        label: row.label,
        value: row.value,
        tone: "positive",
      });
    }
    rows.push({
      label: "Bulunan makine bedeli (KDV hariç)",
      value: args.solvedMachine ?? 0,
      tone: "subtotal",
    });
    return rows;
  }

  const rows: CostSummaryRow[] = [
    {
      label: "Makine bedeli",
      value: args.machinePrice,
      tone: "emphasis",
    },
  ];
  for (const row of graceKatkiRows(args.extras, financeCost, {
    hasFollowingItems: hasFollowing,
  })) {
    rows.push({
      label: row.label,
      value: row.value,
      tone: katkiPayiStitchTone(row.role, "positive"),
    });
  }
  for (const row of optionRows) {
    rows.push({
      label: row.label,
      value: row.value,
      tone: "positive",
    });
  }
  if (attachment > 0) {
    rows.push({
      label: ATTACHMENT_LABEL,
      value: attachment,
      tone: "positive",
    });
  }
  for (const row of supportLines) {
    rows.push({
      label: row.label,
      value: row.value,
      tone: "negative",
    });
  }
  rows.push({
    label: "Müşteri toplam ödemesi (KDV hariç)",
    value: args.summary.customerTotalPayment,
    tone: "subtotal",
  });
  return rows;
}

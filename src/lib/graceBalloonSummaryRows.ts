import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import type { LeasingPlanSummary } from "@/lib/leasingPaymentPlan";

export type GraceBalloonExtraAmounts = {
  fileFee: number;
  totalInsurance: number;
  importCost: number;
  attachmentCost: number;
};

const ATTACHMENT_LABEL = "Ataşman toplamı";
const FINANCING_SUPPORT_LABEL = "Finansman desteği";
const EXPENSE_BUNDLE_LABEL = "Ek masraflar (Kasko, Leasing, İthalat)";

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

function sumInsuranceLeasingImport(extras: GraceBalloonExtraAmounts): number {
  return (
    Math.max(0, extras.fileFee) +
    Math.max(0, extras.totalInsurance) +
    Math.max(0, extras.importCost)
  );
}

export function buildGraceBalloonDetailedReportRows(args: {
  direction: "forward" | "reverse";
  machinePrice: number;
  extras: GraceBalloonExtraAmounts;
  displayFinanceInterest: number;
  financingSupport: number;
}): { label: string; value: number }[] {
  const stitch = buildGraceBalloonStitchSummaryRows({
    direction: args.direction,
    machinePrice: args.machinePrice,
    targetCustomerTotal: 0,
    solvedMachine: null,
    summary: {
      status: "ok",
      message: "",
      financedPrincipal: 0,
      payingMonthCount: 0,
      equalNormalInstallment: 0,
      totalBalloon: 0,
      totalLeasingPayments: 0,
      totalFinanceInterest: args.displayFinanceInterest,
      totalExtraCosts: 0,
      cashExtraCosts: 0,
      financedExtraCosts: 0,
      machineFinancedPrincipal: 0,
      customerTotalPayment: 0,
    },
    extras: args.extras,
    financingSupport: args.financingSupport,
    displayFinanceInterest: args.displayFinanceInterest,
  });
  return stitch
    .filter((row) => {
      if (row.tone === "subtotal") return false;
      if (args.direction === "reverse" && row.tone === "emphasis") return false;
      return true;
    })
    .map((row) => ({
      label: row.label,
      value: row.value,
    }));
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
  /** Destek varken desteksiz referans faiz maliyeti. */
  displayFinanceInterest?: number;
}): CostSummaryRow[] {
  const expenseBundle = sumInsuranceLeasingImport(args.extras);
  const attachment = Math.max(0, args.extras.attachmentCost);
  const financeCost = Math.max(
    0,
    args.displayFinanceInterest ?? args.summary.totalFinanceInterest,
  );
  const support = Math.max(0, args.financingSupport);

  if (args.direction === "reverse") {
    const rows: CostSummaryRow[] = [
      {
        label: "Müşteri toplam ödemesi",
        value: args.targetCustomerTotal,
        tone: "emphasis",
      },
    ];
    if (expenseBundle > 0) {
      rows.push({
        label: EXPENSE_BUNDLE_LABEL,
        value: -expenseBundle,
        tone: "negative",
      });
    }
    if (financeCost > 0) {
      rows.push({
        label: "Finansman maliyeti (vade farkı)",
        value: -financeCost,
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
    if (support > 0) {
      rows.push({
        label: FINANCING_SUPPORT_LABEL,
        value: support,
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
  if (expenseBundle > 0) {
    rows.push({
      label: EXPENSE_BUNDLE_LABEL,
      value: expenseBundle,
      tone: "positive",
    });
  }
  if (financeCost > 0) {
    rows.push({
      label: "Finansman maliyeti (vade farkı)",
      value: financeCost,
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
  if (support > 0) {
    rows.push({
      label: FINANCING_SUPPORT_LABEL,
      value: -support,
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

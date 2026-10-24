import {
  computeLeasingPaymentPlan,
  resolveExtraCostModes,
  splitExtraCosts,
  type LeasingPlanInput,
  type LeasingPlanResult,
  type LeasingPlanSummary,
} from "@/lib/leasingPaymentPlan";

function num(v: number | undefined | null): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type LeasingPlanReverseInput = Omit<LeasingPlanInput, "machinePrice"> & {
  targetCustomerTotal: number;
};

export type LeasingPlanReverseResult = LeasingPlanResult & {
  solvedMachinePrice: number | null;
};

function failSummary(
  status: LeasingPlanSummary["status"],
  message: string,
  extraTotal: number,
): LeasingPlanSummary {
  return {
    status,
    message,
    financedPrincipal: 0,
    payingMonthCount: 0,
    equalNormalInstallment: 0,
    totalBalloon: 0,
    totalLeasingPayments: 0,
    totalFinanceInterest: 0,
    totalExtraCosts: extraTotal,
    cashExtraCosts: 0,
    financedExtraCosts: 0,
    machineFinancedPrincipal: 0,
    customerTotalPayment: 0,
  };
}

/**
 * Hedef müşteri toplam ödemesinden makine bedelini çözer (peşinat, destek, balon, ödemesiz ay ve ek maliyetler sabit).
 */
export function computeLeasingPaymentPlanReverse(
  raw: LeasingPlanReverseInput,
): LeasingPlanReverseResult {
  const target = num(raw.targetCustomerTotal);
  const downPayment = num(raw.downPayment);
  const financingSupport = num(raw.financingSupport);
  const extraSplit = splitExtraCosts(
    {
      fileFee: num(raw.fileFee),
      totalInsurance: num(raw.totalInsurance),
      importCost: num(raw.importCost),
      attachmentCost: num(raw.attachmentCost),
    },
    resolveExtraCostModes(raw.extraCostModes),
  );

  if (target <= 0) {
    return {
      summary: failSummary(
        "incomplete",
        "Hedef müşteri toplam ödemesini girin.",
        extraSplit.total,
      ),
      rows: [],
      solvedMachinePrice: null,
    };
  }

  const minCustomer = downPayment + extraSplit.cash;
  if (target < minCustomer - 1e-6) {
    return {
      summary: failSummary(
        "invalid",
        "Hedef toplam, peşinat ile peşin ek maliyetlerin toplamından düşük olamaz.",
        extraSplit.total,
      ),
      rows: [],
      solvedMachinePrice: null,
    };
  }

  const base = { ...raw, machinePrice: 0 };

  function totalAt(machine: number): number | null {
    const r = computeLeasingPaymentPlan({ ...base, machinePrice: machine });
    if (r.summary.status !== "ok") return null;
    return r.summary.customerTotalPayment;
  }

  let lo = downPayment + financingSupport + 0.01;
  let hi = Math.max(target * 1.5, lo + 1);

  let tLo = totalAt(lo);
  for (let i = 0; i < 64 && tLo == null; i++) {
    lo = lo * 1.2 + 500;
    tLo = totalAt(lo);
  }
  if (tLo == null) {
    return {
      summary: failSummary(
        "invalid",
        "Bu parametrelerle geri hesaplama yapılamıyor.",
        extraSplit.total,
      ),
      rows: [],
      solvedMachinePrice: null,
    };
  }

  if (tLo > target + 0.02) {
    return {
      summary: failSummary(
        "invalid",
        "Hedef toplam çok düşük; mevcut peşinat, balon ve ödeme planı ile bu tutara ulaşılamaz.",
        extraSplit.total,
      ),
      rows: [],
      solvedMachinePrice: null,
    };
  }

  let tHi = totalAt(hi);
  for (let i = 0; i < 48 && (tHi == null || tHi < target); i++) {
    hi *= 2;
    tHi = totalAt(hi);
  }

  if (tHi == null || tHi < target - 0.02) {
    return {
      summary: failSummary(
        "invalid",
        "Hedef toplam için makine bedeli aralığı bulunamadı.",
        extraSplit.total,
      ),
      rows: [],
      solvedMachinePrice: null,
    };
  }

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const tMid = totalAt(mid);
    if (tMid == null) {
      lo = mid;
      continue;
    }
    if (tMid > target) hi = mid;
    else lo = mid;
  }

  const solved = (lo + hi) / 2;
  const finalPlan = computeLeasingPaymentPlan({ ...base, machinePrice: solved });

  return {
    ...finalPlan,
    solvedMachinePrice: solved,
  };
}

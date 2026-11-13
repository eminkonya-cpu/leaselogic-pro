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

function fail(
  status: LeasingPlanSummary["status"],
  message: string,
  extraTotal: number,
): LeasingPlanReverseResult {
  return {
    summary: failSummary(status, message, extraTotal),
    rows: [],
    solvedMachinePrice: null,
  };
}

function solveReverseAtTarget(
  rawForPlan: LeasingPlanReverseInput,
  target: number,
  extraTotal: number,
): LeasingPlanReverseResult {
  const downPayment = num(rawForPlan.downPayment);
  const financingSupport = num(rawForPlan.financingSupport);
  const base: LeasingPlanInput = { ...rawForPlan, machinePrice: 0 };

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
    return fail(
      "invalid",
      "Bu parametrelerle geri hesaplama yapılamıyor.",
      extraTotal,
    );
  }

  if (tLo > target + 0.02) {
    return fail(
      "invalid",
      "Hedef toplam çok düşük; mevcut peşinat, balon ve ödeme planı ile bu tutara ulaşılamaz.",
      extraTotal,
    );
  }

  let tHi = totalAt(hi);
  for (let i = 0; i < 48 && (tHi == null || tHi < target); i++) {
    hi *= 2;
    tHi = totalAt(hi);
  }

  if (tHi == null || tHi < target - 0.02) {
    return fail(
      "invalid",
      "Hedef toplam için makine bedeli aralığı bulunamadı.",
      extraTotal,
    );
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

/**
 * Hedef müşteri toplam ödemesinden makine bedelini çözer.
 * Taksit her zaman (hedef − peşinat − balonlar) / ödemeli aydır.
 * Kasko / masraf müşteri taksitine eklenmez; katkı payına (vade farkı)
 * yansır — hedefi masrafla şişirmeden BNP tarzı katkıya yaklaşır.
 */
export function computeLeasingPaymentPlanReverse(
  raw: LeasingPlanReverseInput,
): LeasingPlanReverseResult {
  const target = num(raw.targetCustomerTotal);
  const downPayment = num(raw.downPayment);
  const extraSplit = splitExtraCosts(
    {
      fileFee: num(raw.fileFee),
      totalInsurance: num(raw.totalInsurance),
      importCost: num(raw.importCost),
      attachmentCost: num(raw.attachmentCost),
    },
    resolveExtraCostModes(raw.extraCostModes),
  );
  const rawForPlan = { ...raw, spreadCashExtrasOnInstallments: true };

  if (target <= 0) {
    return fail(
      "incomplete",
      "Hedef müşteri toplam ödemesini girin.",
      extraSplit.total,
    );
  }

  const minCustomer = downPayment;
  if (target < minCustomer - 1e-6) {
    return fail(
      "invalid",
      "Hedef toplam peşinattan düşük olamaz.",
      extraSplit.total,
    );
  }

  const customer = solveReverseAtTarget(rawForPlan, target, extraSplit.total);
  if (customer.summary.status !== "ok" || extraSplit.total <= 1e-6) {
    return customer;
  }

  const inner = solveReverseAtTarget(
    rawForPlan,
    target + extraSplit.total,
    extraSplit.total,
  );
  if (inner.summary.status !== "ok" || inner.solvedMachinePrice == null) {
    return customer;
  }

  return {
    ...customer,
    solvedMachinePrice: inner.solvedMachinePrice - extraSplit.total,
    summary: {
      ...customer.summary,
      totalFinanceInterest: inner.summary.totalFinanceInterest,
    },
  };
}

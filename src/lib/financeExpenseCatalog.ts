import { EMPTY_EXPENSES } from "@/components/finance/ExpenseInputCard";
import type { PaymentFrequency } from "@/components/finance/PaymentFrequencySelector";
import {
  computeKaskoFromMachinePrice,
  type ServiceFeeModes,
} from "@/lib/catalogServiceFees";

export type FinanceExpenses = typeof EMPTY_EXPENSES;

/** Vade süresini kasko hesabı için ay cinsinden döndürür. */
export function termToKaskoMonths(
  term: number,
  paymentFrequency: PaymentFrequency,
): number {
  const t = Math.max(0, Math.trunc(Number(term) || 0));
  if (paymentFrequency === "annual") {
    if (t <= 0) return 0;
    return Math.min(36, t * 12);
  }
  if (t <= 0) return 0;
  return Math.min(48, t);
}

/** Makine × % → yıllık tutar (12 aylık). */
export function computeKaskoAnnualPremium(
  machinePriceEuro: number,
  percent: number,
): number {
  return computeKaskoFromMachinePrice(machinePriceEuro, percent);
}

/** (Makine × %) / 12 — bir aylık kasko payı. */
export function computeKaskoMonthlyPremium(
  machinePriceEuro: number,
  percent: number,
): number {
  const annual = computeKaskoAnnualPremium(machinePriceEuro, percent);
  if (annual <= 0) return 0;
  return annual / 12;
}

/**
 * Toplam kasko = (makine bedeli × % / 100) / 12 × vade (ay).
 */
export function computeKaskoTotalForTerm(
  machinePriceEuro: number,
  percent: number,
  term: number,
  paymentFrequency: PaymentFrequency,
): number {
  const months = termToKaskoMonths(term, paymentFrequency);
  if (months <= 0) return 0;
  const monthly = computeKaskoMonthlyPremium(machinePriceEuro, percent);
  return Math.round(monthly * months * 100) / 100;
}

export function sumKaskoExpenses(expenses: FinanceExpenses): number {
  return (
    Number(expenses.kasko1 ?? 0) +
    Number(expenses.kasko2 ?? 0) +
    Number(expenses.kasko3 ?? 0) +
    Number(expenses.kasko4 ?? 0)
  );
}

export function clearKaskoExpenses(expenses: FinanceExpenses): FinanceExpenses {
  return {
    ...expenses,
    kasko1: 0,
    kasko2: 0,
    kasko3: 0,
    kasko4: 0,
  };
}

/** Aylık pay × vade; kasko1..kaskoN alanlarına 12’şer ay (son kısmi yıl dahil). */
export function applyKaskoSplitToExpenses(
  expenses: FinanceExpenses,
  machinePriceEuro: number,
  percent: number,
  term: number,
  paymentFrequency: PaymentFrequency,
): FinanceExpenses {
  const next = clearKaskoExpenses(expenses);
  const months = termToKaskoMonths(term, paymentFrequency);
  const monthly = computeKaskoMonthlyPremium(machinePriceEuro, percent);
  if (months <= 0 || monthly <= 0) return next;

  const maxField = paymentFrequency === "annual" ? 3 : 4;
  let remaining = months;
  for (let y = 1; y <= maxField && remaining > 0; y++) {
    const chunkMonths = Math.min(12, remaining);
    const key = `kasko${y}` as keyof FinanceExpenses;
    next[key] = Math.round(monthly * chunkMonths * 100) / 100;
    remaining -= chunkMonths;
  }
  return next;
}

/** Tek tutarlı manuel kasko → 1. yıl alanına. */
export function applyManualKaskoTotal(
  expenses: FinanceExpenses,
  totalEuro: number,
): FinanceExpenses {
  const next = clearKaskoExpenses(expenses);
  next.kasko1 = Math.max(0, totalEuro);
  return next;
}

export function financeExpensesToPanelAmounts(expenses: FinanceExpenses) {
  return {
    totalInsurance: sumKaskoExpenses(expenses),
    fileFee: Number(expenses.leasingCost ?? 0),
    importCost: Number(expenses.importCost ?? 0),
    attachmentCost: 0,
  };
}

/** Mod ve liste değerlerine göre expenses güncelle. */
export function syncFinanceExpensesFromModes(args: {
  expenses: FinanceExpenses;
  modes: ServiceFeeModes;
  amounts: ReturnType<typeof financeExpensesToPanelAmounts>;
  machinePriceEuro: number;
  kaskoPercent: number;
  fileFeeEuro: number;
  importCostEuro: number;
  term: number;
  paymentFrequency: PaymentFrequency;
}): FinanceExpenses {
  let next = { ...args.expenses };

  if (args.modes.kasko === "auto") {
    next = applyKaskoSplitToExpenses(
      next,
      args.machinePriceEuro,
      args.kaskoPercent,
      args.term,
      args.paymentFrequency,
    );
  } else if (args.modes.kasko === "manual") {
    next = applyManualKaskoTotal(next, args.amounts.totalInsurance);
  } else {
    next = clearKaskoExpenses(next);
  }

  if (args.modes.fileFee === "auto") {
    next.leasingCost = args.fileFeeEuro;
  } else if (args.modes.fileFee === "manual") {
    next.leasingCost = args.amounts.fileFee;
  } else {
    next.leasingCost = 0;
  }

  if (args.modes.importCost === "auto") {
    next.importCost = args.importCostEuro;
  } else if (args.modes.importCost === "manual") {
    next.importCost = args.amounts.importCost;
  } else {
    next.importCost = 0;
  }

  return next;
}

import type { CatalogLine } from "@/lib/catalogPrices";
import { splitExtraExpenseAmounts } from "@/lib/expenseSummaryLines";
import {
  calculatePMT,
  generateAmortization,
  type AmortizationRow,
} from "@/lib/financeCalculations";
import type { CalcSlice } from "@/lib/forwardDisplayMetrics";
import type { ExtraCostModes } from "@/lib/leasingPaymentPlan";

export function sumForwardExtraExpenses(
  expenses: Record<string, number | undefined>,
): number {
  return (
    Number(expenses.kasko1 ?? 0) +
    Number(expenses.kasko2 ?? 0) +
    Number(expenses.kasko3 ?? 0) +
    Number(expenses.kasko4 ?? 0) +
    Number(expenses.leasingCost ?? 0) +
    Number(expenses.importCost ?? 0)
  );
}

export type MonthlyForwardCalcInput = {
  machinePriceEuro: number;
  euroRate: number;
  termMonths: number;
  euroInterest: number;
  tlInterest: number;
  downPaymentEuro: number;
  financingSupportEuro?: number;
  catalogTotalEuro: number;
  catalogLines: CatalogLine[];
  expenses: Record<string, number | undefined>;
  computedRates: number[];
  extraCostModes?: Partial<ExtraCostModes>;
};

const ALL_FINANCED_MODES: ExtraCostModes = {
  fileFee: "financed",
  totalInsurance: "financed",
  importCost: "financed",
  attachmentCost: "financed",
};

function resolveForwardAllInModes(
  partial?: Partial<ExtraCostModes>,
): ExtraCostModes {
  if (!partial) return ALL_FINANCED_MODES;
  return { ...ALL_FINANCED_MODES, ...partial };
}

/** Verilmezse tüm ekler finanse (eski Her Şey Dahil). */
export function splitForwardAllInExtras(args: {
  expenses: Record<string, number | undefined>;
  catalogTotalEuro: number;
  extraCostModes?: Partial<ExtraCostModes>;
}) {
  const modes = resolveForwardAllInModes(args.extraCostModes);
  const split = splitExtraExpenseAmounts(args.expenses);
  const expenseCash =
    (modes.totalInsurance === "cash" ? split.kasko : 0) +
    (modes.fileFee === "cash" ? split.masraflar : 0) +
    (modes.importCost === "cash" ? split.ithalat : 0);
  const expenseFinanced =
    (modes.totalInsurance === "financed" ? split.kasko : 0) +
    (modes.fileFee === "financed" ? split.masraflar : 0) +
    (modes.importCost === "financed" ? split.ithalat : 0);
  const catalog = Math.max(0, args.catalogTotalEuro);
  const catalogCash = modes.attachmentCost === "cash" ? catalog : 0;
  const catalogFinanced = modes.attachmentCost === "financed" ? catalog : 0;
  return {
    modes,
    expenseCash,
    expenseFinanced,
    catalogCash,
    catalogFinanced,
    cash: expenseCash + catalogCash,
    financedExtras: expenseFinanced + catalogFinanced,
  };
}

/** Aylık ileri hesaplama: Sade / Her Şey Dahil / Kampanya dilimlerinin ortak çekirdeği. */
export function computeMonthlyForwardCalc(
  input: MonthlyForwardCalcInput,
): CalcSlice & {
  baseMachineTL: number;
  totalExpensesTL: number;
  campaignRemainingEuro: number;
  campaignRemainingTL: number;
} {
  const {
    machinePriceEuro,
    euroRate,
    termMonths: term,
    euroInterest,
    tlInterest,
    downPaymentEuro,
    financingSupportEuro,
    catalogTotalEuro,
    catalogLines,
    expenses,
    computedRates,
  } = input;

  const financingSupport = Math.max(0, financingSupportEuro ?? 0);
  const machineWithCatalogEuro = machinePriceEuro + catalogTotalEuro;
  const priceTL = machineWithCatalogEuro * euroRate;
  const baseMachineTL = machinePriceEuro * euroRate;
  const downPaymentTL = downPaymentEuro * euroRate;
  const financingSupportTL = financingSupport * euroRate;

  const plainFinanceEuro = Math.max(
    0,
    machineWithCatalogEuro - downPaymentEuro - financingSupport,
  );
  const plainFinanceTL = Math.max(
    0,
    priceTL - downPaymentTL - financingSupportTL,
  );
  const plainMonthlyEuro = calculatePMT(plainFinanceEuro, euroInterest, term);
  const plainMonthlyTL = calculatePMT(plainFinanceTL, tlInterest, term);
  const plainTotalEuro =
    term > 0
      ? plainMonthlyEuro * term + downPaymentEuro
      : machineWithCatalogEuro;
  const plainTotalTL =
    term > 0 ? plainMonthlyTL * term + downPaymentTL : priceTL;
  const plainDiffEuro =
    term > 0 ? plainTotalEuro - machineWithCatalogEuro : 0;
  const plainDiffTL = term > 0 ? plainTotalTL - priceTL : 0;
  const plainScheduleEuro = generateAmortization(
    plainFinanceEuro,
    euroInterest,
    term,
  );
  const plainScheduleTL = generateAmortization(plainFinanceTL, tlInterest, term);

  const totalExpenses = sumForwardExtraExpenses(expenses);
  const totalExpensesTL = totalExpenses * euroRate;
  const extras = splitForwardAllInExtras({
    expenses,
    catalogTotalEuro,
    extraCostModes: input.extraCostModes,
  });
  const allInBaseEuro = machineWithCatalogEuro + totalExpenses;
  const allInBaseTL = priceTL + totalExpensesTL;
  const allInFinancedGoodsEuro = machinePriceEuro + extras.financedExtras;
  const allInFinancedGoodsTL = allInFinancedGoodsEuro * euroRate;
  const allInCashEuro = extras.cash;
  const allInCashTL = allInCashEuro * euroRate;
  const allInFinanceEuro = Math.max(
    0,
    allInFinancedGoodsEuro - downPaymentEuro - financingSupport,
  );
  const allInFinanceTL = Math.max(
    0,
    allInFinancedGoodsTL - downPaymentTL - financingSupportTL,
  );
  const allInMonthlyEuro = calculatePMT(allInFinanceEuro, euroInterest, term);
  const allInMonthlyTL = calculatePMT(allInFinanceTL, tlInterest, term);
  const allInTotalEuro =
    term > 0
      ? allInMonthlyEuro * term + downPaymentEuro + allInCashEuro
      : allInBaseEuro;
  const allInTotalTL =
    term > 0
      ? allInMonthlyTL * term + downPaymentTL + allInCashTL
      : allInBaseTL;
  const allInDiffEuro = term > 0 ? allInTotalEuro - allInBaseEuro : 0;
  const allInDiffTL = term > 0 ? allInTotalTL - allInBaseTL : 0;
  const allInScheduleEuro = generateAmortization(
    allInFinanceEuro,
    euroInterest,
    term,
  );
  const allInScheduleTL = generateAmortization(
    allInFinanceTL,
    tlInterest,
    term,
  );

  const campaignRemainingEuro = Math.max(
    0,
    allInFinancedGoodsEuro - downPaymentEuro - financingSupport,
  );
  const campaignRemainingTL = Math.max(
    0,
    allInFinancedGoodsTL - downPaymentTL - financingSupportTL,
  );
  const campaignMonthlyEuro = calculatePMT(campaignRemainingEuro, 0, term);
  const campaignMonthlyTL = calculatePMT(campaignRemainingTL, 0, term);
  const campaignScheduleEuro = generateAmortization(
    campaignRemainingEuro,
    0,
    term,
  );
  const campaignScheduleTL = generateAmortization(
    campaignRemainingTL,
    0,
    term,
  );

  const netMachineEuro = machinePriceEuro;
  const projRates = computedRates
    .slice(0, term)
    .map((r, i) => ({ month: i + 1, rate: r }));

  return {
    catalogLines,
    catalogTotalEuro,
    machineWithCatalogEuro,
    priceTL,
    netMachineEuro,
    totalExpenses,
    plainFinanceEuro,
    plainFinanceTL,
    plainMonthlyEuro,
    plainMonthlyTL,
    plainTotalEuro,
    plainTotalTL,
    plainDiffEuro,
    plainDiffTL,
    plainScheduleEuro,
    plainScheduleTL,
    allInMonthlyEuro,
    allInMonthlyTL,
    allInTotalEuro,
    allInTotalTL,
    allInDiffEuro,
    allInDiffTL,
    allInFinanceEuro,
    allInFinanceTL,
    allInBaseEuro,
    allInBaseTL,
    allInScheduleEuro,
    allInScheduleTL,
    campaignMonthlyEuro,
    campaignMonthlyTL,
    campaignScheduleEuro,
    campaignScheduleTL,
    downPaymentTL,
    projRates,
    baseMachineTL,
    totalExpensesTL,
    campaignRemainingEuro,
    campaignRemainingTL,
  };
}

export function amortizationInstallmentSum(rows: AmortizationRow[]): number {
  return rows.reduce((s, r) => s + r.payment, 0);
}

/** Özet panel: makine + katalog + (ek) + vade farkı = toplam ödeme. */
export function forwardSummaryPartsReconcile(args: {
  machinePriceEuro: number;
  catalogLines: CatalogLine[];
  includeExpenses: boolean;
  otherExpensesEuro: number;
  vadeFarkiEuro: number;
  totalEuro: number;
}): boolean {
  const attachment = args.catalogLines
    .filter((l) => l.categoryId === "attachment")
    .reduce((s, l) => s + l.priceEuro, 0);
  const maintenance = args.catalogLines
    .filter((l) => l.categoryId === "maintenance")
    .reduce((s, l) => s + l.priceEuro, 0);
  const equipment = args.catalogLines
    .filter((l) => l.categoryId === "equipment")
    .reduce((s, l) => s + l.priceEuro, 0);
  const catalogOther = args.catalogLines
    .filter((l) => l.categoryId === "other")
    .reduce((s, l) => s + l.priceEuro, 0);
  const sum =
    args.machinePriceEuro +
    attachment +
    maintenance +
    equipment +
    catalogOther +
    (args.includeExpenses ? args.otherExpensesEuro : 0) +
    Math.max(0, args.vadeFarkiEuro);
  return Math.abs(sum - args.totalEuro) < 0.02;
}

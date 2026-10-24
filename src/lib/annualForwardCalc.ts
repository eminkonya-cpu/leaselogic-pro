import {
  resolveCatalogSelection,
  type CatalogCategory,
  type CatalogSelection,
} from "@/lib/catalogPrices";
import {
  calculateAnnualPMT,
  expandAnnualScheduleToMonthlyPdfRows,
  generateAnnualAmortization,
} from "@/lib/financeCalculations";
import { sumForwardExtraExpenses } from "@/lib/forwardCalculatorCore";
import type { CalcSlice } from "@/lib/forwardDisplayMetrics";

export function clampAnnualTermYears(v: string | number) {
  const raw =
    typeof v === "string"
      ? Number(String(v).replace(",", "."))
      : Number(v);
  const n = Math.trunc(Number.isFinite(raw) ? raw : 0);
  return Math.min(3, Math.max(0, n));
}

export type AnnualForwardCalcInput = {
  machinePriceEuro: number;
  euroRate: number;
  term: string | number;
  euroInterest: number;
  tlInterest: number;
  downPaymentEuro: number;
  financingSupportEuro: number;
  expenses: Record<string, number | undefined>;
  catalogSelection: CatalogSelection;
  catalogCategories: CatalogCategory[];
  computedRates: number[];
};

export function computeAnnualForwardCalc(
  input: AnnualForwardCalcInput,
): CalcSlice & {
  baseMachineTL: number;
  pdfScheduleEuro: ReturnType<typeof expandAnnualScheduleToMonthlyPdfRows>;
  pdfScheduleTL: ReturnType<typeof expandAnnualScheduleToMonthlyPdfRows>;
  allInPdfScheduleEuro: ReturnType<typeof expandAnnualScheduleToMonthlyPdfRows>;
  allInPdfScheduleTL: ReturnType<typeof expandAnnualScheduleToMonthlyPdfRows>;
  totalExpensesTL: number;
  campaignRemainingEuro: number;
  campaignRemainingTL: number;
  campaignAnnualEuro: number;
  campaignAnnualTL: number;
  campaignPdfScheduleEuro: ReturnType<
    typeof expandAnnualScheduleToMonthlyPdfRows
  >;
  campaignPdfScheduleTL: ReturnType<
    typeof expandAnnualScheduleToMonthlyPdfRows
  >;
} {
  const {
    machinePriceEuro,
    euroRate,
    term,
    euroInterest,
    tlInterest,
    downPaymentEuro,
    financingSupportEuro,
    expenses,
    catalogSelection,
    catalogCategories,
    computedRates,
  } = input;

  const years = clampAnnualTermYears(term);
  const financingSupport = Math.max(0, Number(financingSupportEuro) || 0);
  const financingSupportTL = financingSupport * euroRate;
  const catalog = resolveCatalogSelection(
    catalogSelection,
    catalogCategories,
  );
  const machineWithCatalogEuro = machinePriceEuro + catalog.totalEuro;
  const priceTL = machineWithCatalogEuro * euroRate;
  const baseMachineTL = machinePriceEuro * euroRate;
  const downPaymentTL = downPaymentEuro * euroRate;
  const plainFinanceEuro = Math.max(
    0,
    machineWithCatalogEuro - downPaymentEuro - financingSupport,
  );
  const plainFinanceTL = Math.max(
    0,
    priceTL - downPaymentTL - financingSupportTL,
  );
  const plainAnnualEuro = calculateAnnualPMT(
    plainFinanceEuro,
    euroInterest,
    years,
  );
  const plainAnnualTL = calculateAnnualPMT(
    plainFinanceTL,
    tlInterest,
    years,
  );
  const plainTotalEuro =
    years > 0
      ? plainAnnualEuro * years + downPaymentEuro
      : machineWithCatalogEuro;
  const plainTotalTL =
    years > 0 ? plainAnnualTL * years + downPaymentTL : priceTL;
  const plainDiffEuro =
    years > 0 ? plainTotalEuro - machineWithCatalogEuro : 0;
  const plainDiffTL = years > 0 ? plainTotalTL - priceTL : 0;
  const plainScheduleEuro = generateAnnualAmortization(
    plainFinanceEuro,
    euroInterest,
    years,
  );
  const plainScheduleTL = generateAnnualAmortization(
    plainFinanceTL,
    tlInterest,
    years,
  );
  const pdfScheduleEuro = expandAnnualScheduleToMonthlyPdfRows(
    plainScheduleEuro,
    years,
  );
  const pdfScheduleTL = expandAnnualScheduleToMonthlyPdfRows(
    plainScheduleTL,
    years,
  );
  const totalExpenses = sumForwardExtraExpenses(expenses);
  const totalExpensesTL = totalExpenses * euroRate;
  const allInBaseEuro = machineWithCatalogEuro + totalExpenses;
  const allInBaseTL = priceTL + totalExpensesTL;
  const allInFinanceEuro = Math.max(
    0,
    allInBaseEuro - downPaymentEuro - financingSupport,
  );
  const allInFinanceTL = Math.max(
    0,
    allInBaseTL - downPaymentTL - financingSupportTL,
  );
  const allInAnnualEuro = calculateAnnualPMT(
    allInFinanceEuro,
    euroInterest,
    years,
  );
  const allInAnnualTL = calculateAnnualPMT(
    allInFinanceTL,
    tlInterest,
    years,
  );
  const allInTotalEuro =
    years > 0 ? allInAnnualEuro * years + downPaymentEuro : allInBaseEuro;
  const allInTotalTL =
    years > 0 ? allInAnnualTL * years + downPaymentTL : allInBaseTL;
  const allInDiffEuro = years > 0 ? allInTotalEuro - allInBaseEuro : 0;
  const allInDiffTL = years > 0 ? allInTotalTL - allInBaseTL : 0;
  const allInScheduleEuro = generateAnnualAmortization(
    allInFinanceEuro,
    euroInterest,
    years,
  );
  const allInScheduleTL = generateAnnualAmortization(
    allInFinanceTL,
    tlInterest,
    years,
  );
  const allInPdfScheduleEuro = expandAnnualScheduleToMonthlyPdfRows(
    allInScheduleEuro,
    years,
  );
  const allInPdfScheduleTL = expandAnnualScheduleToMonthlyPdfRows(
    allInScheduleTL,
    years,
  );
  const campaignRemainingEuro = Math.max(
    0,
    allInBaseEuro - downPaymentEuro - financingSupport,
  );
  const campaignRemainingTL = Math.max(
    0,
    allInBaseTL - downPaymentTL - financingSupportTL,
  );
  const campaignAnnualEuro = calculateAnnualPMT(
    campaignRemainingEuro,
    0,
    years,
  );
  const campaignAnnualTL = calculateAnnualPMT(
    campaignRemainingTL,
    0,
    years,
  );
  const campaignScheduleEuro = generateAnnualAmortization(
    campaignRemainingEuro,
    0,
    years,
  );
  const campaignScheduleTL = generateAnnualAmortization(
    campaignRemainingTL,
    0,
    years,
  );
  const campaignPdfScheduleEuro = expandAnnualScheduleToMonthlyPdfRows(
    campaignScheduleEuro,
    years,
  );
  const campaignPdfScheduleTL = expandAnnualScheduleToMonthlyPdfRows(
    campaignScheduleTL,
    years,
  );
  const netMachineEuro = machinePriceEuro;
  const projRates = Array.from({ length: years }, (_, i) => {
    const monthIdx = (i + 1) * 12 - 1;
    return {
      month: i + 1,
      rate: computedRates[monthIdx] ?? euroRate,
    };
  });

  return {
    catalogLines: catalog.lines,
    catalogTotalEuro: catalog.totalEuro,
    machineWithCatalogEuro,
    baseMachineTL,
    priceTL,
    downPaymentTL,
    plainFinanceEuro,
    plainFinanceTL,
    plainMonthlyEuro: plainAnnualEuro,
    plainMonthlyTL: plainAnnualTL,
    plainTotalEuro,
    plainTotalTL,
    plainDiffEuro,
    plainDiffTL,
    plainScheduleEuro,
    plainScheduleTL,
    pdfScheduleEuro,
    pdfScheduleTL,
    allInMonthlyEuro: allInAnnualEuro,
    allInMonthlyTL: allInAnnualTL,
    allInScheduleEuro,
    allInScheduleTL,
    allInPdfScheduleEuro,
    allInPdfScheduleTL,
    totalExpenses,
    totalExpensesTL,
    allInBaseEuro,
    allInBaseTL,
    allInFinanceEuro,
    allInFinanceTL,
    campaignRemainingEuro,
    campaignRemainingTL,
    campaignAnnualEuro,
    campaignAnnualTL,
    campaignScheduleEuro,
    campaignScheduleTL,
    campaignPdfScheduleEuro,
    campaignPdfScheduleTL,
    campaignMonthlyEuro: campaignAnnualEuro,
    campaignMonthlyTL: campaignAnnualTL,
    allInTotalEuro,
    allInTotalTL,
    allInDiffEuro,
    allInDiffTL,
    netMachineEuro,
    projRates,
  };
}

import type { CatalogLine } from "@/lib/catalogPrices";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { normalizeForwardTermMonths } from "@/lib/forwardTerm";

export type ForwardTabId = "campaign" | "plain" | "allin" | "advantage";

export function sumCatalogCategory(
  lines: CatalogLine[],
  categoryId: CatalogLine["categoryId"],
) {
  return lines
    .filter((l) => l.categoryId === categoryId)
    .reduce((s, l) => s + l.priceEuro, 0);
}

export function sumCatalogExceptMaintenance(lines: CatalogLine[]) {
  return lines
    .filter((l) => l.categoryId !== "maintenance")
    .reduce((s, l) => s + l.priceEuro, 0);
}

type CalcSlice = {
  catalogLines: CatalogLine[];
  catalogTotalEuro: number;
  machineWithCatalogEuro: number;
  priceTL: number;
  netMachineEuro: number;
  totalExpenses: number;
  plainFinanceEuro: number;
  plainFinanceTL: number;
  plainMonthlyEuro: number;
  plainMonthlyTL: number;
  plainTotalEuro: number;
  plainTotalTL: number;
  plainDiffEuro: number;
  plainDiffTL: number;
  plainScheduleEuro: AmortizationRow[];
  plainScheduleTL: AmortizationRow[];
  allInMonthlyEuro: number;
  allInMonthlyTL: number;
  allInTotalEuro: number;
  allInTotalTL: number;
  allInDiffEuro: number;
  allInDiffTL: number;
  allInFinanceEuro: number;
  allInFinanceTL: number;
  allInBaseEuro: number;
  allInBaseTL: number;
  allInScheduleEuro: AmortizationRow[];
  allInScheduleTL: AmortizationRow[];
  campaignMonthlyEuro: number;
  campaignMonthlyTL: number;
  campaignScheduleEuro: AmortizationRow[];
  campaignScheduleTL: AmortizationRow[];
  downPaymentTL: number;
  projRates: { month: number; rate: number }[];
};

export type { CalcSlice };

export function isPlainCatalogOnlyMode(
  activeTab: ForwardTabId,
  term: number | string,
) {
  return activeTab === "plain" && normalizeForwardTermMonths(term) <= 0;
}

export function getForwardDisplayMetrics(
  activeTab: ForwardTabId,
  calc: CalcSlice,
  params: {
    downPaymentEuro: number;
    euroRate: number;
    euroInterest: number;
    tlInterest: number;
    term: number | string;
  },
) {
  const attachment = sumCatalogCategory(calc.catalogLines, "attachment");
  const maintenance = sumCatalogCategory(calc.catalogLines, "maintenance");
  const equipment = sumCatalogCategory(calc.catalogLines, "equipment");
  const catalogOther = sumCatalogCategory(calc.catalogLines, "other");

  if (activeTab === "campaign") {
    return {
      monthlyEuro: calc.campaignMonthlyEuro,
      monthlyTl: calc.campaignMonthlyTL,
      totalEuro: calc.allInBaseEuro,
      totalTl: calc.allInBaseTL,
      vadeFarkiEuro: 0,
      vadeFarkiTl: 0,
      scheduleEuro: calc.campaignScheduleEuro,
      scheduleTl: calc.campaignScheduleTL,
      interestRateEuro: 0,
      interestRateTl: 0,
      financeEuro: calc.allInFinanceEuro,
      financeTl: calc.allInFinanceTL,
      includeExpenses: true,
      attachment,
      maintenance,
      equipment,
      catalogOther,
      otherExpenses: calc.totalExpenses,
      plainCatalogOnly: false,
    };
  }

  if (activeTab === "allin") {
    return {
      monthlyEuro: calc.allInMonthlyEuro,
      monthlyTl: calc.allInMonthlyTL,
      totalEuro: calc.allInTotalEuro,
      totalTl: calc.allInTotalTL,
      vadeFarkiEuro: calc.allInDiffEuro,
      vadeFarkiTl: calc.allInDiffTL,
      scheduleEuro: calc.allInScheduleEuro,
      scheduleTl: calc.allInScheduleTL,
      interestRateEuro: params.euroInterest,
      interestRateTl: params.tlInterest,
      financeEuro: calc.allInFinanceEuro,
      financeTl: calc.allInFinanceTL,
      includeExpenses: true,
      attachment,
      maintenance,
      equipment,
      catalogOther,
      otherExpenses: calc.totalExpenses,
      plainCatalogOnly: false,
    };
  }

  if (isPlainCatalogOnlyMode(activeTab, params.term)) {
    return {
      monthlyEuro: 0,
      monthlyTl: 0,
      totalEuro: calc.machineWithCatalogEuro,
      totalTl: calc.priceTL,
      vadeFarkiEuro: 0,
      vadeFarkiTl: 0,
      scheduleEuro: [],
      scheduleTl: [],
      interestRateEuro: params.euroInterest,
      interestRateTl: params.tlInterest,
      financeEuro: calc.plainFinanceEuro,
      financeTl: calc.plainFinanceTL,
      includeExpenses: false,
      attachment,
      maintenance,
      equipment,
      catalogOther,
      otherExpenses: 0,
      plainCatalogOnly: true,
    };
  }

  return {
    monthlyEuro: calc.plainMonthlyEuro,
    monthlyTl: calc.plainMonthlyTL,
    totalEuro: calc.plainTotalEuro,
    totalTl: calc.plainTotalTL,
    vadeFarkiEuro: calc.plainDiffEuro,
    vadeFarkiTl: calc.plainDiffTL,
    scheduleEuro: calc.plainScheduleEuro,
    scheduleTl: calc.plainScheduleTL,
    interestRateEuro: params.euroInterest,
    interestRateTl: params.tlInterest,
    financeEuro: calc.plainFinanceEuro,
    financeTl: calc.plainFinanceTL,
    includeExpenses: false,
    attachment,
    maintenance,
    equipment,
    catalogOther,
    otherExpenses: 0,
    plainCatalogOnly: false,
  };
}

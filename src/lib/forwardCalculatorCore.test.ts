import { describe, expect, it } from "vitest";
import type { CatalogLine } from "@/lib/catalogPrices";
import {
  amortizationInstallmentSum,
  computeMonthlyForwardCalc,
  forwardSummaryPartsReconcile,
  sumForwardExtraExpenses,
} from "@/lib/forwardCalculatorCore";
import { getForwardDisplayMetrics } from "@/lib/forwardDisplayMetrics";

const baseParams = {
  euroRate: 50,
  euroInterest: 6.8,
  tlInterest: 42,
  downPaymentEuro: 10_000,
};

const catalogLines: CatalogLine[] = [
  {
    categoryId: "attachment",
    categoryTitle: "Ataşman",
    itemId: "a1",
    itemLabel: "Fork",
    priceEuro: 5_000,
  },
  {
    categoryId: "equipment",
    categoryTitle: "Donanım",
    itemId: "e1",
    itemLabel: "Camera",
    priceEuro: 2_000,
  },
];

function runCalc(
  overrides: Partial<Parameters<typeof computeMonthlyForwardCalc>[0]> = {},
) {
  return computeMonthlyForwardCalc({
    machinePriceEuro: 100_000,
    termMonths: 36,
    catalogTotalEuro: 7_000,
    catalogLines,
    expenses: { kasko1: 1_300, kasko2: 0, kasko3: 0, kasko4: 0, leasingCost: 500, importCost: 200 },
    computedRates: Array.from({ length: 36 }, (_, i) => 50 + i * 0.1),
    ...baseParams,
    ...overrides,
  });
}

describe("forward segment calculations", () => {
  it("sums all kasko years and fees in Her Şey Dahil base", () => {
    const exp = {
      kasko1: 100,
      kasko2: 200,
      kasko3: 300,
      kasko4: 400,
      leasingCost: 50,
      importCost: 25,
    };
    expect(sumForwardExtraExpenses(exp)).toBe(1075);
  });

  it("Sade Makine: total = catalog base + vade farkı, taksitler katalog dahil anapara", () => {
    const calc = runCalc();
    const plain = getForwardDisplayMetrics("plain", calc, {
      ...baseParams,
      term: 36,
    });

    expect(plain.includeExpenses).toBe(false);
    expect(calc.plainFinanceEuro).toBe(100_000 + 7_000 - 10_000);
    expect(calc.plainTotalEuro).toBeCloseTo(
      calc.plainMonthlyEuro * 36 + 10_000,
      2,
    );
    expect(calc.plainDiffEuro).toBeCloseTo(
      calc.plainTotalEuro - calc.machineWithCatalogEuro,
      2,
    );
    expect(
      amortizationInstallmentSum(calc.plainScheduleEuro) + 10_000,
    ).toBeCloseTo(calc.plainTotalEuro, 2);
    expect(plain.totalEuro).toBe(calc.plainTotalEuro);
    expect(
      forwardSummaryPartsReconcile({
        machinePriceEuro: 100_000,
        catalogLines,
        includeExpenses: false,
        otherExpensesEuro: calc.totalExpenses,
        vadeFarkiEuro: plain.vadeFarkiEuro,
        totalEuro: plain.totalEuro,
      }),
    ).toBe(true);
  });

  it("Her Şey Dahil: ek masraflar finanse, toplam > Sade (aynı faiz)", () => {
    const calc = runCalc();
    const plain = getForwardDisplayMetrics("plain", calc, {
      ...baseParams,
      term: 36,
    });
    const allin = getForwardDisplayMetrics("allin", calc, {
      ...baseParams,
      term: 36,
    });

    expect(allin.includeExpenses).toBe(true);
    expect(calc.allInBaseEuro).toBe(
      calc.machineWithCatalogEuro + calc.totalExpenses,
    );
    expect(calc.allInTotalEuro).toBeGreaterThan(calc.plainTotalEuro);
    expect(allin.totalEuro).toBe(calc.allInTotalEuro);
    expect(allin.vadeFarkiEuro).toBeCloseTo(calc.allInDiffEuro, 2);
    expect(
      forwardSummaryPartsReconcile({
        machinePriceEuro: 100_000,
        catalogLines,
        includeExpenses: true,
        otherExpensesEuro: calc.totalExpenses,
        vadeFarkiEuro: allin.vadeFarkiEuro,
        totalEuro: allin.totalEuro,
      }),
    ).toBe(true);
    expect(allin.monthlyEuro).toBeGreaterThan(plain.monthlyEuro);
  });

  it("Sade Makine vade 0: sadece makine+katalog, taksit yok", () => {
    const calc = runCalc({ termMonths: 0 });
    const plain = getForwardDisplayMetrics("plain", calc, {
      ...baseParams,
      term: 0,
    });

    expect(plain.plainCatalogOnly).toBe(true);
    expect(plain.monthlyEuro).toBe(0);
    expect(plain.totalEuro).toBe(107_000);
    expect(plain.vadeFarkiEuro).toBe(0);
  });

  it("Sade Makine 24 ay: peşinat ve faiz uygulanır (regresyon)", () => {
    const calc = computeMonthlyForwardCalc({
      machinePriceEuro: 100_000,
      euroRate: 51.5,
      termMonths: 24,
      euroInterest: 6.25,
      tlInterest: 42,
      downPaymentEuro: 20_000,
      catalogTotalEuro: 4_500,
      catalogLines,
      expenses: {},
      computedRates: Array.from({ length: 24 }, () => 51.5),
    });
    const plain = getForwardDisplayMetrics("plain", calc, {
      ...baseParams,
      downPaymentEuro: 20_000,
      euroInterest: 6.25,
      term: 24,
    });

    expect(plain.plainCatalogOnly).toBe(false);
    expect(plain.vadeFarkiEuro).toBeGreaterThan(0);
    expect(plain.monthlyEuro).toBeGreaterThan(0);
    expect(plain.totalEuro).toBeGreaterThan(104_500);
    expect(plain.totalEuro).toBeCloseTo(calc.plainTotalEuro, 2);
  });

  it("financing support lowers customer total vs no support", () => {
    const base = runCalc();
    const supported = runCalc({ expenses: {} });
    const withSupport = computeMonthlyForwardCalc({
      machinePriceEuro: 100_000,
      euroRate: 50,
      termMonths: 36,
      euroInterest: 6.8,
      tlInterest: 42,
      downPaymentEuro: 10_000,
      financingSupportEuro: 5_000,
      catalogTotalEuro: 7_000,
      catalogLines,
      expenses: {},
      computedRates: Array.from({ length: 36 }, (_, i) => 50 + i * 0.1),
    });
    expect(withSupport.plainTotalEuro).toBeLessThan(base.plainTotalEuro);
  });

  it("Her Şey Dahil vade 0: toplam = taban (peşinat taksit yok)", () => {
    const calc = runCalc({ termMonths: 0 });
    const allin = getForwardDisplayMetrics("allin", calc, {
      ...baseParams,
      term: 0,
    });

    expect(allin.totalEuro).toBe(calc.allInBaseEuro);
    expect(allin.monthlyEuro).toBe(0);
  });
});

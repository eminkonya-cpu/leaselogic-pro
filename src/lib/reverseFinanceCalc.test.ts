import { describe, expect, it } from "vitest";
import {
  computeReverseFinanceLeg,
  parseReverseInterestPct,
  resolveReverseInterestPct,
} from "@/lib/reverseFinanceCalc";

describe("reverse financing support", () => {
  it("increases net machine for same customer total", () => {
    const base = computeReverseFinanceLeg({
      allInTotal: 120_000,
      downPayment: 10_000,
      annualRatePct: 6.5,
      term: 24,
      totalExpenses: 0,
      catalogTotal: 0,
      paymentMode: "monthly",
    });
    const supported = computeReverseFinanceLeg({
      allInTotal: 120_000,
      downPayment: 10_000,
      financingSupport: 5_000,
      annualRatePct: 6.5,
      term: 24,
      totalExpenses: 0,
      catalogTotal: 0,
      paymentMode: "monthly",
    });
    expect(supported.displayNetMachine).toBeGreaterThan(
      base.displayNetMachine,
    );
  });

  it("vade farkı 24 ay %6.5 ile net makineden düşülür", () => {
    const catalog = 3_000 + 2_500 + 2_000 + 200 + 500;
    const zero = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      annualRatePct: 0,
      term: 24,
      totalExpenses: 6_670,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    const withRate = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      annualRatePct: 6.5,
      term: 24,
      totalExpenses: 6_670,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    expect(zero.interestDiff).toBeCloseTo(0, 2);
    expect(zero.displayNetMachine).toBeCloseTo(115_130, 0);
    expect(withRate.interestDiff).toBeGreaterThan(5_000);
    expect(withRate.displayNetMachine).toBeLessThan(zero.displayNetMachine - 1_000);
  });

  it("vade 0: finansman yok, opsiyon düşer, destek neti artırır", () => {
    const catalog = 4_500;
    const base = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      annualRatePct: 0,
      term: 0,
      totalExpenses: 1_600,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    const supported = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      financingSupport: 3_000,
      annualRatePct: 0,
      term: 0,
      totalExpenses: 1_600,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    expect(base.installment).toBe(0);
    expect(base.interestDiff).toBe(0);
    expect(base.displayNetMachine).toBeCloseTo(130_000 - 1_600 - catalog, 2);
    expect(supported.interestDiff).toBe(0);
    expect(supported.displayNetMachine).toBeCloseTo(
      base.displayNetMachine + 3_000,
      2,
    );
  });

  it("boş faiz oranını 6.5 kabul eder", () => {
    expect(resolveReverseInterestPct(0, 6.5)).toBe(6.5);
    expect(resolveReverseInterestPct("6,5", 6.5)).toBe(6.5);
    expect(resolveReverseInterestPct(8.5, 6.5)).toBe(8.5);
  });

  it("kutudaki boş faiz 0 kalır, 6.5 yazılmaz", () => {
    expect(parseReverseInterestPct(0)).toBe(0);
    expect(parseReverseInterestPct("")).toBe(0);
    expect(parseReverseInterestPct("6,5")).toBe(6.5);
  });

  it("faiz 0: finansman yok, destek neti artırır", () => {
    const catalog = 4_500;
    const base = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      annualRatePct: 0,
      term: 24,
      totalExpenses: 1_600,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    const supported = computeReverseFinanceLeg({
      allInTotal: 130_000,
      downPayment: 0,
      financingSupport: 3_000,
      annualRatePct: 0,
      term: 24,
      totalExpenses: 1_600,
      catalogTotal: catalog,
      paymentMode: "monthly",
    });
    expect(base.interestDiff).toBe(0);
    expect(base.displayNetMachine).toBeCloseTo(130_000 - 1_600 - catalog, 2);
    expect(supported.displayNetMachine).toBeCloseTo(
      base.displayNetMachine + 3_000,
      2,
    );
  });
});

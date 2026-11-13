import { describe, expect, it } from "vitest";
import {
  computeReverseFinanceLeg,
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

  it("boş faiz oranını 6.5 kabul eder", () => {
    expect(resolveReverseInterestPct(0, 6.5)).toBe(6.5);
    expect(resolveReverseInterestPct("6,5", 6.5)).toBe(6.5);
    expect(resolveReverseInterestPct(8.5, 6.5)).toBe(8.5);
  });
});

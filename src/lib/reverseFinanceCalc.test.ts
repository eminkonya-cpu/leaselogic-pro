import { describe, expect, it } from "vitest";
import { computeReverseFinanceLeg } from "@/lib/reverseFinanceCalc";

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
});

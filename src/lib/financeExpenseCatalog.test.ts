import { describe, expect, it } from "vitest";
import {
  applyKaskoSplitToExpenses,
  computeKaskoMonthlyPremium,
  computeKaskoTotalForTerm,
  sumKaskoExpenses,
} from "@/lib/financeExpenseCatalog";
import { EMPTY_EXPENSES } from "@/components/finance/ExpenseInputCard";

describe("kasko by term months", () => {
  const machine = 100_000;
  const pct = 1.3;

  it("monthly premium is annual / 12", () => {
    expect(computeKaskoMonthlyPremium(machine, pct)).toBeCloseTo(1300 / 12, 5);
  });

  it("24 and 25 months produce different totals", () => {
    const t24 = computeKaskoTotalForTerm(machine, pct, 24, "monthly");
    const t25 = computeKaskoTotalForTerm(machine, pct, 25, "monthly");
    expect(t24).toBeCloseTo((1300 / 12) * 24, 2);
    expect(t25).toBeCloseTo((1300 / 12) * 25, 2);
    expect(t25).toBeGreaterThan(t24);
  });

  it("splits 25 months across kasko year fields (12+12+1)", () => {
    const monthly = computeKaskoMonthlyPremium(machine, pct);
    const next = applyKaskoSplitToExpenses(
      EMPTY_EXPENSES,
      machine,
      pct,
      25,
      "monthly",
    );
    expect(next.kasko1).toBeCloseTo(monthly * 12, 2);
    expect(next.kasko2).toBeCloseTo(monthly * 12, 2);
    expect(next.kasko3).toBeCloseTo(monthly * 1, 2);
    expect(sumKaskoExpenses(next)).toBeCloseTo(monthly * 25, 2);
  });
});

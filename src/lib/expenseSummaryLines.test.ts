import { describe, expect, it } from "vitest";
import {
  presentExpenseSummaryLines,
  scaleExpenseAmounts,
  splitExtraExpenseAmounts,
} from "@/lib/expenseSummaryLines";

describe("splitExtraExpenseAmounts", () => {
  it("keeps kasko, masraflar and ithalat as separate amounts", () => {
    expect(
      splitExtraExpenseAmounts({
        kasko1: 1300,
        kasko2: 900,
        kasko3: 400,
        kasko4: 0,
        leasingCost: 450,
        importCost: 350,
      }),
    ).toEqual({
      kasko: 2600,
      masraflar: 450,
      ithalat: 350,
    });
  });
});

describe("presentExpenseSummaryLines", () => {
  it("omits zero lines so only selected expenses appear", () => {
    expect(
      presentExpenseSummaryLines({ kasko: 0, masraflar: 0, ithalat: 350 }),
    ).toEqual([{ label: "İthalat", value: 350 }]);
  });

  it("scales for TRY display without mixing labels", () => {
    const scaled = scaleExpenseAmounts(
      { kasko: 100, masraflar: 0, ithalat: 50 },
      40,
    );
    expect(presentExpenseSummaryLines(scaled)).toEqual([
      { label: "Kasko", value: 4000 },
      { label: "İthalat", value: 2000 },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import type { CatalogLine } from "@/lib/catalogPrices";
import {
  buildDetailedReverseReportRows,
  buildReverseStitchSummaryRows,
} from "@/lib/reverseSummaryReport";

describe("buildDetailedReverseReportRows", () => {
  it("collapses yearly kasko into a single line", () => {
    const rows = buildDetailedReverseReportRows({
      catalogLines: [],
      expenses: {
        kasko1: 1300,
        kasko2: 900,
        kasko3: 400,
        kasko4: 0,
        leasingCost: 450,
        importCost: 350,
      },
      interestDiff: 5000,
      catalogAmount: (line) => line.priceEuro,
      expenseAmount: (v) => v,
    });

    expect(rows.filter((r) => r.label.toLowerCase().includes("kasko"))).toEqual([
      { label: "Kasko", value: 2600 },
    ]);
    expect(rows.find((r) => r.label === "Masraflar")?.value).toBe(450);
    expect(rows.find((r) => r.label === "İthalat")?.value).toBe(350);
    expect(rows.find((r) => r.label === "Vade farkı")?.value).toBe(5000);
    expect(rows.find((r) => r.label === "Katkı payı")?.value).toBe(8050);
    expect(rows.map((r) => r.label)).toEqual([
      "Kasko",
      "Masraflar",
      "Vade farkı",
      "Katkı payı",
      "İthalat",
    ]);
  });
});

describe("buildReverseStitchSummaryRows", () => {
  it("uses kasko bundle label instead of katkı payı", () => {
    const lines: CatalogLine[] = [];
    const rows = buildReverseStitchSummaryRows({
      allInTotal: 150000,
      expenseAmounts: { kasko: 4550, masraflar: 450, ithalat: 350 },
      interestDiff: 8000,
      catalogLines: lines,
      catalogAmount: (line) => line.priceEuro,
      displayNetMachine: 136650,
    });
    expect(rows.find((r) => r.label === "Kasko ve masraflar")).toBeUndefined();
    expect(rows.find((r) => r.label === "Kasko")?.value).toBe(-4550);
    expect(rows.find((r) => r.label === "Masraflar")?.value).toBe(-450);
    expect(rows.find((r) => r.label === "Katkı payı")?.value).toBe(-(4550 + 450 + 8000));
    expect(rows.find((r) => r.label === "İthalat")?.value).toBe(-350);
  });

  it("lists only selected expense lines", () => {
    const rows = buildReverseStitchSummaryRows({
      allInTotal: 150000,
      expenseAmounts: { kasko: 0, masraflar: 0, ithalat: 350 },
      interestDiff: 8000,
      catalogLines: [],
      catalogAmount: (line) => line.priceEuro,
      displayNetMachine: 141650,
    });
    expect(rows.map((r) => r.label)).toEqual([
      "Makine fiyatı",
      "Vade farkı",
      "Katkı payı",
      "İthalat",
      "Net makine bedeli (KDV hariç)",
    ]);
  });
});

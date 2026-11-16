import { describe, expect, it } from "vitest";
import type { CatalogLine } from "@/lib/catalogPrices";
import {
  buildForwardPaymentPlanExtraLines,
  buildForwardStitchSummaryRows,
} from "@/lib/forwardSummaryRows";

describe("buildForwardStitchSummaryRows", () => {
  const lines: CatalogLine[] = [
    {
      categoryId: "attachment",
      categoryTitle: "Ataşman",
      itemId: "1",
      itemLabel: "Yeni Uzun Kova",
      priceEuro: 3000,
    },
    {
      categoryId: "maintenance",
      categoryTitle: "Bakım",
      itemId: "2",
      itemLabel: "500 saat",
      priceEuro: 1000,
    },
  ];

  it("shows one amount per row with selections in parentheses", () => {
    const rows = buildForwardStitchSummaryRows({
      machine: 100_000,
      catalogLines: lines,
      catalogAmount: (l) => l.priceEuro,
      includeExpenses: true,
      expenseAmounts: { kasko: 5400, masraflar: 450, ithalat: 350 },
      vadeFarki: 500,
      totalPrimary: 110_700,
    });

    expect(rows.find((r) => r.label.startsWith("Ataşman toplamı"))?.label).toBe(
      "Ataşman toplamı (Yeni Uzun Kova)",
    );
    expect(rows.find((r) => r.label.startsWith("Bakım paketi"))?.label).toBe(
      "Bakım paketi (500 saat)",
    );
    expect(rows.find((r) => r.label === "Kasko")?.value).toBe(5400);
    expect(rows.find((r) => r.label === "Masraflar")?.value).toBe(450);
    expect(rows.find((r) => r.label === "Finansman maliyeti (vade farkı)")?.value).toBe(500);
    expect(rows.find((r) => r.label === "Katkı payı")?.value).toBe(6350);
    expect(rows.find((r) => r.label === "İthalat")?.value).toBe(350);
    expect(rows.find((r) => r.label.includes("Ek masraflar"))).toBeUndefined();
    expect(
      rows.every((r) => r.subRows == null || r.subRows.length === 0),
    ).toBe(true);
  });

  it("adds Peşin / Plana to extras when payment modes are set", () => {
    const rows = buildForwardStitchSummaryRows({
      machine: 100_000,
      catalogLines: lines,
      catalogAmount: (l) => l.priceEuro,
      includeExpenses: true,
      expenseAmounts: { kasko: 5400, masraflar: 450, ithalat: 350 },
      extraCostModes: {
        totalInsurance: "financed",
        fileFee: "financed",
        importCost: "cash",
        attachmentCost: "cash",
      },
      vadeFarki: 500,
      totalPrimary: 110_700,
    });
    expect(rows.find((r) => r.label.startsWith("Ataşman toplamı"))?.label).toContain(
      "· Peşin",
    );
    expect(rows.find((r) => r.label === "Kasko · Plana")?.value).toBe(5400);
    expect(rows.find((r) => r.label === "Masraflar · Plana")?.value).toBe(450);
    expect(rows.find((r) => r.label === "İthalat · Peşin")?.value).toBe(350);
  });

  it("lists only selected expense lines", () => {
    const rows = buildForwardStitchSummaryRows({
      machine: 100_000,
      catalogLines: [],
      catalogAmount: (l) => l.priceEuro,
      includeExpenses: true,
      expenseAmounts: { kasko: 0, masraflar: 0, ithalat: 350 },
      vadeFarki: 0,
      totalPrimary: 100_350,
    });
    expect(rows.map((r) => r.label)).toEqual([
      "Makine bedeli",
      "İthalat",
      "Toplam",
    ]);
  });

  it("shows Fabrika and MAATS separately on stitch", () => {
    const rows = buildForwardStitchSummaryRows({
      machine: 100_000,
      catalogLines: [],
      catalogAmount: (l) => l.priceEuro,
      includeExpenses: false,
      expenseAmounts: { kasko: 0, masraflar: 0, ithalat: 0 },
      vadeFarki: 0,
      financingSupport: 3000,
      supportSplit: { factory: 2000, maats: 1000 },
      totalPrimary: 97_000,
    });
    expect(rows.find((r) => r.label === "Fabrika desteği")?.value).toBe(-2000);
    expect(rows.find((r) => r.label === "MAATS desteği")?.value).toBe(-1000);
    expect(rows.find((r) => r.label === "Finansman desteği")).toBeUndefined();
  });
});

describe("buildForwardPaymentPlanExtraLines", () => {
  it("keeps labels clean and puts Peşin/Plana on modeLabel", () => {
    const lines: CatalogLine[] = [
      {
        categoryId: "attachment",
        categoryTitle: "Ataşman",
        itemId: "1",
        itemLabel: "Kova",
        priceEuro: 3000,
      },
    ];
    const rows = buildForwardPaymentPlanExtraLines({
      catalogLines: lines,
      catalogAmount: (l) => l.priceEuro,
      includeExpenses: true,
      expenseAmounts: { kasko: 1000, masraflar: 400, ithalat: 200 },
      extraCostModes: {
        totalInsurance: "financed",
        fileFee: "financed",
        importCost: "cash",
        attachmentCost: "cash",
      },
    });
    expect(rows.find((r) => r.label.startsWith("Ataşman"))?.modeLabel).toBe(
      "Peşin",
    );
    expect(rows.find((r) => r.label === "Kasko")?.modeLabel).toBe("Plana");
    expect(rows.find((r) => r.label === "İthalat")?.modeLabel).toBe("Peşin");
  });
});

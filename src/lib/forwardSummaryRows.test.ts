import { describe, expect, it } from "vitest";
import type { CatalogLine } from "@/lib/catalogPrices";
import { buildForwardStitchSummaryRows } from "@/lib/forwardSummaryRows";

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
});

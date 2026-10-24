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
      otherExpenses: 6200,
      vadeFarki: 500,
      totalPrimary: 110_700,
    });

    expect(rows.find((r) => r.label.startsWith("Ataşman toplamı"))?.label).toBe(
      "Ataşman toplamı (Yeni Uzun Kova)",
    );
    expect(rows.find((r) => r.label.startsWith("Bakım paketi"))?.label).toBe(
      "Bakım paketi (500 saat)",
    );
    expect(rows.find((r) => r.label.includes("Ek masraflar"))?.label).toBe(
      "Ek masraflar (Kasko, Leasing, İthalat)",
    );
    expect(
      rows.every((r) => r.subRows == null || r.subRows.length === 0),
    ).toBe(true);
  });
});

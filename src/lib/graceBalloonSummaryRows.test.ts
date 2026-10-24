import { describe, expect, it } from "vitest";
import { buildGraceBalloonStitchSummaryRows } from "@/lib/graceBalloonSummaryRows";
import type { LeasingPlanSummary } from "@/lib/leasingPaymentPlan";

const okSummary = (partial: Partial<LeasingPlanSummary>): LeasingPlanSummary => ({
  status: "ok",
  message: "Hesaplandı",
  financedPrincipal: 0,
  payingMonthCount: 12,
  equalNormalInstallment: 1000,
  totalBalloon: 0,
  totalLeasingPayments: 0,
  totalFinanceInterest: 8560.19,
  totalExtraCosts: 8800,
  cashExtraCosts: 0,
  financedExtraCosts: 8800,
  machineFinancedPrincipal: 0,
  customerTotalPayment: 150000,
  ...partial,
});

describe("buildGraceBalloonStitchSummaryRows", () => {
  it("forward: lists machine, expenses, finance and subtotal", () => {
    const rows = buildGraceBalloonStitchSummaryRows({
      direction: "forward",
      machinePrice: 132000,
      targetCustomerTotal: 0,
      solvedMachine: null,
      summary: okSummary({ customerTotalPayment: 150000 }),
      extras: {
        fileFee: 0,
        totalInsurance: 8800,
        importCost: 0,
        attachmentCost: 3000,
      },
      financingSupport: 5000,
    });
    expect(rows[0]?.label).toBe("Makine bedeli");
    expect(rows.find((r) => r.label === "Finansman desteği")?.value).toBe(-5000);
    expect(rows.some((r) => r.label.includes("Ek masraflar"))).toBe(true);
    expect(rows.some((r) => r.label.includes("Finansman maliyeti"))).toBe(true);
    expect(rows.some((r) => r.tone === "subtotal")).toBe(true);
  });

  it("reverse: ends with bulunan makine bedeli", () => {
    const rows = buildGraceBalloonStitchSummaryRows({
      direction: "reverse",
      machinePrice: 0,
      targetCustomerTotal: 150000,
      solvedMachine: 95000,
      summary: okSummary({}),
      extras: {
        fileFee: 0,
        totalInsurance: 8800,
        importCost: 0,
        attachmentCost: 3000,
      },
      financingSupport: 5000,
    });
    expect(rows[0]?.label).toBe("Müşteri toplam ödemesi");
    expect(rows.find((r) => r.label === "Finansman desteği")?.value).toBe(5000);
    expect(rows.at(-1)?.label).toContain("Bulunan makine bedeli");
  });
});

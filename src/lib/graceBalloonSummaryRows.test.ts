import { describe, expect, it } from "vitest";
import {
  buildGraceBalloonDetailedReportRows,
  buildGraceBalloonStitchSummaryRows,
  sumGraceBalloonDetailRows,
} from "@/lib/graceBalloonSummaryRows";
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
    expect(rows.find((r) => r.label === "Kasko")?.value).toBe(8800);
    expect(rows.find((r) => r.label === "Masraflar")).toBeUndefined();
    expect(rows.find((r) => r.label === "İthalat")).toBeUndefined();
    expect(rows.some((r) => r.label.includes("Kasko ve masraflar"))).toBe(false);
    expect(rows.some((r) => r.label === "Vade farkı")).toBe(true);
    expect(rows.some((r) => r.label === "Ataşman ve donanım maliyeti")).toBe(true);
    expect(rows.some((r) => r.tone === "subtotal")).toBe(true);
  });

  it("names selected kova sepet bakim and camera instead of a lump", () => {
    const rows = buildGraceBalloonStitchSummaryRows({
      direction: "forward",
      machinePrice: 100000,
      targetCustomerTotal: 0,
      solvedMachine: null,
      summary: okSummary({ customerTotalPayment: 120000 }),
      extras: {
        fileFee: 0,
        totalInsurance: 0,
        importCost: 0,
        attachmentCost: 8000,
      },
      financingSupport: 0,
      optionRows: [
        { label: "Açılır Kova", value: 4500 },
        { label: "Sepet (Yerli)", value: 2500 },
        { label: "Geri görüş kamerası", value: 1000 },
      ],
    });
    expect(rows.find((r) => r.label === "Açılır Kova")?.value).toBe(4500);
    expect(rows.find((r) => r.label === "Sepet (Yerli)")?.value).toBe(2500);
    expect(rows.find((r) => r.label === "Geri görüş kamerası")?.value).toBe(1000);
    expect(rows.find((r) => r.label === "Ataşman ve donanım maliyeti")).toBeUndefined();
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
    expect(rows.find((r) => r.label === "Vade farkı")?.value).toBe(-8560.19);
    expect(rows.find((r) => r.label === "Katkı payı")?.value).toBeCloseTo(
      -(8800 + 8560.19),
      2,
    );
    expect(rows.at(-1)?.label).toContain("Bulunan makine bedeli");
  });
});

describe("buildGraceBalloonDetailedReportRows", () => {
  it("lists kasko bundle, attachment and vade farkı as positive deduction rows", () => {
    const rows = buildGraceBalloonDetailedReportRows({
      extras: {
        fileFee: 450,
        totalInsurance: 8800,
        importCost: 350,
        attachmentCost: 3000,
      },
      displayFinanceInterest: 8560.19,
    });
    expect(rows.find((r) => r.label === "Kasko")?.value).toBe(8800);
    expect(rows.find((r) => r.label === "Masraflar")?.value).toBe(450);
    expect(rows.find((r) => r.label === "İthalat")?.value).toBe(350);
    expect(rows.find((r) => r.label === "Kasko ve masraflar")).toBeUndefined();
    expect(rows.find((r) => r.label === "Ataşman ve donanım maliyeti")?.value).toBe(3000);
    expect(rows.find((r) => r.label === "Vade farkı")?.value).toBe(8560.19);
    expect(rows.find((r) => r.label === "Katkı payı")?.value).toBeCloseTo(
      8800 + 450 + 8560.19,
      2,
    );
    expect(rows.map((r) => r.label)).toEqual([
      "Kasko",
      "Masraflar",
      "Vade farkı",
      "Katkı payı",
      "İthalat",
      "Ataşman ve donanım maliyeti",
    ]);
    expect(sumGraceBalloonDetailRows(rows)).toBeCloseTo(21160.19, 2);
  });
});

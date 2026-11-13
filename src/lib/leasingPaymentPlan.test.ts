import { describe, expect, it } from "vitest";
import {
  computeLeasingPaymentPlan,
  defaultMonthModes,
  type LeasingPlanInput,
} from "./leasingPaymentPlan";
import { computeLeasingPaymentPlanReverse } from "./leasingPaymentPlanReverse";

function base(over: Partial<LeasingPlanInput> = {}): LeasingPlanInput {
  return {
    machinePrice: 100_000,
    downPayment: 20_000,
    annualNominalRatePct: 12,
    termMonths: 36,
    startDate: "2026-01-01",
    currency: "EUR",
    financingSupport: 0,
    fileFee: 0,
    totalInsurance: 0,
    importCost: 0,
    attachmentCost: 0,
    monthModes: defaultMonthModes(36),
    balloons: Array.from({ length: 36 }, () => 0),
    ...over,
  };
}

describe("computeLeasingPaymentPlan", () => {
  it("standart plan — kapanış bakiyesi sıfır", () => {
    const r = computeLeasingPaymentPlan(base());
    expect(r.summary.status).toBe("ok");
    expect(r.summary.financedPrincipal).toBe(80_000);
    expect(r.summary.payingMonthCount).toBe(33);
    const last = r.rows[r.rows.length - 1];
    expect(Math.abs(last.closingBalance)).toBeLessThan(0.02);
  });

  it("sıfır faiz — eşit taksit anapara / ödemeli ay", () => {
    const r = computeLeasingPaymentPlan(base({ annualNominalRatePct: 0 }));
    expect(r.summary.status).toBe("ok");
    expect(r.summary.equalNormalInstallment).toBeCloseTo(80_000 / 33, 4);
  });

  it("sıfır peşinat", () => {
    const r = computeLeasingPaymentPlan(base({ downPayment: 0 }));
    expect(r.summary.financedPrincipal).toBe(100_000);
    expect(r.summary.status).toBe("ok");
  });

  it("finansman desteği anaparadan düşer, müşteri toplamından tekrar düşülmez", () => {
    const noSupport = computeLeasingPaymentPlan(base());
    const withSupport = computeLeasingPaymentPlan(
      base({ financingSupport: 10_000, monthModes: defaultMonthModes(36) }),
    );
    expect(withSupport.summary.financedPrincipal).toBe(70_000);
    expect(withSupport.summary.equalNormalInstallment).toBeLessThan(
      noSupport.summary.equalNormalInstallment,
    );
    const extraDown = 10_000;
    expect(withSupport.summary.customerTotalPayment).toBeLessThan(
      noSupport.summary.customerTotalPayment - extraDown + 500,
    );
  });

  it("boş finansman desteği sıfır kabul", () => {
    const a = computeLeasingPaymentPlan(base({ financingSupport: undefined }));
    const b = computeLeasingPaymentPlan(base({ financingSupport: 0 }));
    expect(a.summary.equalNormalInstallment).toBe(b.summary.equalNormalInstallment);
  });

  it("ilk üç ay ödemesiz — faiz borca eklenir", () => {
    const r = computeLeasingPaymentPlan(base());
    expect(r.rows[0].mode).toBe("grace");
    expect(r.rows[0].normalInstallment).toBe(0);
    expect(r.rows[0].principalPayment).toBeLessThan(0);
    expect(r.rows[2].closingBalance).toBeGreaterThan(80_000);
  });

  it("farklı ödemesiz ay", () => {
    const modes = defaultMonthModes(36);
    modes[10] = "grace";
    const r = computeLeasingPaymentPlan(base({ monthModes: modes }));
    expect(r.summary.payingMonthCount).toBe(32);
    expect(r.rows[10].normalInstallment).toBe(0);
    expect(r.summary.status).toBe("ok");
  });

  it("son ay balonu — taksit yeniden hesaplanır, kapanış sıfır", () => {
    const balloons = Array.from({ length: 36 }, () => 0);
    balloons[35] = 20_000;
    const plain = computeLeasingPaymentPlan(base());
    const r = computeLeasingPaymentPlan(base({ balloons }));
    expect(r.summary.status).toBe("ok");
    expect(r.summary.totalBalloon).toBe(20_000);
    expect(r.summary.equalNormalInstallment).toBeLessThan(plain.summary.equalNormalInstallment);
    expect(Math.abs(r.rows[35].closingBalance)).toBeLessThan(0.02);
  });

  it("birden fazla balon", () => {
    const balloons = Array.from({ length: 36 }, () => 0);
    balloons[15] = 5_000;
    balloons[35] = 20_000;
    const r = computeLeasingPaymentPlan(base({ balloons }));
    expect(r.summary.status).toBe("ok");
    expect(r.summary.totalBalloon).toBe(25_000);
  });

  it("ödemesiz ayda yalnızca balon", () => {
    const balloons = Array.from({ length: 36 }, () => 0);
    balloons[0] = 5_000;
    const r = computeLeasingPaymentPlan(base({ balloons }));
    expect(r.rows[0].normalInstallment).toBe(0);
    expect(r.rows[0].totalPeriodPayment).toBe(5_000);
    expect(r.summary.status).toBe("ok");
  });

  it("peşin ek maliyetler taksiti değiştirmez, müşteri toplamına eklenir", () => {
    const plain = computeLeasingPaymentPlan(base());
    const extra = computeLeasingPaymentPlan(
      base({
        fileFee: 1_000,
        totalInsurance: 2_000,
        importCost: 3_000,
        attachmentCost: 4_000,
      }),
    );
    expect(extra.summary.equalNormalInstallment).toBeCloseTo(
      plain.summary.equalNormalInstallment,
      6,
    );
    expect(extra.summary.cashExtraCosts).toBe(10_000);
    expect(extra.summary.financedExtraCosts).toBe(0);
    expect(extra.summary.customerTotalPayment).toBe(
      plain.summary.customerTotalPayment + 10_000,
    );
  });

  it("plana dahil ek maliyet taksiti artırır ve faiz oluşturur", () => {
    const plain = computeLeasingPaymentPlan(base());
    const financed = computeLeasingPaymentPlan(
      base({
        fileFee: 10_000,
        extraCostModes: { fileFee: "financed" },
      }),
    );
    expect(financed.summary.financedExtraCosts).toBe(10_000);
    expect(financed.summary.cashExtraCosts).toBe(0);
    expect(financed.summary.financedPrincipal).toBe(90_000);
    expect(financed.summary.equalNormalInstallment).toBeGreaterThan(
      plain.summary.equalNormalInstallment,
    );
    expect(financed.summary.customerTotalPayment).toBeGreaterThan(
      plain.summary.customerTotalPayment,
    );
    expect(financed.summary.totalFinanceInterest).toBeGreaterThan(
      plain.summary.totalFinanceInterest,
    );
  });

  it("peşinat + destek makine bedeline ulaşırsa uyarı", () => {
    const r = computeLeasingPaymentPlan(
      base({ downPayment: 60_000, financingSupport: 40_000 }),
    );
    expect(r.summary.status).toBe("invalid");
    expect(r.rows.length).toBe(0);
  });

  it("aşırı balon — geçersiz", () => {
    const balloons = Array.from({ length: 36 }, () => 0);
    balloons[35] = 200_000;
    const r = computeLeasingPaymentPlan(base({ balloons }));
    expect(r.summary.status).toBe("invalid");
  });
});

describe("computeLeasingPaymentPlanReverse", () => {
  it("ileri → geri makine bedelini geri bulur", () => {
    const forward = computeLeasingPaymentPlan(
      base({ machinePrice: 140_000, downPayment: 30_000 }),
    );
    expect(forward.summary.status).toBe("ok");
    const reverse = computeLeasingPaymentPlanReverse({
      ...base({ machinePrice: 0, downPayment: 30_000 }),
      targetCustomerTotal: forward.summary.customerTotalPayment,
    });
    expect(reverse.summary.status).toBe("ok");
    expect(reverse.solvedMachinePrice).not.toBeNull();
    expect(reverse.solvedMachinePrice!).toBeCloseTo(140_000, 0);
    expect(reverse.summary.customerTotalPayment).toBeCloseTo(
      forward.summary.customerTotalPayment,
      1,
    );
  });

  it("geri Peşin ekler vade farkına girmez, taksit (hedef − peşinat) / ay", () => {
    const modes = Array.from({ length: 24 }, () => "paying" as const);
    const reverse = computeLeasingPaymentPlanReverse({
      ...base({
        machinePrice: 0,
        downPayment: 35_000,
        termMonths: 24,
        monthModes: modes,
        balloons: Array.from({ length: 24 }, () => 0),
        annualNominalRatePct: 6.25,
        totalInsurance: 3_165.26,
        attachmentCost: 5_000,
        extraCostModes: { totalInsurance: "cash", attachmentCost: "cash" },
      }),
      targetCustomerTotal: 135_000,
    });
    expect(reverse.summary.status).toBe("ok");
    expect(reverse.summary.equalNormalInstallment).toBeCloseTo(
      (135_000 - 35_000) / 24,
      2,
    );
    expect(reverse.summary.cashExtraCosts).toBeCloseTo(8_165.26, 2);
    expect(reverse.summary.financedExtraCosts).toBe(0);
    expect(reverse.summary.customerTotalPayment).toBeCloseTo(135_000, 1);
    const paying = reverse.rows.filter((row) => row.mode === "paying");
    const extraShare = 8_165.26 / 24;
    expect(paying[0].normalInstallment).toBeCloseTo(
      reverse.summary.equalNormalInstallment,
      2,
    );
    expect(paying[0].principalPayment).toBeCloseTo(
      paying[0].normalInstallment - extraShare - paying[0].periodInterest,
      4,
    );
  });

  it("geri Plana ekler faize girer, taksit aynı kalır", () => {
    const modes = Array.from({ length: 24 }, () => "paying" as const);
    const shared = {
      machinePrice: 0,
      downPayment: 35_000,
      termMonths: 24,
      monthModes: modes,
      balloons: Array.from({ length: 24 }, () => 0),
      annualNominalRatePct: 6.25,
      totalInsurance: 3_165.26,
      attachmentCost: 5_000,
    };
    const cash = computeLeasingPaymentPlanReverse({
      ...base({
        ...shared,
        extraCostModes: { totalInsurance: "cash", attachmentCost: "cash" },
      }),
      targetCustomerTotal: 135_000,
    });
    const financed = computeLeasingPaymentPlanReverse({
      ...base({
        ...shared,
        extraCostModes: {
          totalInsurance: "financed",
          attachmentCost: "financed",
        },
      }),
      targetCustomerTotal: 135_000,
    });
    expect(cash.summary.status).toBe("ok");
    expect(financed.summary.status).toBe("ok");
    expect(financed.summary.equalNormalInstallment).toBeCloseTo(
      cash.summary.equalNormalInstallment,
      2,
    );
    expect(financed.summary.financedExtraCosts).toBeCloseTo(8_165.26, 2);
    expect(financed.summary.totalFinanceInterest).toBeGreaterThan(
      cash.summary.totalFinanceInterest,
    );
    expect(financed.solvedMachinePrice!).toBeLessThan(cash.solvedMachinePrice!);
  });

  it("müşteri hedefi masraf içermez; katkı payı masrafı üste eklemeden BNP tarza yaklaşır", () => {
    const modes = Array.from({ length: 30 }, () => "paying" as const);
    const reverse = computeLeasingPaymentPlanReverse({
      ...base({
        machinePrice: 0,
        downPayment: 20_000,
        termMonths: 30,
        monthModes: modes,
        balloons: Array.from({ length: 30 }, () => 0),
        annualNominalRatePct: 6.25,
        fileFee: 0,
        totalInsurance: 5_350,
        importCost: 0,
        attachmentCost: 0,
        extraCostModes: {
          totalInsurance: "financed",
        },
      }),
      targetCustomerTotal: 130_693,
    });
    expect(reverse.summary.status).toBe("ok");
    expect(reverse.summary.equalNormalInstallment).toBeCloseTo(
      (130_693 - 20_000) / 30,
      2,
    );
    const contribution =
      130_693 - (reverse.solvedMachinePrice ?? 0);
    expect(contribution).toBeCloseTo(14_219, 0);
    expect(Math.abs(contribution - 14_151)).toBeLessThan(200);
  });

  it("listeden kasko + dosya + ithalat, toplu masrafla aynı katkıyı verir", () => {
    const modes = Array.from({ length: 30 }, () => "paying" as const);
    const shared = {
      machinePrice: 0,
      downPayment: 20_000,
      termMonths: 30,
      monthModes: modes,
      balloons: Array.from({ length: 30 }, () => 0),
      annualNominalRatePct: 6.25,
    };
    const lump = computeLeasingPaymentPlanReverse({
      ...base({
        ...shared,
        totalInsurance: 5_350,
        extraCostModes: { totalInsurance: "financed" },
      }),
      targetCustomerTotal: 130_693,
    });
    const itemized = computeLeasingPaymentPlanReverse({
      ...base({
        ...shared,
        totalInsurance: 4_248,
        fileFee: 450,
        importCost: 652,
        extraCostModes: {
          totalInsurance: "financed",
          fileFee: "financed",
          importCost: "financed",
        },
      }),
      targetCustomerTotal: 130_693,
    });
    expect(lump.summary.status).toBe("ok");
    expect(itemized.summary.status).toBe("ok");
    expect(itemized.summary.equalNormalInstallment).toBeCloseTo(
      lump.summary.equalNormalInstallment,
      2,
    );
    expect(itemized.solvedMachinePrice!).toBeCloseTo(lump.solvedMachinePrice!, 0);
  });

  it("balonlu planda geri hesaplama", () => {
    const balloons = Array.from({ length: 36 }, () => 0);
    balloons[35] = 15_000;
    const forward = computeLeasingPaymentPlan(
      base({ machinePrice: 120_000, balloons }),
    );
    const reverse = computeLeasingPaymentPlanReverse({
      ...base({ machinePrice: 0, balloons }),
      targetCustomerTotal: forward.summary.customerTotalPayment,
    });
    expect(reverse.summary.status).toBe("ok");
    expect(reverse.solvedMachinePrice!).toBeCloseTo(120_000, 0);
  });
});

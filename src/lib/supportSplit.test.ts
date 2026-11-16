import { describe, expect, it } from "vitest";
import {
  FACTORY_SUPPORT_LABEL,
  FINANCING_SUPPORT_LABEL,
  MAATS_SUPPORT_LABEL,
  customerSupportLine,
  internalSupportLines,
  isFinancingSupportLabel,
  reportSupportLines,
  resolveSupportSplit,
  supportTotal,
  withSyncedSupportTotal,
} from "@/lib/supportSplit";

describe("resolveSupportSplit", () => {
  it("sums factory and MAATS", () => {
    expect(
      resolveSupportSplit({ factorySupportEuro: 2000, maatsSupportEuro: 1000 }),
    ).toEqual({ factory: 2000, maats: 1000, total: 3000 });
  });

  it("maps legacy single amount to MAATS", () => {
    expect(resolveSupportSplit({ financingSupportEuro: 5000 })).toEqual({
      factory: 0,
      maats: 5000,
      total: 5000,
    });
  });

  it("does not add legacy when a split field is set", () => {
    expect(
      resolveSupportSplit({
        factorySupportEuro: 2000,
        maatsSupportEuro: 0,
        financingSupportEuro: 5000,
      }),
    ).toEqual({ factory: 2000, maats: 0, total: 2000 });
  });

  it("keeps an explicit zero and does not restore the old total", () => {
    expect(
      resolveSupportSplit({
        factorySupportEuro: 0,
        maatsSupportEuro: 0,
        financingSupportEuro: 5000,
      }),
    ).toEqual({ factory: 0, maats: 0, total: 0 });
  });
});

describe("internal vs customer lines", () => {
  it("omits empty sources internally", () => {
    expect(
      internalSupportLines({ factory: 2000, maats: 0 }, -1),
    ).toEqual([{ label: FACTORY_SUPPORT_LABEL, value: -2000 }]);
    expect(
      internalSupportLines({ factory: 2000, maats: 1000 }, 1).map((r) => r.label),
    ).toEqual([FACTORY_SUPPORT_LABEL, MAATS_SUPPORT_LABEL]);
  });

  it("customer plan is a single Finansman desteği", () => {
    expect(customerSupportLine(3000, -1)).toEqual({
      label: FINANCING_SUPPORT_LABEL,
      value: -3000,
    });
    expect(customerSupportLine(0)).toBeNull();
  });

  it("keeps legacy total as MAATS when factory is added", () => {
    expect(
      withSyncedSupportTotal(
        { financingSupportEuro: 5000 },
        "factorySupportEuro",
        2000,
      ),
    ).toEqual({
      financingSupportEuro: 7000,
      factorySupportEuro: 2000,
      maatsSupportEuro: 5000,
    });
  });

  it("clears MAATS instead of putting the last amount back", () => {
    expect(
      withSyncedSupportTotal(
        {
          factorySupportEuro: 0,
          maatsSupportEuro: 5000,
          financingSupportEuro: 5000,
        },
        "maatsSupportEuro",
        0,
      ),
    ).toEqual({
      factorySupportEuro: 0,
      maatsSupportEuro: 0,
      financingSupportEuro: 0,
    });
  });
});

describe("report vs customer", () => {
  it("HQ report splits, customer stays one line", () => {
    expect(
      reportSupportLines({ factory: 2000, maats: 1000 }, 3000, -1).map(
        (r) => r.label,
      ),
    ).toEqual([FACTORY_SUPPORT_LABEL, MAATS_SUPPORT_LABEL]);
    expect(customerSupportLine(3000)?.label).toBe(FINANCING_SUPPORT_LABEL);
  });

  it("treats all three labels as support for kalemler skip", () => {
    expect(isFinancingSupportLabel(FACTORY_SUPPORT_LABEL)).toBe(true);
    expect(isFinancingSupportLabel(MAATS_SUPPORT_LABEL)).toBe(true);
    expect(isFinancingSupportLabel(FINANCING_SUPPORT_LABEL)).toBe(true);
    expect(supportTotal({ factory: 2, maats: 3 })).toBe(5);
  });
});

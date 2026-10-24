import { describe, expect, it } from "vitest";
import { computeKaskoFromMachinePrice } from "@/lib/catalogServiceFees";

describe("computeKaskoFromMachinePrice", () => {
  it("applies percent to machine price", () => {
    expect(computeKaskoFromMachinePrice(100_000, 1.3)).toBe(1300);
  });

  it("returns 0 when percent or price is zero", () => {
    expect(computeKaskoFromMachinePrice(0, 1.3)).toBe(0);
    expect(computeKaskoFromMachinePrice(100_000, 0)).toBe(0);
  });
});

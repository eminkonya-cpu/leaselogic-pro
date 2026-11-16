import { describe, expect, it } from "vitest";
import { clampAnnualTermYears } from "@/lib/annualForwardCalc";

describe("clampAnnualTermYears", () => {
  it("keeps whole years 0–3 and drops the fraction", () => {
    expect(clampAnnualTermYears(2)).toBe(2);
    expect(clampAnnualTermYears("2,5")).toBe(2);
    expect(clampAnnualTermYears(2.9)).toBe(2);
    expect(clampAnnualTermYears(4)).toBe(3);
    expect(clampAnnualTermYears(-1)).toBe(0);
  });
});

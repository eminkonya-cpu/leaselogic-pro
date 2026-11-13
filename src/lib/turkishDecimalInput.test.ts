import { describe, expect, it } from "vitest";
import {
  formatDecimalForInput,
  formatDecimalIdle,
  parseTurkishDecimal,
  roundDecimal,
} from "@/lib/turkishDecimalInput";

describe("formatDecimalIdle", () => {
  it("matches auto extra-cost writing", () => {
    expect(formatDecimalIdle(3090)).toBe("3.090,00");
    expect(formatDecimalIdle(1600.5)).toBe("1.600,50");
    expect(formatDecimalIdle(0)).toBe("0,00");
  });
});

describe("parseTurkishDecimal", () => {
  it("reads idle thousands format", () => {
    expect(parseTurkishDecimal("3.090,00")).toBe(3090);
  });
});

describe("roundDecimal", () => {
  it("keeps two money decimals", () => {
    expect(roundDecimal(3090.129)).toBe(3090.13);
  });
});

describe("formatDecimalForInput", () => {
  it("stays editable without thousands", () => {
    expect(formatDecimalForInput(3090)).toBe("3090");
    expect(formatDecimalForInput(0)).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import {
  sumKalemlerToplam,
  sumStitchKalemlerToplam,
} from "@/lib/kalemlerToplam";

describe("sumKalemlerToplam", () => {
  it("sums absolute item amounts and skips financing support", () => {
    expect(
      sumKalemlerToplam([
        { label: "Kasko", value: 3090 },
        { label: "Masraflar", value: 1600 },
        { label: "Vade farkı", value: 6226.58 },
        { label: "Katkı payı", value: 10916.58 },
        { label: "İthalat", value: 2100 },
        { label: "Finansman desteği", value: -5000 },
      ]),
    ).toBeCloseTo(13016.58, 2);
  });

  it("uses valueEuro when value is absent", () => {
    expect(
      sumKalemlerToplam([
        { label: "Ataşman: Kova", valueEuro: 3000 },
        { label: "Finansman maliyeti (vade farkı)", valueEuro: 500 },
        { label: "Finansman desteği", valueEuro: -2000 },
      ]),
    ).toBe(3500);
  });
});

describe("sumStitchKalemlerToplam", () => {
  it("skips base machine, support and subtotal on reverse stitch", () => {
    expect(
      sumStitchKalemlerToplam([
        { label: "Müşteri toplam ödemesi", value: 130000, tone: "emphasis" },
        { label: "Kasko", value: -3090, tone: "negative" },
        { label: "Vade farkı", value: -6226.58, tone: "negative" },
        { label: "Katkı payı", value: -9316.58, tone: "midtotal" },
        { label: "Finansman desteği", value: 5000, tone: "positive" },
        { label: "Bulunan makine bedeli (KDV hariç)", value: 119083, tone: "subtotal" },
      ]),
    ).toBeCloseTo(9316.58, 2);
  });

  it("skips first machine row on forward stitch", () => {
    expect(
      sumStitchKalemlerToplam([
        { label: "Makine bedeli", value: 100000 },
        { label: "Kasko", value: 3090, tone: "positive" },
        { label: "Finansman maliyeti (vade farkı)", value: 500 },
        { label: "Finansman desteği", value: -2000, tone: "negative" },
        { label: "Toplam", value: 101590, tone: "subtotal" },
      ]),
    ).toBe(3590);
  });
});

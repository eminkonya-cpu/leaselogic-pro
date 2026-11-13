import { describe, expect, it } from "vitest";
import { buildKatkiPayiRows } from "@/lib/katkiPayiGroup";

describe("buildKatkiPayiRows", () => {
  it("groups kasko, masraf and vade farkı; ithalat stays below", () => {
    const rows = buildKatkiPayiRows({
      kasko: 3088.8,
      masraflar: 1600,
      vadeFarki: 10922.5,
      ithalat: 2100,
    });
    expect(rows.map((r) => [r.label, r.value, r.role])).toEqual([
      ["Kasko", 3088.8, "katki"],
      ["Masraflar", 1600, "katki"],
      ["Vade farkı", 10922.5, "katki"],
      ["Katkı payı", 15611.3, "araToplam"],
      ["İthalat", 2100, "ithalat"],
    ]);
  });

  it("does not put options into the subtotal", () => {
    const rows = buildKatkiPayiRows({
      kasko: 100,
      masraflar: 50,
      vadeFarki: 200,
      ithalat: 0,
      hasFollowingItems: true,
    });
    expect(rows.at(-1)).toEqual({
      label: "Katkı payı",
      value: 350,
      role: "araToplam",
    });
    expect(rows.some((r) => r.label === "İthalat")).toBe(false);
  });

  it("skips ara toplam when only ithalat exists", () => {
    expect(
      buildKatkiPayiRows({
        kasko: 0,
        masraflar: 0,
        vadeFarki: 0,
        ithalat: 350,
      }).map((r) => r.label),
    ).toEqual(["İthalat"]);
  });

  it("applies reverse sign to all rows including ara toplam", () => {
    const rows = buildKatkiPayiRows({
      kasko: 100,
      masraflar: 40,
      vadeFarki: 60,
      ithalat: 10,
      sign: -1,
    });
    expect(rows.find((r) => r.role === "araToplam")?.value).toBe(-200);
    expect(rows.find((r) => r.label === "İthalat")?.value).toBe(-10);
  });
});

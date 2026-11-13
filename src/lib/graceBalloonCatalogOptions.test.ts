import { describe, expect, it } from "vitest";
import { DEFAULT_CATALOG_CATEGORIES } from "@/lib/catalogPrices";
import {
  graceBalloonOptionGroups,
  graceBalloonOptionLabel,
  isGraceBalloonOptionItem,
  resolveGraceBalloonOptionLines,
} from "@/lib/graceBalloonCatalogOptions";

describe("grace balloon compact options", () => {
  it("lists priced attachments, bakim, donanim and nakliye chips", () => {
    const groups = graceBalloonOptionGroups(DEFAULT_CATALOG_CATEGORIES);
    expect(groups.map((g) => g.id)).toEqual([
      "attachment",
      "maintenance",
      "equipment",
      "other",
    ]);
    expect(groups.find((g) => g.id === "other")?.title).toBe("Diğer giderler");
    expect(groups[0]?.items.map((i) => i.id)).toEqual([
      "acilir-kova",
      "tahil-kovasi",
      "sepet-yerli",
      "vinc-atasmany",
      "rotasyonlu-catal",
      "orijinal-sepet",
      "sidehift",
    ]);
    expect(groups[0]?.items.some((i) => i.id === "hurda-kagit")).toBe(false);
    expect(groups.find((g) => g.id === "equipment")?.items.map((i) => i.id)).toEqual([
      "kamera",
      "bom-aydinlatma",
      "on-cam-izgara",
    ]);
    expect(groups.find((g) => g.id === "other")?.items.map((i) => i.id)).toEqual([
      "nakliye",
    ]);
  });

  it("renames kamera and windshield chips for the compact row", () => {
    expect(
      graceBalloonOptionLabel({ id: "kamera", label: "Kamera", priceEuro: 1000 }),
    ).toBe("Geri görüş kamerası");
    expect(
      graceBalloonOptionLabel({
        id: "on-cam-izgara",
        label: "Ön Cam Koruma Izgarası",
        priceEuro: 1000,
      }),
    ).toBe("Ön cam koruma");
    expect(
      isGraceBalloonOptionItem("attachment", {
        id: "sidehift",
        label: "Sidehift",
        priceEuro: 1500,
      }),
    ).toBe(true);
    expect(
      isGraceBalloonOptionItem("attachment", {
        id: "hurda-kagit",
        label: "Hurda Kağıt Ataşmanı",
        priceEuro: 0,
      }),
    ).toBe(false);
    expect(
      graceBalloonOptionLabel({ id: "h2000", label: "2000 saat", priceEuro: 4000 }),
    ).toBe("2000 saat");
    expect(
      graceBalloonOptionLabel(
        { id: "h2000", label: "2000 saat", priceEuro: 4000 },
        { compact: true },
      ),
    ).toBe("2000 h");
    expect(
      isGraceBalloonOptionItem("equipment", {
        id: "bom-aydinlatma",
        label: "Bom Aydınlatma",
        priceEuro: 200,
      }),
    ).toBe(true);
  });

  it("resolves only allowed selected lines", () => {
    const lines = resolveGraceBalloonOptionLines(
      {
        attachment: ["acilir-kova", "vinc-atasmany"],
        maintenance: ["h500"],
        equipment: ["kamera", "bom-aydinlatma", "on-cam-izgara"],
        other: ["nakliye"],
      },
      DEFAULT_CATALOG_CATEGORIES,
    );
    expect(lines.map((l) => l.itemId).sort()).toEqual([
      "acilir-kova",
      "bom-aydinlatma",
      "h500",
      "kamera",
      "nakliye",
      "on-cam-izgara",
      "vinc-atasmany",
    ]);
  });
});

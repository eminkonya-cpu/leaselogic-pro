import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import {
  CATALOG_CATEGORY_IDS,
  type CatalogCategoryId,
  type CatalogLine,
} from "@/lib/catalogPrices";

const CATALOG_GROUP_LABELS: Record<CatalogCategoryId, string> = {
  attachment: "Ataşman toplamı",
  maintenance: "Bakım paketi",
  equipment: "Donanım toplamı",
  other: "Diğer giderler",
};

function labelWithDetail(base: string, detailParts: string[]): string {
  const parts = detailParts.map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return base;
  return `${base} (${parts.join(", ")})`;
}

/** İleri hesaplama — Hesaplama Özeti: tek tutar; seçimler parantez içinde. */
export function buildForwardStitchSummaryRows(args: {
  machine: number;
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
  includeExpenses: boolean;
  otherExpenses: number;
  /** Tam finansman maliyeti (destek anaparayı düşürmez); destek varken desteksiz referans. */
  vadeFarki: number;
  /** Bilgi satırı; finansman maliyeti satırından ayrı, toplamdan sonra mavi kutuda net etki. */
  financingSupport?: number;
  totalPrimary: number;
}): CostSummaryRow[] {
  const rows: CostSummaryRow[] = [{ label: "Makine bedeli", value: args.machine }];

  for (const categoryId of CATALOG_CATEGORY_IDS) {
    const names: string[] = [];
    let total = 0;
    for (const line of args.catalogLines) {
      if (line.categoryId !== categoryId) continue;
      const amount = args.catalogAmount(line);
      if (amount <= 0) continue;
      names.push(line.itemLabel);
      total += amount;
    }
    if (total <= 0) continue;
    rows.push({
      label: labelWithDetail(CATALOG_GROUP_LABELS[categoryId], names),
      value: total,
    });
  }

  if (args.includeExpenses && args.otherExpenses > 0) {
    rows.push({
      label: "Ek masraflar (Kasko, Leasing, İthalat)",
      value: args.otherExpenses,
    });
  }

  const finCost = Math.max(0, args.vadeFarki);
  if (finCost > 0) {
    rows.push({
      label: "Finansman maliyeti (vade farkı)",
      value: finCost,
    });
  }

  const support = Math.max(0, args.financingSupport ?? 0);
  if (support > 0) {
    rows.push({
      label: "Finansman desteği",
      value: -support,
      tone: "negative",
    });
  }

  rows.push({ label: "Toplam", value: args.totalPrimary, tone: "subtotal" });
  return rows;
}

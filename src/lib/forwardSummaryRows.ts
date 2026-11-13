import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import {
  CATALOG_CATEGORY_IDS,
  type CatalogCategoryId,
  type CatalogLine,
} from "@/lib/catalogPrices";
import {
  presentExpenseSummaryLines,
  type ExtraExpenseAmounts,
} from "@/lib/expenseSummaryLines";
import {
  buildKatkiPayiRows,
  katkiPayiStitchTone,
} from "@/lib/katkiPayiGroup";
import {
  extraCostPaymentModeLabel,
  type ExtraCostModes,
  type ExtraCostPaymentMode,
} from "@/lib/leasingPaymentPlan";

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

export function withExtraCostPaymentMode(
  label: string,
  mode?: ExtraCostPaymentMode,
): string {
  if (!mode) return label;
  return `${label} · ${extraCostPaymentModeLabel(mode)}`;
}

function expenseLineMode(
  label: string,
  modes?: ExtraCostModes,
): ExtraCostPaymentMode | undefined {
  if (!modes) return undefined;
  if (label === "Kasko") return modes.totalInsurance;
  if (label === "Masraflar") return modes.fileFee;
  if (label === "İthalat") return modes.importCost;
  return undefined;
}

export function buildForwardCatalogGroupLines(args: {
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
  extraCostModes?: ExtraCostModes;
}): { label: string; value: number }[] {
  const rows: { label: string; value: number }[] = [];
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
      label: withExtraCostPaymentMode(
        labelWithDetail(CATALOG_GROUP_LABELS[categoryId], names),
        args.extraCostModes?.attachmentCost,
      ),
      value: total,
    });
  }
  return rows;
}

/** Ödeme planı üst özeti: ataşman / bakım / donanım (+ her şey dahil masraflar). */
export function buildForwardPaymentPlanExtraLines(args: {
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
  includeExpenses: boolean;
  expenseAmounts: ExtraExpenseAmounts;
  extraCostModes?: ExtraCostModes;
}): { label: string; value: number; modeLabel?: string }[] {
  const rows = buildForwardCatalogGroupLines({
    catalogLines: args.catalogLines,
    catalogAmount: args.catalogAmount,
  }).map((row) => ({
    ...row,
    modeLabel: args.extraCostModes
      ? extraCostPaymentModeLabel(args.extraCostModes.attachmentCost)
      : undefined,
  }));
  if (args.includeExpenses) {
    for (const row of presentExpenseSummaryLines(args.expenseAmounts)) {
      const mode = expenseLineMode(row.label, args.extraCostModes);
      rows.push({
        label: row.label,
        value: row.value,
        modeLabel: mode ? extraCostPaymentModeLabel(mode) : undefined,
      });
    }
  }
  return rows;
}

/** İleri hesaplama — Hesaplama Özeti: tek tutar; seçimler parantez içinde. */
export function buildForwardStitchSummaryRows(args: {
  machine: number;
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
  includeExpenses: boolean;
  expenseAmounts: ExtraExpenseAmounts;
  /** Tam finansman maliyeti (destek anaparayı düşürmez); destek varken desteksiz referans. */
  vadeFarki: number;
  /** Bilgi satırı; finansman maliyeti satırından ayrı, toplamdan sonra mavi kutuda net etki. */
  financingSupport?: number;
  totalPrimary: number;
  extraCostModes?: ExtraCostModes;
}): CostSummaryRow[] {
  const catalogRows = buildForwardCatalogGroupLines(args);
  const rows: CostSummaryRow[] = [
    { label: "Makine bedeli", value: args.machine },
    ...catalogRows,
  ];

  const finCost = Math.max(0, args.vadeFarki);
  if (args.includeExpenses || finCost > 0) {
    const amounts = args.includeExpenses
      ? args.expenseAmounts
      : { kasko: 0, masraflar: 0, ithalat: 0 };
    for (const row of buildKatkiPayiRows({
      kasko: amounts.kasko,
      masraflar: amounts.masraflar,
      vadeFarki: finCost,
      vadeFarkiLabel: "Finansman maliyeti (vade farkı)",
      ithalat: amounts.ithalat,
    })) {
      rows.push({
        label: withExtraCostPaymentMode(
          row.label,
          expenseLineMode(row.label, args.extraCostModes),
        ),
        value: row.value,
        tone: katkiPayiStitchTone(row.role, "positive"),
      });
    }
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

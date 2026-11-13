import type { CatalogLine } from "@/lib/catalogPrices";
import { splitExtraExpenseAmounts } from "@/lib/expenseSummaryLines";
import { buildKatkiPayiRows } from "@/lib/katkiPayiGroup";
import {
  extraCostPaymentModeLabel,
  type ExtraCostModes,
} from "@/lib/leasingPaymentPlan";
import { withExtraCostPaymentMode } from "@/lib/forwardSummaryRows";

export type SummaryReportRow = {
  label: string;
  valueEuro: number;
};

/** Yönetim / özet raporu: kalem kalem (UI özeti toplu kalır). */
export function buildDetailedSummaryReportRows(args: {
  catalogLines: CatalogLine[];
  expenses: Record<string, number>;
  includeExpenses: boolean;
  /** Görüntüleme para biriminde tam vade farkı (destekten bağımsız referans). */
  vadeFarkiEuro: number;
  /** Aynı birimde; finansman maliyetinden ayrı bilgi satırı. */
  financingSupport?: number;
  extraCostModes?: ExtraCostModes;
}): SummaryReportRow[] {
  const rows: SummaryReportRow[] = [];
  const catalogRows: SummaryReportRow[] = [];
  const optionMode = args.extraCostModes
    ? extraCostPaymentModeLabel(args.extraCostModes.attachmentCost)
    : undefined;
  const optionSuffix = optionMode ? ` · ${optionMode}` : "";

  for (const line of args.catalogLines) {
    if (line.priceEuro <= 0) continue;
    if (line.categoryId === "attachment") {
      catalogRows.push({
        label: `Ataşman: ${line.itemLabel}${optionSuffix}`,
        valueEuro: line.priceEuro,
      });
    } else if (line.categoryId === "maintenance") {
      catalogRows.push({
        label: `Bakım paketi (${line.itemLabel})${optionSuffix}`,
        valueEuro: line.priceEuro,
      });
    } else if (line.categoryId === "equipment") {
      catalogRows.push({
        label: `Donanım: ${line.itemLabel}${optionSuffix}`,
        valueEuro: line.priceEuro,
      });
    } else if (line.categoryId === "other") {
      catalogRows.push({
        label: `Diğer gider: ${line.itemLabel}${optionSuffix}`,
        valueEuro: line.priceEuro,
      });
    }
  }

  const split = args.includeExpenses
    ? splitExtraExpenseAmounts(args.expenses)
    : { kasko: 0, masraflar: 0, ithalat: 0 };
  const fin = Math.max(0, args.vadeFarkiEuro);
  for (const row of buildKatkiPayiRows({
    kasko: split.kasko,
    masraflar: split.masraflar,
    vadeFarki: fin,
    vadeFarkiLabel: "Finansman maliyeti (vade farkı)",
    ithalat: split.ithalat,
    hasFollowingItems: catalogRows.length > 0,
  })) {
    const mode =
      row.label === "Kasko"
        ? args.extraCostModes?.totalInsurance
        : row.label === "Masraflar"
          ? args.extraCostModes?.fileFee
          : row.label === "İthalat"
            ? args.extraCostModes?.importCost
            : undefined;
    rows.push({
      label: withExtraCostPaymentMode(row.label, mode),
      valueEuro: row.value,
    });
  }
  for (const row of catalogRows) {
    rows.push(row);
  }

  const support = Math.max(0, args.financingSupport ?? 0);
  if (support > 0) {
    rows.push({
      label: "Finansman desteği",
      valueEuro: -support,
    });
  }

  return rows;
}

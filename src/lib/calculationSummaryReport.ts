import type { CatalogLine } from "@/lib/catalogPrices";

export type SummaryReportRow = {
  label: string;
  valueEuro: number;
};

function kaskoTotalEuro(expenses: Record<string, number>) {
  return (
    Number(expenses.kasko1 ?? 0) +
    Number(expenses.kasko2 ?? 0) +
    Number(expenses.kasko3 ?? 0) +
    Number(expenses.kasko4 ?? 0)
  );
}

/** Yönetim / özet raporu: kalem kalem (UI özeti toplu kalır). */
export function buildDetailedSummaryReportRows(args: {
  catalogLines: CatalogLine[];
  expenses: Record<string, number>;
  includeExpenses: boolean;
  vadeFarkiEuro: number;
}): SummaryReportRow[] {
  const rows: SummaryReportRow[] = [];

  for (const line of args.catalogLines) {
    if (line.priceEuro <= 0) continue;
    if (line.categoryId === "attachment") {
      rows.push({ label: `Ataşman: ${line.itemLabel}`, valueEuro: line.priceEuro });
    } else if (line.categoryId === "maintenance") {
      rows.push({
        label: `Bakım paketi (${line.itemLabel})`,
        valueEuro: line.priceEuro,
      });
    } else if (line.categoryId === "equipment") {
      rows.push({ label: `Donanım: ${line.itemLabel}`, valueEuro: line.priceEuro });
    } else if (line.categoryId === "other") {
      rows.push({
        label: `Diğer gider: ${line.itemLabel}`,
        valueEuro: line.priceEuro,
      });
    }
  }

  if (args.includeExpenses) {
    const kasko = kaskoTotalEuro(args.expenses);
    if (kasko > 0) {
      rows.push({ label: "Kasko toplamı", valueEuro: kasko });
    }
    const leasing = Number(args.expenses.leasingCost ?? 0);
    if (leasing > 0) {
      rows.push({ label: "Dosya masrafı (Leasing)", valueEuro: leasing });
    }
    const importCost = Number(args.expenses.importCost ?? 0);
    if (importCost > 0) {
      rows.push({ label: "İthalat masrafı", valueEuro: importCost });
    }
  }

  const fin = Math.max(0, args.vadeFarkiEuro);
  if (fin > 0) {
    rows.push({ label: "Finansman maliyeti (vade farkı)", valueEuro: fin });
  }

  return rows;
}

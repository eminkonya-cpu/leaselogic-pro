import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import type { CatalogLine } from "@/lib/catalogPrices";
import { expenseFieldLabels } from "@/components/finance/ExpenseInputCard";

export type SummaryReportRow = { label: string; value: number };

export function scaleReverseDetailRows(
  rows: SummaryReportRow[],
  factor: number,
): SummaryReportRow[] {
  return rows.map((row) => ({ ...row, value: row.value * factor }));
}

export function sumReverseDetailRows(rows: SummaryReportRow[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0);
}

/** @deprecated use sumReverseDetailRows */
export function sumReverseDetailRowsEuro(rows: SummaryReportRow[]): number {
  return sumReverseDetailRows(rows);
}

const SEGMENT_COLORS = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#1e3a8a",
];

export function buildReverseStitchSummaryRows(args: {
  allInTotal: number;
  totalExpenses: number;
  interestDiff: number;
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
  displayNetMachine: number;
}): CostSummaryRow[] {
  const rows: CostSummaryRow[] = [
    {
      label: "Makine fiyatı",
      value: args.allInTotal,
      tone: "emphasis",
    },
    {
      label: "Ek masraflar (Kasko, Leasing, İthalat)",
      value: -args.totalExpenses,
      tone: "negative",
    },
    {
      label: "Finansman maliyeti (vade farkı)",
      value: -Math.max(0, args.interestDiff),
      tone: "negative",
    },
  ];
  for (const line of args.catalogLines) {
    rows.push({
      label: `${line.categoryTitle}: ${line.itemLabel}`,
      value: -args.catalogAmount(line),
      tone: "negative",
    });
  }
  rows.push({
    label: "Net makine bedeli (KDV hariç)",
    value: args.displayNetMachine,
    tone: "subtotal",
  });
  return rows;
}

export function buildReverseDistributionSegments(args: {
  displayNetMachine: number;
  totalExpenses: number;
  interestDiff: number;
  catalogLines: CatalogLine[];
  catalogAmount: (line: CatalogLine) => number;
}) {
  const segments: { label: string; value: number; color: string }[] = [
    {
      label: "Net makine bedeli",
      value: Math.max(0, args.displayNetMachine),
      color: SEGMENT_COLORS[0]!,
    },
  ];
  let colorIdx = 1;
  for (const line of args.catalogLines) {
    segments.push({
      label: `${line.categoryTitle}: ${line.itemLabel}`,
      value: args.catalogAmount(line),
      color: SEGMENT_COLORS[colorIdx % SEGMENT_COLORS.length]!,
    });
    colorIdx++;
  }
  if (args.totalExpenses > 0) {
    segments.push({
      label: "Ek masraflar",
      value: args.totalExpenses,
      color: SEGMENT_COLORS[colorIdx % SEGMENT_COLORS.length]!,
    });
    colorIdx++;
  }
  const fin = Math.max(0, args.interestDiff);
  if (fin > 0) {
    segments.push({
      label: "Vade farkı",
      value: fin,
      color: SEGMENT_COLORS[colorIdx % SEGMENT_COLORS.length]!,
    });
  }
  return segments;
}

export function buildDetailedReverseReportRows(args: {
  catalogLines: CatalogLine[];
  expenses: Record<string, number>;
  interestDiff: number;
  catalogAmount: (line: CatalogLine) => number;
  expenseAmount: (value: number) => number;
}): SummaryReportRow[] {
  const rows: SummaryReportRow[] = [];
  for (const line of args.catalogLines) {
    rows.push({
      label: `${line.categoryTitle} — ${line.itemLabel}`,
      value: args.catalogAmount(line),
    });
  }
  for (const [key, value] of Object.entries(args.expenses)) {
    if (!value) continue;
    const label =
      (expenseFieldLabels as Record<string, string>)[key] ?? key;
    rows.push({ label, value: args.expenseAmount(value) });
  }
  if (args.interestDiff > 0) {
    rows.push({
      label: "Finansman maliyeti (vade farkı)",
      value: args.interestDiff,
    });
  }
  return rows;
}

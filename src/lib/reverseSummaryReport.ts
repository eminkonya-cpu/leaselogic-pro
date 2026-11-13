import type { CostSummaryRow } from "@/components/finance/ui/CostSummaryPanel";
import { sumKalemlerToplam } from "@/lib/kalemlerToplam";
import type { CatalogLine } from "@/lib/catalogPrices";
import {
  presentExpenseSummaryLines,
  splitExtraExpenseAmounts,
  type ExtraExpenseAmounts,
} from "@/lib/expenseSummaryLines";
import {
  buildKatkiPayiRows,
  katkiPayiStitchTone,
} from "@/lib/katkiPayiGroup";

export type SummaryReportRow = { label: string; value: number };

export function scaleReverseDetailRows(
  rows: SummaryReportRow[],
  factor: number,
): SummaryReportRow[] {
  return rows.map((row) => ({ ...row, value: row.value * factor }));
}

export function sumReverseDetailRows(rows: SummaryReportRow[]): number {
  return sumKalemlerToplam(rows);
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
  expenseAmounts: ExtraExpenseAmounts;
  /** Tam vade farkı (destekten bağımsız referans); destek varken desteksiz senaryo. */
  interestDiff: number;
  financingSupport?: number;
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
  ];
  for (const row of buildKatkiPayiRows({
    kasko: args.expenseAmounts.kasko,
    masraflar: args.expenseAmounts.masraflar,
    vadeFarki: args.interestDiff,
    ithalat: args.expenseAmounts.ithalat,
    sign: -1,
    hasFollowingItems: args.catalogLines.length > 0,
  })) {
    rows.push({
      label: row.label,
      value: row.value,
      tone: katkiPayiStitchTone(row.role, "negative"),
    });
  }
  for (const line of args.catalogLines) {
    rows.push({
      label: `${line.categoryTitle}: ${line.itemLabel}`,
      value: -args.catalogAmount(line),
      tone: "negative",
    });
  }
  const support = Math.max(0, args.financingSupport ?? 0);
  if (support > 0) {
    rows.push({
      label: "Finansman desteği",
      value: support,
      tone: "positive",
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
  expenseAmounts: ExtraExpenseAmounts;
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
  for (const row of presentExpenseSummaryLines(args.expenseAmounts)) {
    segments.push({
      label: row.label,
      value: row.value,
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
  const split = splitExtraExpenseAmounts(args.expenses);
  const catalogRows = args.catalogLines.map((line) => ({
    label: `${line.categoryTitle} — ${line.itemLabel}`,
    value: args.catalogAmount(line),
  }));
  for (const row of buildKatkiPayiRows({
    kasko: args.expenseAmount(split.kasko),
    masraflar: args.expenseAmount(split.masraflar),
    vadeFarki: args.interestDiff,
    ithalat: args.expenseAmount(split.ithalat),
    hasFollowingItems: catalogRows.length > 0,
  })) {
    rows.push({ label: row.label, value: row.value });
  }
  for (const row of catalogRows) {
    rows.push(row);
  }
  return rows;
}

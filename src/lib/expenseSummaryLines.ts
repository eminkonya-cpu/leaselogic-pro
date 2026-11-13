export type ExtraExpenseAmounts = {
  kasko: number;
  masraflar: number;
  ithalat: number;
};

const EXPENSE_SUMMARY_LINES: { key: keyof ExtraExpenseAmounts; label: string }[] =
  [
    { key: "kasko", label: "Kasko" },
    { key: "masraflar", label: "Masraflar" },
    { key: "ithalat", label: "İthalat" },
  ];

export function kaskoExpenseTotal(
  expenses: Record<string, number | undefined>,
): number {
  return (
    Number(expenses.kasko1 ?? 0) +
    Number(expenses.kasko2 ?? 0) +
    Number(expenses.kasko3 ?? 0) +
    Number(expenses.kasko4 ?? 0)
  );
}

/** İleri / geri ek masraf alanlarından özet tutarları (Euro, ham). */
export function splitExtraExpenseAmounts(
  expenses: Record<string, number | undefined>,
): ExtraExpenseAmounts {
  return {
    kasko: Math.max(0, kaskoExpenseTotal(expenses)),
    masraflar: Math.max(0, Number(expenses.leasingCost ?? 0)),
    ithalat: Math.max(0, Number(expenses.importCost ?? 0)),
  };
}

export function scaleExpenseAmounts(
  amounts: ExtraExpenseAmounts,
  factor: number,
): ExtraExpenseAmounts {
  return {
    kasko: amounts.kasko * factor,
    masraflar: amounts.masraflar * factor,
    ithalat: amounts.ithalat * factor,
  };
}

/** Yalnızca dolu kalemler — 3 ay ödemesiz maliyet özeti ile aynı etiketler. */
export function presentExpenseSummaryLines(
  amounts: ExtraExpenseAmounts,
): { label: string; value: number }[] {
  const rows: { label: string; value: number }[] = [];
  for (const line of EXPENSE_SUMMARY_LINES) {
    const value = Math.max(0, amounts[line.key]);
    if (value > 0.005) {
      rows.push({ label: line.label, value });
    }
  }
  return rows;
}

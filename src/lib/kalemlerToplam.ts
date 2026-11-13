export const FINANCING_SUPPORT_LABEL = "Finansman desteği";
export const KATKI_PAYI_LABEL = "Katkı payı";
export const KATKI_PAYI_NOTE = "(kasko + masraf + vade farkı)";

export function isFinancingSupportLabel(label: string): boolean {
  return label.trim() === FINANCING_SUPPORT_LABEL;
}

export function isKatkiPayiLabel(label: string): boolean {
  return label.trim() === KATKI_PAYI_LABEL;
}

/** Destek ve ara toplam hariç kalemlerin mutlak toplamı (geri özetle aynı kural). */
export function sumKalemlerToplam(
  rows: { label: string; value?: number; valueEuro?: number }[],
): number {
  let sum = 0;
  for (const row of rows) {
    if (isFinancingSupportLabel(row.label)) continue;
    if (isKatkiPayiLabel(row.label)) continue;
    const v = Number(row.valueEuro ?? row.value ?? 0);
    if (!Number.isFinite(v)) continue;
    sum += Math.abs(v);
  }
  return sum;
}

/** Ekran özeti: baz makine/hedef, destek ve ara toplam satırları hariç. */
export function sumStitchKalemlerToplam(
  rows: { label: string; value: number; tone?: string }[],
): number {
  return sumKalemlerToplam(
    rows.filter((row, index) => {
      if (row.tone === "subtotal") return false;
      if (row.tone === "midtotal") return false;
      if (row.tone === "emphasis") return false;
      if (index === 0 && row.tone !== "negative" && row.tone !== "positive") {
        return false;
      }
      return true;
    }),
  );
}

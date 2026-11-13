/** Yazarken yalnızca rakam, virgül ve nokta */
export function sanitizeDecimalTyping(raw: string): string {
  return raw.replace(/[^\d,.]/g, "");
}

/** "6," veya "12," gibi henüz bitmemiş giriş */
export function isIncompleteDecimal(raw: string): boolean {
  const s = raw.trim();
  return s === "," || s === "." || /^\d+[,.]$/.test(s);
}

/** TR: virgül ondalık; binlik nokta desteklenir (1.234,56) */
export function parseTurkishDecimal(raw: string): number {
  let s = raw.trim().replace(/\s/g, "");
  if (s === "" || s === "," || s === ".") return 0;
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatDecimalForInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return String(value).replace(".", ",");
}

/** Odak yokken: 3.090,00 (otomatik tutar satırı ile aynı yazım). */
export function formatDecimalIdle(value: number, decimals = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function roundDecimal(value: number, decimals = 2): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** Math.max(0, Math.trunc(decimals));
  return Math.round(n * f) / f;
}

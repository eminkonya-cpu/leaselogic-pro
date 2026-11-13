function resolveDecimals(opts?: { decimals?: number; noDecimals?: boolean }) {
  if (opts?.noDecimals) return 0;
  return opts?.decimals ?? 2;
}

/** Tutar gösterimi: `decimals` verilmezse 2 ondalık (para birimi satırları için). */
export function formatAmount(value: number, decimals = 2) {
  return formatNumber(value, { decimals });
}

/** Faiz oranı: girilen yüzde (6,25) 1 ondalığa yuvarlanmaz. 3 ay ödemesiz ile aynı. */
export function formatInterestRate(value: number) {
  return formatNumber(value, { decimals: 2 });
}

export function formatNumber(
  value: number,
  opts?: { decimals?: number; noDecimals?: boolean },
) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "-";
  const decimals = resolveDecimals(opts);
  return v.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Tutar + para birimi; arada kırılmayan boşluk (mobilde € alt satıra düşmesin). */
export function formatMoneyWithSymbol(
  value: number,
  symbol: string,
  decimals = 2,
) {
  return `${formatNumber(value, { decimals })}\u00a0${symbol}`;
}

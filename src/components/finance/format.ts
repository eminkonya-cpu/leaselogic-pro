export function formatNumber(
  value: number,
  opts?: { decimals?: number; noDecimals?: boolean },
) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "-";
  const decimals = opts?.noDecimals
    ? 0
    : (opts?.decimals ?? 2);
  return v.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

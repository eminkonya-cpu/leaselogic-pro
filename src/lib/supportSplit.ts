/** Müşteri belgesi: tek satır. İç özet: Fabrika / MAATS ayrı. Hesap toplamı kullanır. */

export const FINANCING_SUPPORT_LABEL = "Finansman desteği";
export const FACTORY_SUPPORT_LABEL = "Fabrika desteği";
export const MAATS_SUPPORT_LABEL = "MAATS desteği";

export type SupportSplit = {
  factory: number;
  maats: number;
};

export function supportAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function supportTotal(split?: SupportSplit | null): number {
  return supportAmount(split?.factory) + supportAmount(split?.maats);
}

export function scaleSupportSplit(
  split: SupportSplit,
  factor: number,
): SupportSplit {
  return { factory: split.factory * factor, maats: split.maats * factor };
}

function firstPresent(
  ...values: unknown[]
): { present: boolean; value: unknown } {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return { present: true, value };
    }
  }
  return { present: false, value: undefined };
}

/**
 * Eski tek `financingSupportEuro` yalnızca split alanları hiç yoksa MAATS olur.
 * 0 yazılmış Fabrika/MAATS silinmiş kabul edilir; eski toplama geri dönülmez.
 */
export function resolveSupportSplit(raw: {
  factorySupportEuro?: number;
  maatsSupportEuro?: number;
  factorySupport?: number;
  maatsSupport?: number;
  financingSupportEuro?: number;
  financingSupport?: number;
}): SupportSplit & { total: number } {
  const factoryPick = firstPresent(raw.factorySupportEuro, raw.factorySupport);
  const maatsPick = firstPresent(raw.maatsSupportEuro, raw.maatsSupport);
  const factory = supportAmount(factoryPick.value);
  const maatsEntered = supportAmount(maatsPick.value);
  const legacy = supportAmount(
    raw.financingSupportEuro ?? raw.financingSupport,
  );
  const maats =
    factoryPick.present || maatsPick.present ? maatsEntered : legacy;
  return { factory, maats, total: factory + maats };
}

export type SupportFieldKey =
  | "factorySupportEuro"
  | "maatsSupportEuro"
  | "factorySupport"
  | "maatsSupport";

export function withSyncedSupportTotal<T extends object>(
  prev: T,
  key: SupportFieldKey,
  value: number,
): T {
  const current = resolveSupportSplit(prev);
  const euro = key.endsWith("Euro");
  const factoryKey = euro ? "factorySupportEuro" : "factorySupport";
  const maatsKey = euro ? "maatsSupportEuro" : "maatsSupport";
  const totalKey = euro ? "financingSupportEuro" : "financingSupport";
  const next = {
    ...prev,
    [factoryKey]: current.factory,
    [maatsKey]: current.maats,
    [key]: supportAmount(value),
  };
  const split = resolveSupportSplit(next);
  return {
    ...next,
    [factoryKey]: split.factory,
    [maatsKey]: split.maats,
    [totalKey]: split.total,
  };
}

/** Özet rapor: dolu kaynaklar; eski tek tutar MAATS. */
export function reportSupportLines(
  split: SupportSplit | undefined,
  totalFallback: number,
  sign: 1 | -1 = 1,
): { label: string; value: number }[] {
  const factory = supportAmount(split?.factory);
  const maats = supportAmount(split?.maats);
  if (factory > 0 || maats > 0) {
    return internalSupportLines({ factory, maats }, sign);
  }
  return internalSupportLines(
    totalFallback > 0 ? { factory: 0, maats: totalFallback } : undefined,
    sign,
  );
}

export function isFinancingSupportLabel(label: string): boolean {
  const t = label.trim();
  return (
    t === FINANCING_SUPPORT_LABEL ||
    t === FACTORY_SUPPORT_LABEL ||
    t === MAATS_SUPPORT_LABEL
  );
}

/** Maliyet özeti / özet rapor — yalnızca dolu kaynaklar. */
export function internalSupportLines(
  split: SupportSplit | undefined,
  sign: 1 | -1,
): { label: string; value: number }[] {
  const factory = supportAmount(split?.factory);
  const maats = supportAmount(split?.maats);
  const rows: { label: string; value: number }[] = [];
  if (factory > 0.005) {
    rows.push({ label: FACTORY_SUPPORT_LABEL, value: sign * factory });
  }
  if (maats > 0.005) {
    rows.push({ label: MAATS_SUPPORT_LABEL, value: sign * maats });
  }
  return rows;
}

/** Müşteri ödeme planı — tek finansman desteği. */
export function customerSupportLine(
  total: number,
  sign: 1 | -1 = 1,
): { label: string; value: number } | null {
  const amount = supportAmount(total);
  if (amount <= 0.005) return null;
  return { label: FINANCING_SUPPORT_LABEL, value: sign * amount };
}

/** İleri hesaplama vadesi (ay veya yıl) — TR ondalık virgülü destekler. */
export function normalizeForwardTermMonths(term: number | string | undefined | null): number {
  if (term === null || term === undefined) return 0;
  const raw =
    typeof term === "string"
      ? Number(String(term).replace(",", ".").trim())
      : Number(term);
  return Math.max(0, Math.trunc(Number.isFinite(raw) ? raw : 0));
}

const FORWARD_PARAMS_KEY = "llp:v2:forward:shared:params";
const LEGACY_TERM_MONTHLY_KEY = "llp:v2:forward:term-monthly";

/** Eski `term-monthly` kaydını `shared:params.term` içine taşır (bir kez). */
export function migrateLegacyForwardTermInParams<
  T extends { term?: number | string },
>(setSharedParams: (action: (prev: T) => T) => void) {
  if (typeof window === "undefined") return;

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_TERM_MONTHLY_KEY);
    if (legacyRaw == null) return;
    const legacy = normalizeForwardTermMonths(JSON.parse(legacyRaw) as number);
    if (legacy <= 0) return;

    setSharedParams((prev) => {
      const current = normalizeForwardTermMonths(prev.term);
      if (current > 0) return prev;
      return { ...prev, term: legacy };
    });
  } catch {
    // ignore malformed storage
  }
}

export { FORWARD_PARAMS_KEY, LEGACY_TERM_MONTHLY_KEY };

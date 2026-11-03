"use client";

import { usePersistentState } from "@/lib/usePersistentState";
import { useLayoutEffect } from "react";

export const SHARED_EURO_RATE_KEY = "llp:v2:shared:euro-rate";
export const DEFAULT_EURO_RATE = 50.5;

const LEGACY_PARAM_KEYS = [
  "llp:v2:forward:shared:params",
  "llp:v2:reverse:shared:params",
] as const;

function readLegacyEuroRate(): number | null {
  for (const key of LEGACY_PARAM_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = JSON.parse(raw) as { euroRate?: unknown };
      const n = Number(parsed?.euroRate);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    } catch {
      // try next
    }
  }
  return null;
}

export function parseEuroRate(value: string | number): number {
  const n =
    typeof value === "string"
      ? Number(String(value).replace(",", "."))
      : Number(value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_EURO_RATE;
}

/** Son girilen kur; İleri / Geri / yıllık aynı değeri kullanır. */
export function useSharedEuroRate() {
  const [euroRate, setEuroRate] = usePersistentState<number>(
    SHARED_EURO_RATE_KEY,
    DEFAULT_EURO_RATE,
  );

  useLayoutEffect(() => {
    try {
      if (window.localStorage.getItem(SHARED_EURO_RATE_KEY) != null) {
        return;
      }
      const legacy = readLegacyEuroRate();
      if (legacy != null) {
        setEuroRate(legacy);
      }
    } catch {
      // ignore
    }
  }, [setEuroRate]);

  return [euroRate, setEuroRate] as const;
}

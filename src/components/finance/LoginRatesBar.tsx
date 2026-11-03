"use client";

import { fetchReferenceTryRates } from "@/lib/referenceRates";
import { useEffect, useState } from "react";

type Rates = { eurTry: number | null; usdTry: number | null };

function formatTry(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Giriş ekranı: sadece bilgi amaçlı, piyasa referans kuru (hesaplamaya girmez). */
export default function LoginRatesBar() {
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    let active = true;
    void fetchReferenceTryRates().then((next) => {
      if (active) {
        setRates(next);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <p className="text-center text-[11px] font-semibold tabular-nums text-slate-500 sm:text-xs">
      <span className="text-slate-400">Referans · </span>
      €/₺ {formatTry(rates?.eurTry ?? null)}
      <span className="mx-2 text-slate-300">·</span>
      $/₺ {formatTry(rates?.usdTry ?? null)}
    </p>
  );
}

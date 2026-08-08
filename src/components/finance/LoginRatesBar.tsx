"use client";

import { useEffect, useState } from "react";

type Rates = { eurTry: number | null; usdTry: number | null };

async function fetchDisplayRates(): Promise<Rates> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=EUR&to=TRY,USD",
      { cache: "no-store" },
    );
    if (!res.ok) {
      return { eurTry: null, usdTry: null };
    }
    const data = (await res.json()) as {
      rates?: { TRY?: number; USD?: number };
    };
    const eurTry = data.rates?.TRY ?? null;
    const eurUsd = data.rates?.USD;
    const usdTry =
      eurTry != null && eurUsd != null && eurUsd > 0 ? eurTry / eurUsd : null;
    return { eurTry, usdTry };
  } catch {
    return { eurTry: null, usdTry: null };
  }
}

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
    void fetchDisplayRates().then((next) => {
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

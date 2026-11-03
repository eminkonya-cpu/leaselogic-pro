const RATE_URLS = [
  "https://api.frankfurter.dev/v1/latest?from=EUR&to=TRY,USD",
  "https://api.frankfurter.app/latest?from=EUR&to=TRY,USD",
];

export async function fetchReferenceTryRates(): Promise<{
  eurTry: number | null;
  usdTry: number | null;
}> {
  for (const url of RATE_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        continue;
      }
      const data = (await res.json()) as {
        rates?: { TRY?: number; USD?: number };
      };
      const eurTry = data.rates?.TRY ?? null;
      const eurUsd = data.rates?.USD;
      const usdTry =
        eurTry != null && eurUsd != null && eurUsd > 0 ? eurTry / eurUsd : null;
      if (eurTry != null) {
        return { eurTry, usdTry };
      }
    } catch {
      /* sonraki kaynağı dene */
    }
  }
  return { eurTry: null, usdTry: null };
}

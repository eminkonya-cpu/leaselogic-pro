export async function fetchReferenceTryRates(): Promise<{
  eurTry: number | null;
  usdTry: number | null;
}> {
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

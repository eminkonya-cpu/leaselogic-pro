/** Görünüm teması — geri dönmek için "Klasik" veya env’yi kapatın. */

export type LlpUiTheme = "classic" | "bank";

export const LLP_UI_THEME_STORAGE_KEY = "llp:ui-theme";

/** `.env.local`: NEXT_PUBLIC_BANK_MODERN_UI=true → varsayılan Banka */
export function getDefaultUiTheme(): LlpUiTheme {
  if (process.env.NEXT_PUBLIC_BANK_MODERN_UI === "true") {
    return "bank";
  }
  return "classic";
}

export function isValidUiTheme(value: string | null): value is LlpUiTheme {
  return value === "classic" || value === "bank";
}

export function readStoredUiTheme(): LlpUiTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LLP_UI_THEME_STORAGE_KEY);
    return isValidUiTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function persistUiTheme(theme: LlpUiTheme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LLP_UI_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

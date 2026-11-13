import type { SupabaseClient } from "@supabase/supabase-js";

export const AUTH_HINT_KEY = "llp:auth:hint";

export type AuthHint = {
  email: string;
  canEditCatalog: boolean;
};

type StorageLike = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function extractAuthErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
}

function extractAuthErrorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "";
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code.toLowerCase() : "";
}

function extractErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }
  if (error && typeof error === "object" && "name" in error) {
    return typeof (error as { name?: unknown }).name === "string"
      ? ((error as { name: string }).name)
      : "";
  }
  return "";
}

function extractErrorStack(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? "";
  }
  if (error && typeof error === "object" && "stack" in error) {
    return typeof (error as { stack?: unknown }).stack === "string"
      ? ((error as { stack: string }).stack)
      : "";
  }
  return "";
}

function isFailedFetchMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m === "failed to fetch" ||
    m.includes("failed to fetch") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("fetch failed")
  );
}

function isAuthJsStack(stack: string): boolean {
  const s = stack.toLowerCase();
  return (
    s.includes("_refreshaccesstoken") ||
    s.includes("_recoverandrefresh") ||
    s.includes("_callrefreshtoken") ||
    s.includes("@supabase/auth-js") ||
    s.includes("auth-js")
  );
}

/**
 * Oturum yenileme ağ hatası (TLS/offline). Geçersiz token değil;
 * kullanıcıyı düşürme, kırmızı overlay de gösterme.
 */
export function isAuthNetworkError(error: unknown): boolean {
  const name = extractErrorName(error);
  const message = extractAuthErrorMessage(error);
  const stack = extractErrorStack(error);

  if (name === "AuthRetryableFetchError") {
    return true;
  }

  return isFailedFetchMessage(message) && isAuthJsStack(stack);
}

/** GoTrue: tek kullanımlık refresh token ikinci kez yenilenince veya depoda yoksa. */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  const code = extractAuthErrorCode(error);
  if (
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used" ||
    code === "session_not_found"
  ) {
    return true;
  }

  const message = extractAuthErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes("refresh token") ||
    message.includes("refresh_token") ||
    message.includes("invalid token") ||
    message.includes("session not found") ||
    message.includes("session from session_id claim in jwt does not exist")
  );
}

export function isSessionExpired(
  session: { expires_at?: number | null } | null | undefined,
): boolean {
  if (!session || typeof session.expires_at !== "number") {
    return false;
  }

  return session.expires_at * 1000 <= Date.now();
}

export function listSupabaseAuthStorageKeys(
  storage: Pick<Storage, "length" | "key">,
): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key?.startsWith("sb-") && key.includes("auth-token")) {
      keys.push(key);
    }
  }
  return keys;
}

export function readStoredSupabaseSession(
  storage: Pick<Storage, "length" | "key" | "getItem"> | null = browserStorage(),
): { access_token?: string; refresh_token?: string; expires_at?: number } | null {
  if (!storage) {
    return null;
  }

  try {
    for (const key of listSupabaseAuthStorageKeys(storage)) {
      const raw = storage.getItem(key);
      if (!raw || raw === "null" || raw === "{}") {
        continue;
      }

      const parsed = JSON.parse(raw) as {
        currentSession?: { access_token?: string; refresh_token?: string; expires_at?: number };
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
      };
      const session = parsed.currentSession ?? parsed;
      if (session?.access_token || session?.refresh_token) {
        return session;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function hasStoredSupabaseSession(
  storage: Pick<Storage, "length" | "key" | "getItem"> | null = browserStorage(),
): boolean {
  return Boolean(readStoredSupabaseSession(storage));
}

export function isStoredSupabaseSessionExpired(
  storage: Pick<Storage, "length" | "key" | "getItem"> | null = browserStorage(),
): boolean {
  return isSessionExpired(readStoredSupabaseSession(storage));
}

export function readAuthHint(
  storage: Pick<Storage, "getItem"> | null = browserStorage(),
): AuthHint | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(AUTH_HINT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthHint>;
    if (typeof parsed.email === "string" && parsed.email.includes("@")) {
      return {
        email: parsed.email,
        canEditCatalog: Boolean(parsed.canEditCatalog),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeAuthHint(
  hint: AuthHint,
  storage: Pick<Storage, "setItem"> | null = browserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(AUTH_HINT_KEY, JSON.stringify(hint));
  } catch {
    // ignore quota / private mode
  }
}

export function clearAuthHint(
  storage: Pick<Storage, "removeItem"> | null = browserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(AUTH_HINT_KEY);
  } catch {
    // ignore
  }
}

export function clearSupabaseAuthStorage(
  storage: Pick<Storage, "length" | "key" | "removeItem"> | null = browserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    for (const key of listSupabaseAuthStorageKeys(storage)) {
      storage.removeItem(key);
    }
  } catch {
    // private mode / quota
  }
}

/** Sunucuya gitmeden ölü refresh token'ı sil. Hata yutulur; uygulama çökmez. */
export async function signOutLocally(supabase: SupabaseClient | null) {
  try {
    if (supabase) {
      await supabase.auth.signOut({ scope: "local" });
    }
  } catch {
    // geçersiz refresh token ile çıkış beklenen durum
  } finally {
    clearSupabaseAuthStorage();
    clearAuthHint();
  }
}

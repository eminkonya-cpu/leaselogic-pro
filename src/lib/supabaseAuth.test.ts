import { describe, expect, it } from "vitest";
import {
  AUTH_HINT_KEY,
  clearAuthHint,
  clearSupabaseAuthStorage,
  hasStoredSupabaseSession,
  isAuthNetworkError,
  isInvalidRefreshTokenError,
  isSessionExpired,
  isStoredSupabaseSessionExpired,
  listSupabaseAuthStorageKeys,
  readAuthHint,
  readStoredSupabaseSession,
} from "@/lib/supabaseAuth";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage = {
    get length() {
      return map.size;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
  };
  return storage;
}

describe("isInvalidRefreshTokenError", () => {
  it("detects GoTrue refresh-token-not-found", () => {
    expect(
      isInvalidRefreshTokenError(
        new Error("Invalid Refresh Token: Refresh Token Not Found"),
      ),
    ).toBe(true);
  });

  it("detects refresh token is not valid and auth-js codes", () => {
    expect(
      isInvalidRefreshTokenError(new Error("Refresh token is not valid")),
    ).toBe(true);
    expect(
      isInvalidRefreshTokenError({
        name: "AuthApiError",
        message: "Invalid Refresh Token: Refresh Token Not Found",
        code: "refresh_token_not_found",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isInvalidRefreshTokenError(new Error("JWT expired"))).toBe(false);
    expect(isInvalidRefreshTokenError(null)).toBe(false);
  });
});

describe("isAuthNetworkError", () => {
  it("detects auth-js refresh Failed to fetch", () => {
    const err = new TypeError("Failed to fetch");
    err.stack = `${err.stack ?? ""}\nSupabaseAuthClient._refreshAccessToken`;
    expect(isAuthNetworkError(err)).toBe(true);
  });

  it("detects AuthRetryableFetchError", () => {
    const err = new Error("Failed to fetch");
    err.name = "AuthRetryableFetchError";
    expect(isAuthNetworkError(err)).toBe(true);
  });

  it("ignores unrelated fetch failures", () => {
    expect(isAuthNetworkError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isAuthNetworkError(new Error("boom"))).toBe(false);
  });
});

describe("session expiry", () => {
  it("treats past expires_at as expired", () => {
    expect(isSessionExpired({ expires_at: Math.floor(Date.now() / 1000) - 60 })).toBe(
      true,
    );
    expect(isSessionExpired({ expires_at: Math.floor(Date.now() / 1000) + 3600 })).toBe(
      false,
    );
    expect(isSessionExpired(null)).toBe(false);
  });
});

describe("supabase auth storage", () => {
  it("finds and clears only sb auth keys", () => {
    const storage = memoryStorage({
      "sb-abc-auth-token": '{"refresh_token":"stale"}',
      [AUTH_HINT_KEY]: '{"email":"a@b.com"}',
    });

    expect(listSupabaseAuthStorageKeys(storage)).toEqual(["sb-abc-auth-token"]);
    expect(hasStoredSupabaseSession(storage)).toBe(true);
    expect(readStoredSupabaseSession(storage)?.refresh_token).toBe("stale");

    clearSupabaseAuthStorage(storage);

    expect(hasStoredSupabaseSession(storage)).toBe(false);
    expect(storage.getItem(AUTH_HINT_KEY)).toBe('{"email":"a@b.com"}');

    clearAuthHint(storage);
    expect(readAuthHint(storage)).toBeNull();
  });

  it("detects expired stored session", () => {
    const storage = memoryStorage({
      "sb-abc-auth-token": JSON.stringify({
        access_token: "x",
        refresh_token: "y",
        expires_at: 1,
      }),
    });

    expect(isStoredSupabaseSessionExpired(storage)).toBe(true);
  });
});

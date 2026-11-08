import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isInvalidRefreshTokenError,
  signOutLocally,
} from "@/lib/supabaseAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

let browserClient: SupabaseClient | null = null;
let authErrorGuardAttached = false;
let recoveringInvalidRefresh = false;

function recoverInvalidRefreshToken() {
  if (recoveringInvalidRefresh) {
    return;
  }

  recoveringInvalidRefresh = true;
  void signOutLocally(browserClient).finally(() => {
    recoveringInvalidRefresh = false;
  });
}

function attachInvalidRefreshTokenGuard() {
  if (authErrorGuardAttached || typeof window === "undefined") {
    return;
  }

  authErrorGuardAttached = true;

  window.addEventListener("unhandledrejection", (event) => {
    if (!isInvalidRefreshTokenError(event.reason)) {
      return;
    }
    event.preventDefault();
    recoverInvalidRefreshToken();
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (args.some((arg) => isInvalidRefreshTokenError(arg))) {
      recoverInvalidRefreshToken();
      return;
    }
    originalConsoleError(...args);
  };
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  attachInvalidRefreshTokenGuard();

  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}

export {
  clearAuthHint,
  clearSupabaseAuthStorage,
  hasStoredSupabaseSession,
  isInvalidRefreshTokenError,
  isSessionExpired,
  isStoredSupabaseSessionExpired,
  readAuthHint,
  signOutLocally,
  writeAuthHint,
} from "@/lib/supabaseAuth";

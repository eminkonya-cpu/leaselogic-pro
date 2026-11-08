"use client";

import CatalogAdminEditor from "@/components/admin/CatalogAdminEditor";
import { CatalogProvider } from "@/contexts/CatalogContext";
import AnnualForwardCalculator from "@/components/finance/AnnualForwardCalculator";
import AnnualReverseCalculator from "@/components/finance/AnnualReverseCalculator";
import ForwardCalculator from "@/components/finance/ForwardCalculator";
import {
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import LeasingPaymentPlanCalculator from "@/components/finance/LeasingPaymentPlanCalculator";
import ReverseCalculator from "@/components/finance/ReverseCalculator";
import LoginRatesBar from "@/components/finance/LoginRatesBar";
import {
  BankUiProvider,
  BankUiThemeToggle,
} from "@/components/finance/ui/BankUiProvider";
import {
  CALC_CHIP_BASE_CLS,
  CALC_CHIP_GROUP_CLS,
  headerChipStateCls,
} from "@/components/finance/ui/CalcFormChrome";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearAuthHint,
  getSupabaseBrowserClient,
  hasStoredSupabaseSession,
  isInvalidRefreshTokenError,
  isSessionExpired,
  isStoredSupabaseSessionExpired,
  isSupabaseConfigured,
  readAuthHint,
  signOutLocally,
  writeAuthHint,
} from "@/lib/supabase";
import { usePersistentState } from "@/lib/usePersistentState";
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";
import {
  LoaderCircle,
  Landmark,
  LogOut,
  ShieldAlert,
  UserCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

type AuthState =
  | "loading"
  | "signed_out"
  | "authenticated"
  | "inactive"
  | "not_configured";

const missingConfigMessage =
  "Supabase ayarlari eksik. `.env.local` dosyasinda URL ve publishable key olmali.";

type AccessCheckResult =
  | {
      allowed: true;
      email: string;
      canEditCatalog: boolean;
    }
  | {
      allowed: false;
      reason: string;
      transient?: boolean;
    };

async function checkAuthorizedAccess(
  supabase: SupabaseClient,
  session: Session
): Promise<AccessCheckResult> {
  const email = session.user.email?.trim().toLowerCase();

  if (!email) {
    return {
      allowed: false,
      reason: "Bu hesabin e-posta bilgisi eksik gorunuyor.",
    };
  }

  const { data, error } = await supabase
    .from("authorized_users")
    .select("is_active, can_edit_catalog")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return {
      allowed: false,
      transient: true,
      reason:
        "Yetki tablosu okunamadi. Once `SUPABASE_SETUP.md` icindeki SQL adimini tamamla.",
    };
  }

  if (!data) {
    return {
      allowed: false,
      reason:
        "Bu e-posta yetki listesinde yok. Supabase > Table Editor > authorized_users tablosuna ekleyin (is_active = true). Detay: SUPABASE_SETUP.md",
    };
  }

  if (!data.is_active) {
    return {
      allowed: false,
      reason:
        "Bu hesap pasif. Supabase > authorized_users tablosunda is_active alanini true yapin.",
    };
  }

  return {
    allowed: true,
    email,
    canEditCatalog: Boolean(data.can_edit_catalog),
  };
}

function StitchFooter() {
  return (
    <footer className="mt-8 border-t border-[#c3c6d7] bg-white">
      <div className="app-shell flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <span className="text-center text-sm font-semibold text-[#0b1c30] md:text-left">
          © {new Date().getFullYear()} LeaseLogic Pro. Hesaplamalar bilgilendirme
          amaçlıdır.
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#565e74]">
          <span>İletişim</span>
          <span>Kullanım Koşulları</span>
          <span>Gizlilik Politikası</span>
        </div>
      </div>
    </footer>
  );
}

function AppFooter() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <footer className="border-t border-blue-200 bg-blue-50/80 py-2 text-center text-[11px] font-bold text-blue-700">
      <span className="text-blue-900">leaselogic-pro</span>
      {" · "}
      Bu seridi goruyorsaniz guncel kaynak kodu yukleniyor. Gormuyorsaniz:{" "}
      <span className="whitespace-nowrap">
        <code className="rounded bg-blue-100 px-1 text-blue-900">
          cd leaselogic-pro
        </code>{" "}
        →{" "}
        <code className="rounded bg-blue-100 px-1 text-blue-900">
          rm -rf .next
        </code>{" "}
        sonra{" "}
        <code className="rounded bg-blue-100 px-1 text-blue-900">
          npm run dev
        </code>{" "}
        →{" "}
        <code className="rounded bg-blue-100 px-1 text-blue-900">
          http://127.0.0.1:3010
        </code>
      </span>
    </footer>
  );
}

export function CalculatorApp({
  userEmail,
  canEditCatalog,
  onSignOut,
  isSigningOut,
}: {
  userEmail: string;
  canEditCatalog: boolean;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
}) {
  const [mode, setMode] = usePersistentState<"forward" | "reverse" | "paymentPlan">(
    "llp:home:mode",
    "forward"
  );
  const [paymentFrequency, setPaymentFrequency] =
    usePersistentState<PaymentFrequency>(
      "llp:home:payment-frequency",
      "monthly"
    );
  const [appView, setAppView] = usePersistentState<"calculator" | "catalog-admin">(
    "llp:home:app-view",
    "calculator",
  );

  const stitchPaymentProps = {
    paymentFrequency,
    onPaymentFrequencyChange: setPaymentFrequency,
  };

  const modeTabClass = (active: boolean) =>
    cn(
      CALC_CHIP_BASE_CLS,
      "flex-1 px-2.5 py-2 text-xs max-lg:px-2 max-lg:py-2 max-lg:text-xs",
      headerChipStateCls(active),
    );

  return (
    <CatalogProvider>
    <BankUiProvider>
      <header className="llp-app-header sticky top-0 z-50 border-b border-[#c3c6d7] bg-[#f8f9ff]">
        <div className="app-shell py-3 max-lg:py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="llp-brand-mark hidden" aria-hidden>
                <Landmark className="h-4 w-4" />
              </span>
              <h1 className="text-base font-bold text-[#0b1c30] md:text-lg">
                Finansman Hesaplayıcı
              </h1>
              <span className="llp-app-tagline hidden text-xs font-medium text-[#434655] sm:inline md:text-[13px]">
                Makine Finansmanı Maliyet Analizi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
              <BankUiThemeToggle className="max-md:order-last max-md:w-full max-md:justify-center" />
              {canEditCatalog ? (
                <Button
                  type="button"
                  variant="outline"
                  className="hidden h-8 border-[#c3c6d7] text-xs font-semibold text-[#565e74] md:inline-flex"
                  onClick={() =>
                    setAppView((v) =>
                      v === "calculator" ? "catalog-admin" : "calculator",
                    )
                  }
                >
                  {appView === "calculator"
                    ? "Fiyat listesi yönetimi"
                    : "Hesaplayıcıya dön"}
                </Button>
              ) : null}
              <span className="llp-user-chip hidden items-center gap-2 rounded-full bg-[#eff4ff] px-2.5 py-1 text-[11px] font-semibold text-[#0b1c30] sm:inline-flex md:text-xs">
                <UserCircle className="h-4 w-4 text-[#004ac6]" aria-hidden />
                {userEmail}
              </span>
              <Button
                type="button"
                className="llp-signout h-8 gap-1.5 text-xs font-semibold bg-[#004ac6] hover:bg-[#2563eb]"
                onClick={onSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
                Çıkış Yap
              </Button>
            </div>
          </div>

          {appView === "calculator" ? (
            <div
              className={cn(
                "llp-mode-tabs mt-3 w-full max-lg:mt-2",
                CALC_CHIP_GROUP_CLS,
              )}
            >
              <button
                type="button"
                data-promo-mode="forward"
                data-active={mode === "forward" ? "true" : "false"}
                onClick={() => setMode("forward")}
                className={modeTabClass(mode === "forward")}
              >
                İleri Hesaplama
              </button>
              <button
                type="button"
                data-promo-mode="reverse"
                data-active={mode === "reverse" ? "true" : "false"}
                onClick={() => setMode("reverse")}
                className={modeTabClass(mode === "reverse")}
              >
                Geri Hesaplama
              </button>
              <button
                type="button"
                data-promo-mode="paymentPlan"
                data-active={mode === "paymentPlan" ? "true" : "false"}
                onClick={() => setMode("paymentPlan")}
                className={modeTabClass(mode === "paymentPlan")}
              >
                3 Ay Ödemesiz & Balon
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {appView === "catalog-admin" ? (
        <CatalogAdminEditor
          userEmail={userEmail}
          onBack={() => setAppView("calculator")}
        />
      ) : (
        <>
      <main className="app-shell finance-main py-4 lg:py-5">
        {mode === "paymentPlan" ? (
          <LeasingPaymentPlanCalculator />
        ) : paymentFrequency === "monthly" ? (
          mode === "forward" ? (
            <ForwardCalculator {...stitchPaymentProps} />
          ) : (
            <ReverseCalculator {...stitchPaymentProps} />
          )
        ) : mode === "forward" ? (
          <AnnualForwardCalculator {...stitchPaymentProps} />
        ) : (
          <AnnualReverseCalculator {...stitchPaymentProps} />
        )}
      </main>

      <StitchFooter />
      <AppFooter />
        </>
      )}
    </BankUiProvider>
    </CatalogProvider>
  );
}

function SessionRestoringScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-gradient-to-b from-sky-50 via-white to-blue-50">
      <LoaderCircle className="h-8 w-8 animate-spin text-[#004ac6]" aria-hidden />
      <span className="text-sm font-semibold text-slate-500">
        Oturum kontrol ediliyor
      </span>
    </div>
  );
}

export function HomeClient() {
  const [authState, setAuthState] = useState<AuthState>(
    isSupabaseConfigured ? "loading" : "not_configured"
  );
  const [bootstrapped, setBootstrapped] = useState(!isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    isSupabaseConfigured ? "" : missingConfigMessage
  );
  const [sessionEmail, setSessionEmail] = useState("");
  const [canEditCatalog, setCanEditCatalog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const authStateRef = useRef(authState);

  authStateRef.current = authState;

  useLayoutEffect(() => {
    if (!isSupabaseConfigured) {
      setBootstrapped(true);
      return;
    }

    const hint = readAuthHint();
    const storedSession = hasStoredSupabaseSession();
    const storedExpired = isStoredSupabaseSessionExpired();

    if (hint && storedSession && !storedExpired) {
      setSessionEmail(hint.email);
      setCanEditCatalog(hint.canEditCatalog);
      setAuthState("authenticated");
    } else if (storedSession) {
      if (hint && storedExpired) {
        clearAuthHint();
      }
      setAuthState("loading");
    } else {
      if (hint) {
        clearAuthHint();
      }
      setAuthState("signed_out");
    }

    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;
    let recoveringSession = false;

    const applySignedOut = () => {
      clearAuthHint();
      setAuthState("signed_out");
      setSessionEmail("");
      setCanEditCatalog(false);
    };

    const recoverInvalidSession = async () => {
      if (recoveringSession) {
        return;
      }
      recoveringSession = true;
      try {
        await signOutLocally(supabase);
        if (!isMounted) {
          return;
        }
        applySignedOut();
        setMessage("");
      } finally {
        recoveringSession = false;
      }
    };

    const syncSession = async (
      session: Session | null,
      event?: AuthChangeEvent,
    ) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          return;
        }

        if (event === "SIGNED_OUT") {
          applySignedOut();
          return;
        }

        if (hasStoredSupabaseSession()) {
          if (isStoredSupabaseSessionExpired()) {
            return;
          }
          await recoverInvalidSession();
          return;
        }

        applySignedOut();
        return;
      }

      if (isSessionExpired(session) && event === "INITIAL_SESSION") {
        return;
      }

      const alreadyIn = authStateRef.current === "authenticated";

      if (
        alreadyIn &&
        (event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION")
      ) {
        return;
      }

      if (!alreadyIn && !readAuthHint()) {
        setAuthState("loading");
      }

      const access = await Promise.race([
        checkAuthorizedAccess(supabase, session).then((result) => ({
          ...result,
          timedOut: false as const,
        })),
        new Promise<{ timedOut: true }>((resolve) =>
          setTimeout(() => resolve({ timedOut: true }), 8000),
        ),
      ]);

      if (!isMounted) {
        return;
      }

      if (access.timedOut) {
        if (isSessionExpired(session)) {
          await recoverInvalidSession();
          return;
        }
        if (alreadyIn || readAuthHint()) {
          setAuthState("authenticated");
        }
        return;
      }

      if (access.allowed) {
        const hint: AuthHint = {
          email: access.email ?? session.user.email ?? "",
          canEditCatalog: access.canEditCatalog,
        };
        writeAuthHint(hint);
        setAuthState("authenticated");
        setMessage("");
        setSessionEmail(hint.email);
        setCanEditCatalog(hint.canEditCatalog);
        return;
      }

      if (access.transient && (alreadyIn || readAuthHint())) {
        if (isSessionExpired(session)) {
          await recoverInvalidSession();
          return;
        }
        setAuthState("authenticated");
        return;
      }

      clearAuthHint();
      setAuthState("inactive");
      setSessionEmail("");
      setCanEditCatalog(false);
      setMessage(access.reason);
      await signOutLocally(supabase);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void syncSession(session, event);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setAuthState("not_configured");
      setMessage("Supabase baglantisi bulunamadi.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    await signOutLocally(supabase);

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setMessage(
        isInvalidRefreshTokenError(error)
          ? "Oturum suresi dolmus. Tekrar giris yapin."
          : error.message,
      );
      setAuthState("signed_out");
    }

    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setIsSigningOut(true);
    clearAuthHint();
    try {
      await supabase.auth.signOut();
    } catch {
      await signOutLocally(supabase);
    } finally {
      await signOutLocally(supabase);
      setAuthState("signed_out");
      setSessionEmail("");
      setCanEditCatalog(false);
      setIsSigningOut(false);
    }
  };

  if (
    authState === "authenticated" ||
    (authState === "loading" && Boolean(sessionEmail))
  ) {
    return (
      <CalculatorApp
        userEmail={sessionEmail}
        canEditCatalog={canEditCatalog}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    );
  }

  if (!bootstrapped || authState === "loading") {
    return <SessionRestoringScreen />;
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-white to-blue-50">
      <header className="border-b border-white/10 bg-gradient-to-r from-[#0a2440] via-[#0c2e53] to-[#114579] text-white shadow-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 ring-1 ring-amber-200/30 shadow-lg">
            <span className="text-lg font-extrabold text-amber-200" aria-hidden>
              🧮
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-wide">
              Finansman Hesaplayici <span className="text-white/80">| Emin KONYA</span>
            </div>
            <div className="text-xs font-bold text-cyan-100/90">
              Sifreli kullanim icin giris gerekiyor
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-6xl items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 bg-white/95 shadow-xl">
            <CardHeader className="space-y-2 pb-2">
              <LoginRatesBar />
              <CardTitle>Giris Yap</CardTitle>
              <CardDescription>
                Yonetici tarafindan tanimlanan hesap bilgilerinle oturum ac.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold text-slate-700"
                  >
                    E-posta
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@firma.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-bold text-slate-700"
                  >
                    Sifre
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sifrenizi girin"
                    required
                  />
                </div>

                {message ? (
                  <Alert variant={authState === "inactive" ? "destructive" : "default"}>
                    <ShieldAlert aria-hidden />
                    <AlertTitle>
                      {authState === "inactive"
                        ? "Erisim kapali"
                        : "Bilgilendirme"}
                    </AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : null}
                  Giris Yap
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

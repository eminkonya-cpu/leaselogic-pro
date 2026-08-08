"use client";

import CatalogAdminEditor from "@/components/admin/CatalogAdminEditor";
import { CatalogProvider } from "@/contexts/CatalogContext";
import AnnualForwardCalculator from "@/components/finance/AnnualForwardCalculator";
import AnnualReverseCalculator from "@/components/finance/AnnualReverseCalculator";
import ForwardCalculator from "@/components/finance/ForwardCalculator";
import {
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import ReverseCalculator from "@/components/finance/ReverseCalculator";
import LoginRatesBar from "@/components/finance/LoginRatesBar";
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
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { usePersistentState } from "@/lib/usePersistentState";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  LoaderCircle,
  LogOut,
  ShieldAlert,
  UserCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

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
    };

function isRecoverableSessionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes("refresh token") ||
    normalizedMessage.includes("invalid token") ||
    normalizedMessage.includes("session not found")
  );
}

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
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return {
      allowed: false,
      reason:
        "Yetki tablosu okunamadi. Once `SUPABASE_SETUP.md` icindeki SQL adimini tamamla.",
    };
  }

  if (!data?.is_active) {
    return {
      allowed: false,
      reason:
        "Bu hesap su anda aktif degil. Erisimi acmak veya tekrar etkinlestirmek icin yonetici panelinden izin ver.",
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

function CalculatorApp({
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
  const [mode, setMode] = usePersistentState<"forward" | "reverse">(
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

  return (
    <CatalogProvider>
    <div className="min-h-dvh bg-[#f8f9ff]">
      <header className="sticky top-0 z-50 border-b border-[#c3c6d7] bg-[#f8f9ff]">
        <div className="app-shell py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <h1 className="text-xl font-bold text-[#0b1c30]">
                Finansman Hesaplayıcı
              </h1>
              <span className="hidden text-sm font-medium text-[#434655] sm:inline">
                Makine Finansmanı Maliyet Analizi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
              {canEditCatalog ? (
                <Button
                  type="button"
                  variant="outline"
                  className="hidden h-9 border-[#c3c6d7] font-semibold text-[#565e74] md:inline-flex"
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
              <span className="hidden items-center gap-2 rounded-full bg-[#eff4ff] px-3 py-1.5 text-xs font-semibold text-[#0b1c30] sm:inline-flex">
                <UserCircle className="h-5 w-5 text-[#004ac6]" aria-hidden />
                {userEmail}
              </span>
              <Button
                type="button"
                className="h-9 gap-2 bg-[#004ac6] font-semibold hover:bg-[#2563eb]"
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
            <div className="mt-4 flex rounded-xl border border-[#c3c6d7] bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("forward")}
                className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  mode === "forward"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#565e74] hover:bg-[#eff4ff]"
                }`}
              >
                İleri Hesaplama
              </button>
              <button
                type="button"
                onClick={() => setMode("reverse")}
                className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  mode === "reverse"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#565e74] hover:bg-[#eff4ff]"
                }`}
              >
                Geri Hesaplama
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
      <main className="app-shell py-8 text-[15px] leading-relaxed md:text-base">
        {paymentFrequency === "monthly" ? (
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
    </div>
    </CatalogProvider>
  );
}

export function HomeClient() {
  const [authState, setAuthState] = useState<AuthState>(
    isSupabaseConfigured ? "loading" : "not_configured"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    isSupabaseConfigured ? "" : missingConfigMessage
  );
  const [sessionEmail, setSessionEmail] = useState("");
  const [canEditCatalog, setCanEditCatalog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    const syncSession = async (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setAuthState("signed_out");
        setSessionEmail("");
        setCanEditCatalog(false);
        return;
      }

      setAuthState("loading");

      const access = await checkAuthorizedAccess(supabase, session);

      if (!isMounted) {
        return;
      }

      if (access.allowed) {
        setAuthState("authenticated");
        setMessage("");
        setSessionEmail(access.email ?? session.user.email ?? "");
        setCanEditCatalog(access.canEditCatalog);
        return;
      }

      setAuthState("inactive");
      setSessionEmail("");
      setCanEditCatalog(false);
      setMessage(access.reason);
      await supabase.auth.signOut();
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        if (isRecoverableSessionError(error)) {
          void supabase.auth.signOut({ scope: "local" });
          setAuthState("signed_out");
          setMessage("");
          return;
        }

        setAuthState("signed_out");
        setMessage("Oturum okunurken bir hata olustu.");
        return;
      }

      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
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

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
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
    await supabase.auth.signOut();
    setIsSigningOut(false);
  };

  if (authState === "authenticated") {
    return (
      <CalculatorApp
        userEmail={sessionEmail}
        canEditCatalog={canEditCatalog}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    );
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
                  disabled={isSubmitting || authState === "loading"}
                >
                  {isSubmitting || authState === "loading" ? (
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

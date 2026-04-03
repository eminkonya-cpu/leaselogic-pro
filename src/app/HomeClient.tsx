"use client";

import AnnualForwardCalculator from "@/components/finance/AnnualForwardCalculator";
import AnnualReverseCalculator from "@/components/finance/AnnualReverseCalculator";
import ForwardCalculator from "@/components/finance/ForwardCalculator";
import {
  PaymentFrequencySelector,
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import ReverseCalculator from "@/components/finance/ReverseCalculator";
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
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowLeftRight,
  LoaderCircle,
  LogOut,
  ShieldAlert,
  ShieldCheck,
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
    }
  | {
      allowed: false;
      reason: string;
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
    .select("is_active")
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

  return { allowed: true, email };
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
  onSignOut,
  isSigningOut,
}: {
  userEmail: string;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
}) {
  const [mode, setMode] = useState<"forward" | "reverse">("forward");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("monthly");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-white to-blue-50">
      <header className="border-b border-white/10 bg-gradient-to-r from-[#0a2440] via-[#0c2e53] to-[#114579] text-white shadow-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 ring-1 ring-amber-200/30 shadow-lg">
              <span className="text-lg font-extrabold text-amber-200" aria-hidden>
                🧮
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-wide">
                Finansman Hesaplayici{" "}
                <span className="text-white/80">| Emin KONYA</span>
              </div>
              <div className="text-xs font-bold text-cyan-100/90">
                Makine Finansmani Maliyet Analizi
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("forward")}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold transition-all ${
                  mode === "forward"
                    ? "bg-blue-500 text-white shadow-md ring-2 ring-white/30"
                    : "bg-white/10 text-white/85 hover:bg-white/15 hover:text-white"
                }`}
              >
                Ileri Hesaplama
              </button>
              <button
                type="button"
                onClick={() => setMode("reverse")}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold transition-all ${
                  mode === "reverse"
                    ? "bg-rose-500 text-white shadow-md ring-2 ring-white/30"
                    : "bg-white/10 text-white/85 hover:bg-white/15 hover:text-white"
                }`}
              >
                Geri Hesaplama
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 font-bold text-cyan-100">
                Giris: {userEmail}
              </span>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                onClick={onSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : (
                  <LogOut aria-hidden />
                )}
                Cikis Yap
              </Button>
            </div>
          </div>
        </div>
      </header>

      <PaymentFrequencySelector
        value={paymentFrequency}
        onChange={setPaymentFrequency}
      />

      {mode === "reverse" && (
        <div className="border-b border-blue-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9ecf7] text-[#114a72] ring-1 ring-[#b8d9ee]">
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Geri Hesaplama
                {paymentFrequency === "annual" ? (
                  <span className="ml-2 text-xs font-bold text-amber-700">
                    · Yilda bir odeme
                  </span>
                ) : null}
              </div>
              <div className="text-xs font-bold text-slate-600">
                Anahtar teslim fiyatindan net makine bedeline ulasin (KDV haric)
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">
        {paymentFrequency === "monthly" ? (
          mode === "forward" ? (
            <ForwardCalculator />
          ) : (
            <ReverseCalculator />
          )
        ) : mode === "forward" ? (
          <AnnualForwardCalculator />
        ) : (
          <AnnualReverseCalculator />
        )}
      </main>

      <AppFooter />
    </div>
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
        return;
      }

      setAuthState("inactive");
      setSessionEmail("");
      setMessage(access.reason);
      await supabase.auth.signOut();
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
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

      <main className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-6xl items-center px-4 py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-sky-100 bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                Yetkili Kullanim
              </CardTitle>
              <CardDescription>
                Bu hesaplayici sadece senin tanimladigin kullanicilar tarafindan
                kullanilabilir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-slate-700">
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                  Giris icin Supabase uzerinden olusturdugun e-posta ve sifre
                  kullanilir.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  Bir kullaniciyi kapatmak icin Supabase&apos;te
                  `authorized_users` tablosunda `is_active` alanini `false`
                  yapman yeterlidir.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-xl">
            <CardHeader>
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

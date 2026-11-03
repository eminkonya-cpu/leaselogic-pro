"use client";

import {
  getDefaultUiTheme,
  persistUiTheme,
  type LlpUiTheme,
} from "@/lib/bankUiTheme";
import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BankUiContextValue = {
  theme: LlpUiTheme;
  setTheme: (theme: LlpUiTheme) => void;
};

const BankUiContext = createContext<BankUiContextValue | null>(null);

export function useBankUiTheme() {
  const ctx = useContext(BankUiContext);
  if (!ctx) {
    throw new Error("useBankUiTheme BankUiProvider içinde kullanılmalı");
  }
  return ctx;
}

/** Banka görünümünün tamamı `src/styles/bank-modern.css` içinde; burada yalnızca `data-llp-ui` set edilir. */
export function BankUiProvider(props: {
  children: ReactNode;
  /** Tanıtım kaydı vb. — localStorage yok sayılır */
  forceTheme?: LlpUiTheme;
}) {
  const [theme, setThemeState] = useState<LlpUiTheme>(
    props.forceTheme ?? getDefaultUiTheme(),
  );

  useEffect(() => {
    if (props.forceTheme) {
      setThemeState(props.forceTheme);
      return;
    }
    const next = getDefaultUiTheme();
    setThemeState(next);
    persistUiTheme(next);
  }, [props.forceTheme]);

  useEffect(() => {
    document.documentElement.dataset.llpUi = theme;
    return () => {
      delete document.documentElement.dataset.llpUi;
    };
  }, [theme]);

  const setTheme = useCallback((next: LlpUiTheme) => {
    setThemeState(next);
    persistUiTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <BankUiContext.Provider value={value}>
      <div data-llp-ui={theme} className="llp-ui-root min-h-dvh bg-[#f8f9ff]">
        {props.children}
      </div>
    </BankUiContext.Provider>
  );
}

export function BankUiThemeToggle(props: { className?: string }) {
  const { theme, setTheme } = useBankUiTheme();

  const optionClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1 transition-colors",
      active
        ? "bg-[#004ac6] text-white shadow-sm"
        : "text-[#565e74] hover:bg-[#eff4ff]",
    );

  return (
    <div className={cn("flex items-center gap-1.5", props.className)}>
      <span className="llp-theme-label hidden text-[10px] font-semibold uppercase tracking-wide text-[#565e74] sm:inline">
        Görünüm
      </span>
      <div
        className="llp-theme-toggle flex rounded-full border border-[#c3c6d7] bg-white p-0.5 text-[11px] font-semibold"
        role="group"
        aria-label="Görünüm teması"
      >
        <button
          type="button"
          data-active={theme === "classic" ? "true" : "false"}
          aria-pressed={theme === "classic"}
          className={optionClass(theme === "classic")}
          onClick={() => setTheme("classic")}
        >
          Klasik
        </button>
        <button
          type="button"
          data-active={theme === "bank" ? "true" : "false"}
          aria-pressed={theme === "bank"}
          className={optionClass(theme === "bank")}
          onClick={() => setTheme("bank")}
        >
          Banka
        </button>
      </div>
    </div>
  );
}

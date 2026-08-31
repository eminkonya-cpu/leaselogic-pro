"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const TARGET_ID = "opsiyonlar";

export function CatalogScrollRail(props: {
  enabled: boolean;
  /** Sekme vb. değişince hedef yeniden bağlansın */
  observeKey?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!props.enabled) {
      setShow(false);
      return;
    }
    let observer: IntersectionObserver | null = null;
    let target: HTMLElement | null = null;

    const attach = () => {
      target = document.getElementById(TARGET_ID);
      if (!target) {
        setShow(false);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          setShow(!entry.isIntersecting);
        },
        { threshold: 0.05, rootMargin: "0px 0px -72px 0px" },
      );
      observer.observe(target);
    };

    const raf = requestAnimationFrame(attach);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [props.enabled, props.observeKey]);

  if (!props.enabled || !show) {
    return null;
  }

  const scrollToCatalog = () => {
    document.getElementById(TARGET_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004ac6]";

  return (
    <>
      {/* Mobil / tablet: altta sabit şerit */}
      <button
        type="button"
        onClick={scrollToCatalog}
        aria-label="Opsiyonlar ve diğer giderler bölümüne git"
        className={cn(
          "fixed z-40 flex lg:hidden",
          "inset-x-4 bottom-4 max-w-lg mx-auto",
          "items-center justify-center gap-2",
          "rounded-full border border-[#f59e0b]/35 bg-[#f59e0b] px-5 py-3.5 shadow-lg",
          "text-[15px] font-semibold text-white",
          "active:scale-[0.98] transition-transform",
          focusRing,
        )}
      >
        <span>Opsiyonlar ve diğer giderler</span>
        <ChevronDown className="h-5 w-5 shrink-0" aria-hidden />
      </button>

      {/* Masaüstü: sol kenar rail */}
      <button
        type="button"
        onClick={scrollToCatalog}
        aria-label="Opsiyonlar ve diğer giderler bölümüne git"
        className={cn(
          "fixed z-40 hidden lg:flex",
          "left-3 xl:left-6",
          "top-1/2 -translate-y-1/2",
          "flex-col items-center gap-2",
          "rounded-xl border border-[#f59e0b]/30 bg-[#fffbeb]/95 px-2 py-3 shadow-md backdrop-blur-sm",
          "transition-colors hover:border-[#f59e0b]/50 hover:bg-[#fef3c7]",
          focusRing,
        )}
      >
        <span
          className="min-h-[4.5rem] w-0.5 shrink-0 rounded-full bg-gradient-to-b from-[#f59e0b]/25 via-[#f59e0b] to-[#f59e0b]/25"
          aria-hidden
        />
        <ChevronDown className="h-4 w-4 shrink-0 text-[#b45309]" aria-hidden />
        <span
          className="max-w-[3.25rem] text-center text-[11px] font-bold leading-tight text-[#b45309]"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          Opsiyonlar
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#b45309]" aria-hidden />
      </button>
    </>
  );
}

export const CATALOG_SECTION_ID = TARGET_ID;

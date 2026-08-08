"use client";

import { cn } from "@/lib/utils";

/** Hesaplayıcı: ince kur şeridi (giriş alanı üstünde). */
export default function CompactExchangeRatesBar(props: {
  euroRate: number;
  dollarRate?: number;
  onEuroChange: (value: number) => void;
  onDollarChange?: (value: number) => void;
  className?: string;
}) {
  const showUsd = props.dollarRate !== undefined && props.onDollarChange;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200/90 bg-white/90 px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm sm:text-xs",
        props.className,
      )}
    >
      <span className="text-slate-400">Kur (₺)</span>
      <label className="inline-flex items-center gap-1.5">
        <span className="text-[#114a72]">€</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          className="h-7 w-[4.5rem] rounded border border-slate-200 bg-white px-1.5 text-right text-xs font-bold tabular-nums text-slate-800 outline-none focus-visible:border-[#2f5f83] focus-visible:ring-2 focus-visible:ring-[#2f5f83]/20"
          value={props.euroRate || ""}
          onChange={(e) =>
            props.onEuroChange(Number(e.target.value.replace(",", ".")) || 0)
          }
        />
      </label>
      {showUsd ? (
        <label className="inline-flex items-center gap-1.5">
          <span className="text-[#114a72]">$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="h-7 w-[4.5rem] rounded border border-slate-200 bg-white px-1.5 text-right text-xs font-bold tabular-nums text-slate-800 outline-none focus-visible:border-[#2f5f83] focus-visible:ring-2 focus-visible:ring-[#2f5f83]/20"
            value={props.dollarRate || ""}
            onChange={(e) =>
              props.onDollarChange?.(
                Number(e.target.value.replace(",", ".")) || 0,
              )
            }
          />
        </label>
      ) : null}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { formatNumber } from "./format";

export default function RateProjectionInput(props: {
  baseRate: number;
  monthlyGrowthPct: number;
  onGrowthChange: (v: number) => void;
  onReset: () => void;
  months: number;
  computedRates: number[];
}) {
  return (
    <Card className="overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur">
      <CardHeader className="relative border-t-4 border-[#f7c948] bg-[#113a5a] px-3 pb-3 pt-3.5 text-white sm:pb-3.5 sm:pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2.5 z-10 h-7 px-2 text-[11px] text-white hover:bg-white/15 md:right-3 md:top-3 md:h-8 md:text-xs"
          onClick={props.onReset}
        >
          Sıfırla
        </Button>
        <CardTitle className="flex w-full items-center justify-start gap-2 pr-14 text-left text-[13px] font-extrabold tracking-tight text-white md:pr-16 md:text-[15px] lg:flex-col lg:justify-center lg:text-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm md:h-9 md:w-9">
            <TrendingUp className="h-4 w-4 md:h-[18px] md:w-[18px]" />
          </span>
          <span className="leading-snug">Kur Projeksiyonu</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-3 sm:pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 sm:text-xs">
              Başlangıç Kur (₺/€)
            </div>
            <Input
              value={formatNumber(props.baseRate, { decimals: 2 })}
              readOnly
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 sm:text-xs">
              Aylık Kur Artışı (%)
            </div>
            <Input
              type="number"
              step="0.1"
              value={String(props.monthlyGrowthPct)}
              onChange={(e) =>
                props.onGrowthChange(Number(e.target.value || 0))
              }
            />
          </div>
          <div className="hidden md:block" />
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <div className="text-[11px] font-bold text-slate-600 sm:text-xs">
            {props.months} ay boyunca aylık %{formatNumber(props.monthlyGrowthPct, { decimals: 2 })}{" "}
            artış uygular
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2 md:grid-cols-12">
            {props.computedRates.slice(0, props.months).map((r, i) => (
              <div
                key={i}
                className="rounded-md bg-muted/40 px-2 py-1 text-center text-[11px] tabular-nums font-bold"
                title={`Ay ${i + 1}`}
              >
                <div className="text-[10px] font-semibold text-muted-foreground">
                  Ay {i + 1}
                </div>
                <div className="font-extrabold">{formatNumber(r, { decimals: 2 })}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

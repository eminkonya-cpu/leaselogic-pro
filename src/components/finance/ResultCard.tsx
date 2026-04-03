"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "./format";

type Row = {
  label: string;
  value: number | null;
  highlight?: boolean;
  note?: boolean;
};

export default function ResultCard(props: {
  title: string;
  icon: LucideIcon;
  currency: string;
  rows: Row[];
  noDecimals?: boolean;
  className?: string;
}) {
  const Icon = props.icon;
  const decimals = props.noDecimals ? 0 : 2;
  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur",
        props.className,
      )}
    >
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-3 pb-3.5 pt-4 text-white">
        <CardTitle className="flex w-full flex-col items-center justify-center gap-2 text-center text-[15px] font-extrabold tracking-tight text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="max-w-[18rem] leading-snug">{props.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-4">
        {props.rows.map((r, idx) => {
          if (r.note) {
            return (
              <div
                key={idx}
                className="pt-2 text-[11px] font-semibold italic text-slate-500"
              >
                {r.label}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                r.highlight &&
                  "bg-gradient-to-r from-amber-50 to-amber-100 font-extrabold",
              )}
            >
              <div className="text-xs font-bold text-slate-600">{r.label}</div>
              <div className="tabular-nums text-base font-extrabold text-slate-900">
                {r.value === null
                  ? "-"
                  : `${formatNumber(r.value, {
                      decimals,
                      noDecimals: props.noDecimals,
                    })} ${props.currency}`}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

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
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white sm:px-3 sm:pb-3.5 sm:pt-4">
        <CardTitle className="flex w-full items-center justify-start gap-2 text-left text-[13px] font-extrabold tracking-tight text-white sm:flex-col sm:justify-center sm:gap-2 sm:text-center sm:text-[15px]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm sm:h-9 sm:w-9">
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <span className="max-w-[18rem] leading-snug">{props.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-2.5 pt-2.5 sm:px-6 sm:pt-4">
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
                "flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] sm:text-sm",
                r.highlight &&
                  "bg-gradient-to-r from-amber-50 to-amber-100 font-extrabold",
              )}
            >
              <div className="text-[11px] font-bold text-slate-600 sm:text-xs">{r.label}</div>
              <div className="tabular-nums text-[15px] font-extrabold text-slate-900 sm:text-base">
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

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
  tabletCompact?: boolean;
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
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white lg:px-3 lg:pb-3.5 lg:pt-4">
        <CardTitle
          className={cn(
            "flex w-full items-center justify-start gap-2 text-left text-[13px] font-extrabold tracking-tight text-white lg:flex-col lg:justify-center lg:gap-2 lg:text-center lg:text-[15px]",
            props.tabletCompact && "sm:text-[12px] sm:leading-tight lg:text-[15px]",
          )}
        >
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm lg:h-9 lg:w-9",
              props.tabletCompact && "sm:h-7 sm:w-7 lg:h-9 lg:w-9",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 lg:h-[18px] lg:w-[18px]",
                props.tabletCompact && "sm:h-3.5 sm:w-3.5 lg:h-[18px] lg:w-[18px]",
              )}
            />
          </span>
          <span
            className={cn(
              "max-w-[18rem] leading-snug",
              props.tabletCompact && "sm:max-w-[11rem] lg:max-w-[18rem]",
            )}
          >
            {props.title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-2.5 pt-2.5 lg:px-6 lg:pt-4">
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
                "flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] lg:text-sm",
                props.tabletCompact && "sm:text-[12px] lg:text-sm",
                r.highlight &&
                  "bg-gradient-to-r from-amber-50 to-amber-100 font-extrabold",
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-bold text-slate-600 lg:text-xs",
                  props.tabletCompact && "sm:text-[10px] lg:text-xs",
                )}
              >
                {r.label}
              </div>
              <div
                className={cn(
                  "whitespace-nowrap tabular-nums text-[15px] font-extrabold text-slate-900 lg:text-base",
                  props.tabletCompact && "sm:text-[13px] lg:text-base",
                )}
              >
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

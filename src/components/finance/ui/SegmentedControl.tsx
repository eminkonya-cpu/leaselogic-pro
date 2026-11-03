"use client";

import {
  CALC_CHIP_BASE_CLS,
  CALC_CHIP_GROUP_CLS,
  CALC_FOCUS_RING,
  calcChipStateCls,
} from "@/components/finance/ui/CalcFormChrome";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export default function SegmentedControl<T extends string>(props: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "default" | "large";
}) {
  const large = props.size === "large";
  return (
    <div
      className={cn(CALC_CHIP_GROUP_CLS, props.className)}
      role="tablist"
    >
      {props.options.map((opt) => {
        const active = props.value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-promo-forward-tab={opt.value}
            onClick={() => props.onChange(opt.value)}
            className={cn(
              CALC_CHIP_BASE_CLS,
              "flex-1",
              CALC_FOCUS_RING,
              large
                ? "min-h-11 px-3 text-sm sm:min-w-[8rem]"
                : "h-8 px-2.5 text-[13px] sm:min-w-[6.5rem]",
              calcChipStateCls(active),
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

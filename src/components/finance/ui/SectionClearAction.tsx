"use client";

import { CALC_FOCUS_RING } from "@/components/finance/ui/CalcFormChrome";
import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";

export default function SectionClearAction(props: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  const label = props.label ?? "Temizle";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9] motion-reduce:transition-none",
        CALC_FOCUS_RING,
        props.className,
      )}
      onClick={props.onClick}
      title={label}
      aria-label={label}
    >
      <Eraser className="h-3.5 w-3.5" aria-hidden />
      Temizle
    </button>
  );
}

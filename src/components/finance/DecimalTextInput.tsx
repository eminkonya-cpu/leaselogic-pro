"use client";

import { Input } from "@/components/ui/input";
import {
  formatDecimalForInput,
  formatDecimalIdle,
  isIncompleteDecimal,
  parseTurkishDecimal,
  roundDecimal,
  sanitizeDecimalTyping,
  sanitizeIntegerTyping,
} from "@/lib/turkishDecimalInput";
import { cn } from "@/lib/utils";
import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
  /** Odak yokken görünen birim (ör. €). */
  suffix?: string;
  decimals?: number;
};

export default function DecimalTextInput({
  value,
  onValueChange,
  className,
  onFocus,
  onBlur,
  suffix,
  decimals = 2,
  ...rest
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const integer = decimals <= 0;
  const shown = editing ? draft : formatDecimalIdle(value, decimals);

  return (
    <div className="relative min-w-0">
      <Input
        {...rest}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        autoComplete="off"
        className={cn(suffix && "pr-7", className)}
        value={shown}
        onFocus={(e) => {
          setEditing(true);
          setDraft(
            integer
              ? Number.isFinite(value) && value !== 0
                ? String(Math.trunc(value))
                : ""
              : formatDecimalForInput(value),
          );
          onFocus?.(e);
        }}
        onBlur={(e) => {
          const n = integer
            ? Math.trunc(parseTurkishDecimal(draft))
            : roundDecimal(parseTurkishDecimal(draft), decimals);
          onValueChange(n);
          setEditing(false);
          setDraft("");
          onBlur?.(e);
        }}
        onChange={(e) => {
          const raw = integer
            ? sanitizeIntegerTyping(e.target.value)
            : sanitizeDecimalTyping(e.target.value);
          setDraft(raw);
          if (integer || !isIncompleteDecimal(raw)) {
            onValueChange(
              integer
                ? Math.trunc(parseTurkishDecimal(raw))
                : roundDecimal(parseTurkishDecimal(raw), decimals),
            );
          }
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm font-bold tabular-nums text-[#004ac6]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

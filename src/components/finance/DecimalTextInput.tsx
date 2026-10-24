"use client";

import { Input } from "@/components/ui/input";
import {
  formatDecimalForInput,
  isIncompleteDecimal,
  parseTurkishDecimal,
  sanitizeDecimalTyping,
} from "@/lib/turkishDecimalInput";
import { cn } from "@/lib/utils";
import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
};

export default function DecimalTextInput({
  value,
  onValueChange,
  className,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const shown = editing ? draft : formatDecimalForInput(value);

  return (
    <Input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={cn(className)}
      value={shown}
      onFocus={(e) => {
        setEditing(true);
        setDraft(formatDecimalForInput(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        const n = parseTurkishDecimal(draft);
        onValueChange(n);
        setEditing(false);
        setDraft("");
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = sanitizeDecimalTyping(e.target.value);
        setDraft(raw);
        if (!isIncompleteDecimal(raw)) {
          onValueChange(parseTurkishDecimal(raw));
        }
      }}
    />
  );
}

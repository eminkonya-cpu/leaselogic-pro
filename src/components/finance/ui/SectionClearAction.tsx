"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";

export default function SectionClearAction(props: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  const label = props.label ?? "Temizle";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 border-[#c3c6d7] text-[#565e74] hover:bg-[#eff4ff] hover:text-[#004ac6]",
        props.className,
      )}
      onClick={props.onClick}
      title={label}
      aria-label={label}
    >
      <Eraser className="h-4 w-4" />
    </Button>
  );
}

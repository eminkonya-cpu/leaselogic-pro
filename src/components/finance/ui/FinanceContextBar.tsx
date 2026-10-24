"use client";

import {
  PaymentFrequencySelector,
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export default function FinanceContextBar(props: {
  paymentFrequency: PaymentFrequency;
  onPaymentFrequencyChange: (v: PaymentFrequency) => void;
  pdfCurrency: "EUR" | "TRY";
  setPdfCurrency: (c: "EUR" | "TRY") => void;
  euroRate: number;
  onEuroRateChange: (value: number) => void;
  onRefreshEuroRate: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "finance-context-bar flex flex-col gap-3 rounded-xl border border-[#c3c6d7] bg-white px-3 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:px-4",
        props.className,
      )}
    >
      <div className="w-auto shrink-0">
        <PaymentFrequencySelector
          variant="segment"
          value={props.paymentFrequency}
          onChange={props.onPaymentFrequencyChange}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end sm:gap-4 sm:justify-end">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#434655] md:text-[13px]">
            Para birimi
          </Label>
          <div className="llp-segment flex rounded-lg border border-[#c3c6d7] bg-[#f8f9ff] p-0.5">
            <button
              type="button"
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                props.pdfCurrency === "EUR"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "text-[#565e74] hover:bg-white",
              )}
              onClick={() => props.setPdfCurrency("EUR")}
            >
              EUR
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                props.pdfCurrency === "TRY"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "text-[#565e74] hover:bg-white",
              )}
              onClick={() => props.setPdfCurrency("TRY")}
            >
              TL
            </button>
          </div>
        </div>

        <div className="min-w-[10rem] flex-1 space-y-1 sm:max-w-[14rem]">
          <Label className="text-xs font-semibold text-[#434655] md:text-[13px]">
            Kur (₺ / €)
          </Label>
          <div className="flex gap-2">
            <Input
              className="h-9 border-[#c3c6d7] bg-white text-sm tabular-nums"
              type="number"
              step="0.01"
              value={props.euroRate || ""}
              onChange={(e) =>
                props.onEuroRateChange(
                  Number(e.target.value.replace(",", ".")) || 0,
                )
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-[#c3c6d7]"
              onClick={props.onRefreshEuroRate}
              title="Referans kur"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

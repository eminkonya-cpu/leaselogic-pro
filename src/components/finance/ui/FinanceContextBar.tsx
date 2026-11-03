"use client";

import {
  PaymentFrequencySelector,
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import DecimalTextInput from "@/components/finance/DecimalTextInput";
import {
  CALC_CHIP_BASE_CLS,
  CALC_CHIP_GROUP_CLS,
  CALC_INPUT_CLS,
  FormField,
  headerChipStateCls,
  PlanToggleButton,
  PlanToggleGroup,
} from "@/components/finance/ui/CalcFormChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function PlanContextFields(props: {
  paymentFrequency?: PaymentFrequency;
  onPaymentFrequencyChange?: (v: PaymentFrequency) => void;
  pdfCurrency: "EUR" | "TRY";
  setPdfCurrency: (c: "EUR" | "TRY") => void;
  euroRate: number;
  onEuroRateChange: (value: number) => void;
  onRefreshEuroRate: () => void;
}) {
  return (
    <>
      {props.paymentFrequency && props.onPaymentFrequencyChange ? (
        <FormField label="Ödeme sıklığı">
          {(id) => (
            <PlanToggleGroup aria-label="Ödeme sıklığı">
              <span id={id} className="sr-only">
                Ödeme sıklığı
              </span>
              <PlanToggleButton
                active={props.paymentFrequency === "monthly"}
                onClick={() => props.onPaymentFrequencyChange?.("monthly")}
              >
                Aylık
              </PlanToggleButton>
              <PlanToggleButton
                active={props.paymentFrequency === "annual"}
                onClick={() => props.onPaymentFrequencyChange?.("annual")}
              >
                Yılda bir
              </PlanToggleButton>
            </PlanToggleGroup>
          )}
        </FormField>
      ) : null}
      <FormField label="Para birimi">
        {(id) => (
          <PlanToggleGroup aria-label="Para birimi">
            <span id={id} className="sr-only">
              Para birimi
            </span>
            <PlanToggleButton
              active={props.pdfCurrency === "EUR"}
              onClick={() => props.setPdfCurrency("EUR")}
            >
              EUR
            </PlanToggleButton>
            <PlanToggleButton
              active={props.pdfCurrency === "TRY"}
              onClick={() => props.setPdfCurrency("TRY")}
            >
              TL
            </PlanToggleButton>
          </PlanToggleGroup>
        )}
      </FormField>
      <FormField label="Kur" suffix="₺ / €">
        {(id) => (
          <div className="flex gap-2">
            <DecimalTextInput
              id={id}
              className={cn(CALC_INPUT_CLS, "min-w-0 flex-1")}
              value={props.euroRate}
              onValueChange={props.onEuroRateChange}
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]"
              onClick={props.onRefreshEuroRate}
              title="Referans kur"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
      </FormField>
    </>
  );
}

export function PlanFinancingSupportField(props: {
  value: number;
  onValueChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <FormField
      label="Finansman desteği"
      hint="İsteğe bağlı"
      suffix={props.suffix ?? "€"}
      className="sm:col-span-2"
    >
      {(id) => (
        <DecimalTextInput
          id={id}
          data-promo-field="financingSupportEuro"
          className={CALC_INPUT_CLS}
          placeholder="0"
          value={props.value}
          onValueChange={props.onValueChange}
        />
      )}
    </FormField>
  );
}

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
          <div className={cn("llp-segment", CALC_CHIP_GROUP_CLS)}>
            <button
              type="button"
              className={cn(
                CALC_CHIP_BASE_CLS,
                "px-4 py-1.5 text-sm",
                headerChipStateCls(props.pdfCurrency === "EUR"),
              )}
              onClick={() => props.setPdfCurrency("EUR")}
            >
              EUR
            </button>
            <button
              type="button"
              className={cn(
                CALC_CHIP_BASE_CLS,
                "px-4 py-1.5 text-sm",
                headerChipStateCls(props.pdfCurrency === "TRY"),
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

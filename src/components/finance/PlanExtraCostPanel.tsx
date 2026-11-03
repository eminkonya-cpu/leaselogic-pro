"use client";

import DecimalTextInput from "@/components/finance/DecimalTextInput";
import { formatNumber } from "@/components/finance/format";
import {
  computeKaskoFromMachinePrice,
  type CatalogServiceFees,
  type ExtraCostFieldKey,
  type ServiceFeeApplyMode,
  type ServiceFeeModes,
} from "@/lib/catalogServiceFees";
import type { ExtraCostPaymentMode } from "@/lib/leasingPaymentPlan";
import { cn } from "@/lib/utils";
import { ListChecks, PencilLine } from "lucide-react";

const ROWS: {
  key: ExtraCostFieldKey;
  label: string;
  modeKey: "fileFee" | "totalInsurance" | "importCost" | "attachmentCost";
  amountKey: "fileFee" | "totalInsurance" | "importCost" | "attachmentCost";
  supportsAuto: boolean;
}[] = [
  {
    key: "kasko",
    label: "Toplam kasko maliyeti",
    modeKey: "totalInsurance",
    amountKey: "totalInsurance",
    supportsAuto: true,
  },
  {
    key: "fileFee",
    label: "Dosya masrafı",
    modeKey: "fileFee",
    amountKey: "fileFee",
    supportsAuto: true,
  },
  {
    key: "importCost",
    label: "İthalat maliyeti",
    modeKey: "importCost",
    amountKey: "importCost",
    supportsAuto: true,
  },
  {
    key: "attachmentCost",
    label: "Ataşman ve donanım maliyeti",
    modeKey: "attachmentCost",
    amountKey: "attachmentCost",
    supportsAuto: false,
  },
];

export default function PlanExtraCostPanel(props: {
  variant?: "plan" | "finance";
  machinePriceEuro: number;
  fees: CatalogServiceFees;
  modes: ServiceFeeModes;
  amounts: {
    totalInsurance: number;
    fileFee: number;
    importCost: number;
    attachmentCost: number;
  };
  /** Plan/balon: vadeye göre toplam kasko; verilmezse yıllık % uygulanır. */
  kaskoAutoTotal?: number;
  kaskoTermHint?: string;
  extraCostModes: Record<
    "fileFee" | "totalInsurance" | "importCost" | "attachmentCost",
    ExtraCostPaymentMode
  >;
  onSetMode: (key: ExtraCostFieldKey, mode: ServiceFeeApplyMode) => void;
  onAmountChange: (
    key: "totalInsurance" | "fileFee" | "importCost" | "attachmentCost",
    value: number,
  ) => void;
  onPaymentModeChange: (
    key: "fileFee" | "totalInsurance" | "importCost" | "attachmentCost",
    mode: ExtraCostPaymentMode,
  ) => void;
  inputClassName?: string;
  hideTitle?: boolean;
  className?: string;
}) {
  const variant = props.variant ?? "plan";
  const visibleRows =
    variant === "finance"
      ? ROWS.filter((r) => r.key !== "attachmentCost")
      : ROWS;
  const inputCls = props.inputClassName ?? "";

  const autoAmount = (key: ExtraCostFieldKey): number => {
    switch (key) {
      case "kasko":
        if (props.kaskoAutoTotal != null && props.kaskoAutoTotal > 0) {
          return props.kaskoAutoTotal;
        }
        return computeKaskoFromMachinePrice(
          props.machinePriceEuro,
          props.fees.kaskoPercentOfMachine,
        );
      case "fileFee":
        return props.fees.fileFeeEuro;
      case "importCost":
        return props.fees.importCostEuro;
      default:
        return 0;
    }
  };

  const listConfigured = (key: ExtraCostFieldKey) => {
    if (key === "kasko") return props.fees.kaskoPercentOfMachine > 0;
    if (key === "fileFee") return props.fees.fileFeeEuro > 0;
    if (key === "importCost") return props.fees.importCostEuro > 0;
    return false;
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#fbbf24]/40 bg-[#fffbeb]/80 p-3 shadow-sm",
        props.className,
      )}
    >
      {!props.hideTitle ? (
        <p className="text-sm font-semibold text-[#0b1c30]">Ek maliyet kalemleri</p>
      ) : null}
      <ul className={props.hideTitle ? "space-y-2" : "mt-3 space-y-2"}>
        {visibleRows.map((row) => {
          const mode = props.modes[row.key];
          const active = mode !== "off";
          const autoOk = row.supportsAuto && listConfigured(row.key);
          const displayAuto = autoAmount(row.key);
          const amount = props.amounts[row.amountKey];

          return (
            <li
              key={row.key}
              className={cn(
                "rounded-lg border px-3 py-2.5",
                active
                  ? "border-[#f59e0b]/45 bg-white ring-1 ring-[#f59e0b]/15"
                  : "border-[#c3c6d7]/70 bg-white",
              )}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex shrink-0 items-center gap-1">
                  {row.supportsAuto ? (
                    <button
                      type="button"
                      title={
                        autoOk
                          ? "Fiyat listesinden uygula"
                          : "Fiyat listesinde tanım yok"
                      }
                      disabled={!autoOk}
                      onClick={() =>
                        props.onSetMode(
                          row.key,
                          mode === "auto" ? "off" : "auto",
                        )
                      }
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                        mode === "auto"
                          ? "border-[#f59e0b] bg-[#f59e0b] text-white"
                          : autoOk
                            ? "border-[#c3c6d7] bg-[#f8f9ff] text-[#004ac6] hover:border-[#f59e0b]/50"
                            : "cursor-not-allowed border-[#c3c6d7]/60 bg-slate-50 text-slate-300",
                      )}
                    >
                      <ListChecks className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="Manuel tutar"
                    onClick={() =>
                      props.onSetMode(
                        row.key,
                        mode === "manual" ? "off" : "manual",
                      )
                    }
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                      mode === "manual"
                        ? "border-[#0b1c30] bg-[#0b1c30] text-white"
                        : "border-[#c3c6d7] bg-white text-[#565e74] hover:border-[#0b1c30]/30",
                    )}
                  >
                    <PencilLine className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="min-w-[8rem] flex-1">
                  <p className="text-sm font-semibold text-[#0b1c30]">{row.label}</p>
                  {mode === "auto" && autoOk ? (
                    <p className="text-[11px] text-[#565e74]">
                      {row.key === "kasko" && props.kaskoTermHint
                        ? props.kaskoTermHint
                        : row.key === "kasko"
                          ? `Makine bedelinin %${formatNumber(props.fees.kaskoPercentOfMachine, { decimals: 2 })}`
                          : "Fiyat listesinden"}
                    </p>
                  ) : mode === "manual" ? (
                    <p className="mt-0.5 inline-flex rounded-md bg-[#0F172A] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FDE68A]">
                      Manuel giriş
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8b93a7]">Hesaba dahil değil</p>
                  )}
                </div>

                <div className="w-full min-w-[7rem] sm:ml-auto sm:w-auto sm:text-right">
                  {mode === "manual" ? (
                    <DecimalTextInput
                      className={cn(inputCls, "h-9 max-w-[10rem] sm:ml-auto")}
                      value={amount}
                      onValueChange={(n) =>
                        props.onAmountChange(row.amountKey, n)
                      }
                    />
                  ) : (
                    <span className="text-sm font-bold tabular-nums text-[#004ac6]">
                      {formatNumber(
                        mode === "auto" ? displayAuto : 0,
                        { decimals: 2 },
                      )}{" "}
                      €
                    </span>
                  )}
                </div>
              </div>

              {active && variant === "plan" ? (
                <div className="mt-2 border-t border-[#c3c6d7]/40 pt-2">
                  <label className="text-[11px] font-semibold text-[#565e74]">
                    Ödeme şekli
                  </label>
                  <select
                    className={cn(
                      inputCls,
                      "mt-1 h-9 w-full max-w-xs rounded-md border px-2 text-xs font-semibold",
                    )}
                    value={props.extraCostModes[row.modeKey]}
                    onChange={(e) =>
                      props.onPaymentModeChange(
                        row.modeKey,
                        e.target.value as ExtraCostPaymentMode,
                      )
                    }
                  >
                    <option value="cash">Peşin</option>
                    <option value="financed">Plana (vade farkı)</option>
                  </select>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import PlanExtraCostPanel from "@/components/finance/PlanExtraCostPanel";
import type { PaymentFrequency } from "@/components/finance/PaymentFrequencySelector";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  applyKaskoSplitToExpenses,
  applyManualKaskoTotal,
  clearKaskoExpenses,
  computeKaskoTotalForTerm,
  financeExpensesToPanelAmounts,
  syncFinanceExpensesFromModes,
  termToKaskoMonths,
  type FinanceExpenses,
} from "@/lib/financeExpenseCatalog";
import {
  EMPTY_SERVICE_FEE_MODES,
  type ExtraCostFieldKey,
  type ServiceFeeApplyMode,
  type ServiceFeeModes,
} from "@/lib/catalogServiceFees";
import { usePersistentState } from "@/lib/usePersistentState";
import { useCallback, useEffect, useMemo } from "react";

export default function FinanceCatalogExpensePanel(props: {
  modesStorageKey: string;
  machinePriceEuro: number;
  term: number;
  paymentFrequency: PaymentFrequency;
  expenses: FinanceExpenses;
  onExpensesChange: (next: FinanceExpenses) => void;
  inputClassName?: string;
  hideTitle?: boolean;
  className?: string;
}) {
  const { serviceFees } = useCatalogCategories();
  const [feeModes, setFeeModes] = usePersistentState<ServiceFeeModes>(
    props.modesStorageKey,
    EMPTY_SERVICE_FEE_MODES,
  );

  const amounts = useMemo(
    () => financeExpensesToPanelAmounts(props.expenses),
    [props.expenses],
  );

  const kaskoMonths = termToKaskoMonths(props.term, props.paymentFrequency);
  const autoKaskoTotal = computeKaskoTotalForTerm(
    props.machinePriceEuro,
    serviceFees.kaskoPercentOfMachine,
    props.term,
    props.paymentFrequency,
  );

  useEffect(() => {
    const hasAuto =
      feeModes.kasko === "auto" ||
      feeModes.fileFee === "auto" ||
      feeModes.importCost === "auto";
    if (!hasAuto) return;

    const next = syncFinanceExpensesFromModes({
      expenses: props.expenses,
      modes: feeModes,
      amounts,
      machinePriceEuro: props.machinePriceEuro,
      kaskoPercent: serviceFees.kaskoPercentOfMachine,
      fileFeeEuro: serviceFees.fileFeeEuro,
      importCostEuro: serviceFees.importCostEuro,
      term: props.term,
      paymentFrequency: props.paymentFrequency,
    });

    if (JSON.stringify(next) !== JSON.stringify(props.expenses)) {
      props.onExpensesChange(next);
    }
  }, [
    feeModes,
    props.machinePriceEuro,
    props.term,
    props.paymentFrequency,
    serviceFees.kaskoPercentOfMachine,
    serviceFees.fileFeeEuro,
    serviceFees.importCostEuro,
    props.onExpensesChange,
    props.expenses,
    amounts,
  ]);

  const handleSetMode = useCallback(
    (key: ExtraCostFieldKey, mode: ServiceFeeApplyMode) => {
      if (key === "attachmentCost") return;
      setFeeModes((prev) => ({ ...prev, [key]: mode }));

      let next = { ...props.expenses };
      if (key === "kasko") {
        if (mode === "off") next = clearKaskoExpenses(next);
        else if (mode === "auto") {
          next = applyKaskoSplitToExpenses(
            next,
            props.machinePriceEuro,
            serviceFees.kaskoPercentOfMachine,
            props.term,
            props.paymentFrequency,
          );
        }
      } else if (key === "fileFee") {
        next.leasingCost =
          mode === "off"
            ? 0
            : mode === "auto"
              ? serviceFees.fileFeeEuro
              : next.leasingCost;
      } else if (key === "importCost") {
        next.importCost =
          mode === "off"
            ? 0
            : mode === "auto"
              ? serviceFees.importCostEuro
              : next.importCost;
      }
      props.onExpensesChange(next);
    },
    [
      props.expenses,
      props.onExpensesChange,
      props.machinePriceEuro,
      props.term,
      props.paymentFrequency,
      serviceFees,
      setFeeModes,
    ],
  );

  const handleAmountChange = useCallback(
    (
      field: "totalInsurance" | "fileFee" | "importCost" | "attachmentCost",
      value: number,
    ) => {
      let next = { ...props.expenses };
      if (field === "totalInsurance") {
        next = applyManualKaskoTotal(next, value);
      } else if (field === "fileFee") {
        next.leasingCost = value;
      } else if (field === "importCost") {
        next.importCost = value;
      }
      props.onExpensesChange(next);
    },
    [props.expenses, props.onExpensesChange],
  );

  return (
    <PlanExtraCostPanel
      variant="finance"
      hideTitle={props.hideTitle}
      className={props.className}
      machinePriceEuro={props.machinePriceEuro}
      fees={serviceFees}
      modes={feeModes}
      amounts={amounts}
      kaskoAutoTotal={autoKaskoTotal}
      kaskoTermHint={
        serviceFees.kaskoPercentOfMachine > 0 && kaskoMonths > 0
          ? `${kaskoMonths} ay × (bedelin %${serviceFees.kaskoPercentOfMachine} / 12)`
          : undefined
      }
      extraCostModes={{
        fileFee: "cash",
        totalInsurance: "cash",
        importCost: "cash",
        attachmentCost: "cash",
      }}
      inputClassName={props.inputClassName}
      onSetMode={handleSetMode}
      onAmountChange={handleAmountChange}
      onPaymentModeChange={() => {}}
    />
  );
}

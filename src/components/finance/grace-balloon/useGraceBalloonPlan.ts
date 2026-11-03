"use client";

import type { FinanceKpiItem } from "@/components/finance/ui/FinanceKpiStrip";
import type { PrintableGraceBalloonSummaryProps } from "@/components/finance/PrintableGraceBalloonSummary";
import type { PrintableGraceBalloonProps } from "@/components/finance/PrintableGraceBalloonPlan";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  EMPTY_SERVICE_FEE_MODES,
  SERVICE_FEE_MODES_KEY,
  type ExtraCostFieldKey,
  type ServiceFeeApplyMode,
  type ServiceFeeModes,
} from "@/lib/catalogServiceFees";
import { computeKaskoTotalForTerm } from "@/lib/financeExpenseCatalog";
import type { FinancingSupportCompare } from "@/lib/financingSupportReport";
import {
  buildGraceBalloonDetailedReportRows,
  buildGraceBalloonStitchSummaryRows,
  formatGraceBalloonPlanTerm,
} from "@/lib/graceBalloonSummaryRows";
import {
  computeLeasingPaymentPlan,
  DEFAULT_EXTRA_COST_MODES,
  defaultBalloons,
  defaultMonthModes,
  type ExtraCostModes,
  type PaymentMonthMode,
} from "@/lib/leasingPaymentPlan";
import {
  computeLeasingPaymentPlanReverse,
  type LeasingPlanReverseResult,
} from "@/lib/leasingPaymentPlanReverse";
import { usePersistentState } from "@/lib/usePersistentState";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";

const STORAGE = "llp:v2:grace-balloon-plan";
const DIRECTION_KEY = "llp:v2:grace-balloon:direction";

/** Varsayılan ödemesiz ay sayısı (modül adındaki “3 ay”). */
export const DEFAULT_GRACE_MONTHS = 3;

export type PlanDirection = "forward" | "reverse";

export type PlanState = {
  firma: string;
  makine: string;
  machinePrice: number;
  targetCustomerTotal: number;
  downPayment: number;
  annualRate: number;
  termMonths: number;
  startDate: string;
  currency: string;
  financingSupport: number;
  fileFee: number;
  totalInsurance: number;
  importCost: number;
  attachmentCost: number;
  extraCostModes: ExtraCostModes;
  monthModes: PaymentMonthMode[];
  balloons: number[];
};

const EXTRA_COST_FIELDS: {
  amountKey: keyof Pick<
    PlanState,
    "fileFee" | "totalInsurance" | "importCost" | "attachmentCost"
  >;
  modeKey: keyof ExtraCostModes;
  label: string;
}[] = [
  { amountKey: "fileFee", modeKey: "fileFee", label: "Dosya masrafı" },
  { amountKey: "totalInsurance", modeKey: "totalInsurance", label: "Toplam kasko maliyeti" },
  { amountKey: "importCost", modeKey: "importCost", label: "İthalat maliyeti" },
  { amountKey: "attachmentCost", modeKey: "attachmentCost", label: "Ataşman ve donanım maliyeti" },
];

const DEFAULT_STATE: PlanState = {
  firma: "",
  makine: "",
  machinePrice: 0,
  targetCustomerTotal: 0,
  downPayment: 0,
  annualRate: 0,
  termMonths: 36,
  startDate: new Date().toISOString().slice(0, 10),
  currency: "EUR",
  financingSupport: 0,
  fileFee: 0,
  totalInsurance: 0,
  importCost: 0,
  attachmentCost: 0,
  extraCostModes: { ...DEFAULT_EXTRA_COST_MODES },
  monthModes: defaultMonthModes(36),
  balloons: defaultBalloons(36),
};

function parseIntField(raw: string): number {
  const n = Math.trunc(Number(raw.replace(/\D/g, "")));
  return Number.isFinite(n) ? n : 0;
}

function resizeSchedule(
  prevModes: PaymentMonthMode[],
  prevBalloons: number[],
  newTerm: number,
): { monthModes: PaymentMonthMode[]; balloons: number[] } {
  const def = defaultMonthModes(newTerm);
  const monthModes = def.map((d, i) => prevModes[i] ?? d);
  const balloons = defaultBalloons(newTerm).map((d, i) => prevBalloons[i] ?? d);
  return { monthModes, balloons };
}

/** Eski localStorage kayıtlarında eksik alanları tamamlar (sayfa çökmesini önler). */
function normalizePlanState(raw: Partial<PlanState>): PlanState {
  const term = Math.max(1, Math.trunc(Number(raw.termMonths) || DEFAULT_STATE.termMonths));
  const monthModes =
    raw.monthModes && raw.monthModes.length > 0
      ? defaultMonthModes(term).map((d, i) => raw.monthModes![i] ?? d)
      : defaultMonthModes(term);
  const balloons =
    raw.balloons && raw.balloons.length > 0
      ? defaultBalloons(term).map((d, i) => raw.balloons![i] ?? d)
      : defaultBalloons(term);
  return {
    ...DEFAULT_STATE,
    ...raw,
    firma: typeof raw.firma === "string" ? raw.firma : DEFAULT_STATE.firma,
    makine: typeof raw.makine === "string" ? raw.makine : DEFAULT_STATE.makine,
    termMonths: term,
    extraCostModes: { ...DEFAULT_EXTRA_COST_MODES, ...raw.extraCostModes },
    monthModes,
    balloons,
  };
}

function amountFieldForKey(
  key: ExtraCostFieldKey,
): "totalInsurance" | "fileFee" | "importCost" | "attachmentCost" {
  switch (key) {
    case "kasko":
      return "totalInsurance";
    case "fileFee":
      return "fileFee";
    case "importCost":
      return "importCost";
    case "attachmentCost":
      return "attachmentCost";
  }
}

export function useGraceBalloonPlan() {
  const { serviceFees } = useCatalogCategories();
  const [direction, setDirection] = usePersistentState<PlanDirection>(
    DIRECTION_KEY,
    "forward",
  );
  const [stored, setStored] = usePersistentState<PlanState>(STORAGE, DEFAULT_STATE);
  const state = useMemo(() => normalizePlanState(stored), [stored]);
  const [feeModes, setFeeModes] = usePersistentState<ServiceFeeModes>(
    SERVICE_FEE_MODES_KEY,
    EMPTY_SERVICE_FEE_MODES,
  );

  const setState = useCallback(
    (action: SetStateAction<PlanState>) => {
      setStored((prev) => {
        const base = normalizePlanState(prev);
        const next = typeof action === "function" ? action(base) : action;
        return normalizePlanState(next);
      });
    },
    [setStored],
  );

  const setField = useCallback(
    <K extends keyof PlanState>(key: K, value: PlanState[K]) => {
      setState((prev) => {
        let next = { ...prev, [key]: value };
        if (key === "termMonths") {
          const term = Math.max(1, Math.trunc(Number(value) || 1));
          const resized = resizeSchedule(prev.monthModes, prev.balloons, term);
          next = { ...next, termMonths: term, ...resized };
        }
        return next;
      });
    },
    [setState],
  );

  const [termDraft, setTermDraft] = useState<string | null>(null);

  const commitTermDraft = useCallback(() => {
    if (termDraft == null) return;
    const n = parseIntField(termDraft);
    if (n >= 1) setField("termMonths", n);
    setTermDraft(null);
  }, [termDraft, setField]);

  const setMonthMode = useCallback(
    (index: number, mode: PaymentMonthMode) => {
      setState((prev) => {
        const monthModes = [...prev.monthModes];
        monthModes[index] = mode;
        return { ...prev, monthModes };
      });
    },
    [setState],
  );

  const setBalloon = useCallback(
    (index: number, value: number) => {
      setState((prev) => {
        const balloons = [...prev.balloons];
        balloons[index] = Math.max(0, value);
        return { ...prev, balloons };
      });
    },
    [setState],
  );

  const resetGraceToDefault = useCallback(() => {
    setState((prev) => ({ ...prev, monthModes: defaultMonthModes(prev.termMonths) }));
  }, [setState]);

  const clearBalloons = useCallback(() => {
    setState((prev) => ({ ...prev, balloons: defaultBalloons(prev.termMonths) }));
  }, [setState]);

  const planInput = useMemo(
    () => ({
      downPayment: state.downPayment,
      annualNominalRatePct: state.annualRate,
      termMonths: state.termMonths,
      startDate: state.startDate,
      currency: state.currency,
      financingSupport: state.financingSupport,
      fileFee: state.fileFee,
      totalInsurance: state.totalInsurance,
      importCost: state.importCost,
      attachmentCost: state.attachmentCost,
      extraCostModes: state.extraCostModes,
      monthModes: state.monthModes,
      balloons: state.balloons,
    }),
    [state],
  );

  const result = useMemo(() => {
    if (direction === "reverse") {
      return computeLeasingPaymentPlanReverse({
        ...planInput,
        targetCustomerTotal: state.targetCustomerTotal,
      });
    }
    return computeLeasingPaymentPlan({
      ...planInput,
      machinePrice: state.machinePrice,
    });
  }, [direction, planInput, state.machinePrice, state.targetCustomerTotal]);

  const { summary, rows } = result;

  const supportCompare = useMemo((): FinancingSupportCompare | null => {
    const support = Math.max(0, state.financingSupport);
    if (support <= 0) return null;

    if (direction === "forward") {
      if (summary.status !== "ok") return null;
      const baseline = computeLeasingPaymentPlan({
        ...planInput,
        machinePrice: state.machinePrice,
        financingSupport: 0,
      });
      if (baseline.summary.status !== "ok") return null;
      const current = summary.customerTotalPayment;
      const without = baseline.summary.customerTotalPayment;
      const delta = without - current;
      if (delta <= 0.005) return null;
      return {
        baselineLabel: "Müşteri toplam ödemesi (desteksiz)",
        baselineValue: without,
        deltaLabel: "Destek etkisi (fark)",
        deltaValue: -delta,
      };
    }

    const rev = result as LeasingPlanReverseResult;
    if (rev.summary.status !== "ok" || rev.solvedMachinePrice == null) return null;
    const baselineRev = computeLeasingPaymentPlanReverse({
      ...planInput,
      financingSupport: 0,
      targetCustomerTotal: state.targetCustomerTotal,
    });
    if (
      baselineRev.summary.status !== "ok" ||
      baselineRev.solvedMachinePrice == null
    ) {
      return null;
    }
    const withSupport = rev.solvedMachinePrice;
    const without = baselineRev.solvedMachinePrice;
    const delta = withSupport - without;
    if (delta <= 0.005) return null;
    return {
      baselineLabel: "Net makine bedeli (desteksiz)",
      baselineValue: without,
      deltaLabel: "Destek etkisi (fark)",
      deltaValue: delta,
    };
  }, [
    direction,
    planInput,
    result,
    state.financingSupport,
    state.machinePrice,
    state.targetCustomerTotal,
    summary.customerTotalPayment,
    summary.status,
  ]);

  const solvedMachine: number | null =
    direction === "reverse"
      ? (result as LeasingPlanReverseResult).solvedMachinePrice
      : null;

  const machinePriceForKasko = useMemo(() => {
    if (direction === "reverse" && solvedMachine != null && solvedMachine > 0) {
      return solvedMachine;
    }
    return state.machinePrice;
  }, [direction, solvedMachine, state.machinePrice]);

  const autoAmountForKey = useCallback(
    (key: ExtraCostFieldKey): number => {
      switch (key) {
        case "kasko":
          return computeKaskoTotalForTerm(
            machinePriceForKasko,
            serviceFees.kaskoPercentOfMachine,
            state.termMonths,
            "monthly",
          );
        case "fileFee":
          return serviceFees.fileFeeEuro;
        case "importCost":
          return serviceFees.importCostEuro;
        default:
          return 0;
      }
    },
    [machinePriceForKasko, serviceFees, state.termMonths],
  );

  useEffect(() => {
    setState((prev) => {
      let next: PlanState | null = null;
      const touch = (): PlanState => {
        if (!next) next = { ...prev };
        return next;
      };
      (["kasko", "fileFee", "importCost"] as const).forEach((key) => {
        if (feeModes[key] !== "auto") return;
        const field = amountFieldForKey(key);
        const value = autoAmountForKey(key);
        if (prev[field] !== value) {
          touch()[field] = value;
        }
      });
      return next ?? prev;
    });
  }, [feeModes, autoAmountForKey, setState]);

  const handleSetFeeMode = useCallback(
    (key: ExtraCostFieldKey, mode: ServiceFeeApplyMode) => {
      setFeeModes((prev) => ({ ...prev, [key]: mode }));
      const field = amountFieldForKey(key);
      setState((prev) => {
        const next = { ...prev };
        if (mode === "off") {
          next[field] = 0;
        } else if (mode === "auto") {
          next[field] = autoAmountForKey(key);
        }
        return next;
      });
    },
    [autoAmountForKey, setFeeModes, setState],
  );

  const kaskoAutoTotal = computeKaskoTotalForTerm(
    machinePriceForKasko,
    serviceFees.kaskoPercentOfMachine,
    state.termMonths,
    "monthly",
  );

  const kpiSymbol: "€" | "₺" | "$" =
    state.currency === "TRY" ? "₺" : state.currency === "USD" ? "$" : "€";
  const sym = kpiSymbol;
  const ok = summary.status === "ok";
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState(false);

  const displayFinanceInterest = useMemo(() => {
    if (!ok) return 0;
    const support = Math.max(0, state.financingSupport);
    if (support <= 0) return summary.totalFinanceInterest;
    if (direction === "forward") {
      const baseline = computeLeasingPaymentPlan({
        ...planInput,
        machinePrice: state.machinePrice,
        financingSupport: 0,
      });
      return baseline.summary.status === "ok"
        ? baseline.summary.totalFinanceInterest
        : summary.totalFinanceInterest;
    }
    const baseline = computeLeasingPaymentPlanReverse({
      ...planInput,
      targetCustomerTotal: state.targetCustomerTotal,
      financingSupport: 0,
    });
    return baseline.summary.status === "ok"
      ? baseline.summary.totalFinanceInterest
      : summary.totalFinanceInterest;
  }, [
    direction,
    ok,
    planInput,
    state.financingSupport,
    state.machinePrice,
    state.targetCustomerTotal,
    summary.totalFinanceInterest,
  ]);

  const graceMonthCount = useMemo(
    () => state.monthModes.filter((m) => m === "grace").length,
    [state.monthModes],
  );

  const balloonMonthCount = useMemo(
    () => state.balloons.filter((b) => b > 0).length,
    [state.balloons],
  );

  const planTermLabel = useMemo(
    () =>
      formatGraceBalloonPlanTerm({
        termMonths: state.termMonths,
        graceMonthCount,
        payingMonthCount: summary.payingMonthCount,
      }),
    [graceMonthCount, state.termMonths, summary.payingMonthCount],
  );

  const balloonKpiItems = useMemo((): FinanceKpiItem[] => {
    if (!ok) return [];
    const items: FinanceKpiItem[] = [
      {
        label: "Aylık taksit",
        value: summary.equalNormalInstallment,
        hint: "Normal ödemeli aylar",
        currencySymbol: kpiSymbol,
        accent: "blue",
      },
      {
        label: "Müşteri toplam ödemesi",
        value: summary.customerTotalPayment,
        hint: "Peşinat ve balon dahil",
        currencySymbol: kpiSymbol,
        accent: "navy",
      },
      {
        label: "Toplam balon",
        value: summary.totalBalloon,
        hint: "Plan boyunca",
        currencySymbol: kpiSymbol,
        accent: "orange",
      },
    ];
    if (direction === "reverse" && solvedMachine != null) {
      items.push({
        label: "Bulunan makine bedeli",
        value: solvedMachine,
        hint: "Geri hesap sonucu",
        currencySymbol: kpiSymbol,
        accent: "green",
      });
    } else {
      items.push({
        label: "Makine bedeli",
        value: state.machinePrice,
        hint: "Giriş tutarı",
        currencySymbol: kpiSymbol,
        accent: "green",
      });
    }
    return items;
  }, [
    ok,
    summary.equalNormalInstallment,
    summary.customerTotalPayment,
    summary.totalBalloon,
    kpiSymbol,
    direction,
    solvedMachine,
    state.machinePrice,
  ]);

  const stitchSummaryRows = useMemo(
    () =>
      buildGraceBalloonStitchSummaryRows({
        direction,
        machinePrice: state.machinePrice,
        targetCustomerTotal: state.targetCustomerTotal,
        solvedMachine,
        summary,
        extras: {
          fileFee: state.fileFee,
          totalInsurance: state.totalInsurance,
          importCost: state.importCost,
          attachmentCost: state.attachmentCost,
        },
        financingSupport: state.financingSupport,
        displayFinanceInterest,
      }),
    [
      direction,
      displayFinanceInterest,
      state.machinePrice,
      state.targetCustomerTotal,
      state.fileFee,
      state.totalInsurance,
      state.importCost,
      state.attachmentCost,
      state.financingSupport,
      solvedMachine,
      summary,
    ],
  );

  const stitchPrimaryTotal =
    direction === "reverse" ? (solvedMachine ?? 0) : summary.customerTotalPayment;

  const stitchPrimaryTotalLabel =
    direction === "reverse"
      ? supportCompare
        ? "Bulunan makine bedeli (destekli)"
        : "Bulunan makine bedeli"
      : supportCompare
        ? "Müşteri toplam ödemesi (destekli)"
        : "Müşteri toplam ödemesi";

  const graceBalloonSummary = useMemo((): PrintableGraceBalloonSummaryProps | null => {
    if (!ok) return null;
    const extras = {
      fileFee: state.fileFee,
      totalInsurance: state.totalInsurance,
      importCost: state.importCost,
      attachmentCost: state.attachmentCost,
    };
    const detailRows = buildGraceBalloonDetailedReportRows({
      direction,
      machinePrice: state.machinePrice,
      extras,
      displayFinanceInterest,
      financingSupport: state.financingSupport,
    });
    return {
      direction,
      firma: state.firma,
      makine: state.makine,
      currencySymbol: sym,
      machinePrice:
        direction === "reverse" && solvedMachine != null
          ? solvedMachine
          : state.machinePrice,
      targetCustomerTotal:
        direction === "reverse" ? state.targetCustomerTotal : undefined,
      downPayment: state.downPayment,
      financingSupport: state.financingSupport,
      annualRatePct: state.annualRate,
      termMonths: state.termMonths,
      startDate: state.startDate,
      totalBalloon: summary.totalBalloon,
      payingMonthCount: summary.payingMonthCount,
      planTermLabel,
      monthlyInstallment: summary.equalNormalInstallment,
      detailRows,
      primaryTotal: stitchPrimaryTotal,
      primaryTotalLabel:
        direction === "reverse"
          ? supportCompare
            ? "Net makine bedeli (destekli)"
            : "Bulunan makine bedeli (KDV hariç)"
          : supportCompare
            ? "Müşteri toplam ödemesi (destekli)"
            : "Müşteri toplam ödemesi (KDV hariç)",
      supportCompare,
      compareSectionTitle:
        direction === "reverse"
          ? "Finansman desteği — net makine bedeli karşılaştırması"
          : "Finansman desteği — müşteri toplam ödemesi karşılaştırması",
      compareSupportedLabel:
        direction === "reverse"
          ? "Net makine bedeli (destekli)"
          : "Müşteri toplam ödemesi (destekli)",
    };
  }, [
    direction,
    displayFinanceInterest,
    ok,
    solvedMachine,
    state,
    planTermLabel,
    stitchPrimaryTotal,
    summary.equalNormalInstallment,
    summary.payingMonthCount,
    summary.totalBalloon,
    supportCompare,
    sym,
  ]);

  const printProps = useMemo((): PrintableGraceBalloonProps | null => {
    if (!ok) return null;
    const machinePrice =
      direction === "reverse" && solvedMachine != null
        ? solvedMachine
        : state.machinePrice;
    const extraLines = EXTRA_COST_FIELDS.filter((f) => state[f.amountKey] > 0).map(
      (f) => ({
        label: f.label,
        amount: state[f.amountKey],
        modeLabel:
          state.extraCostModes[f.modeKey] === "financed"
            ? "Plana (vade farkı)"
            : "Peşin",
      }),
    );
    return {
      direction,
      firma: state.firma.trim(),
      makine: state.makine.trim(),
      currency: state.currency,
      symbol: sym,
      machinePrice,
      downPayment: state.downPayment,
      financingSupport: state.financingSupport,
      annualRatePct: state.annualRate,
      termMonths: state.termMonths,
      startDate: state.startDate,
      summary,
      rows,
      extraLines,
    };
  }, [ok, direction, solvedMachine, state, sym, summary, rows]);

  const handleCreatePaymentPlan = () => {
    if (!printProps) return;
    setPrintPreviewOpen(true);
  };

  return {
    serviceFees,
    direction,
    setDirection,
    state,
    setState,
    setField,
    termDraft,
    setTermDraft,
    commitTermDraft,
    setMonthMode,
    setBalloon,
    resetGraceToDefault,
    clearBalloons,
    result,
    summary,
    rows,
    ok,
    supportCompare,
    solvedMachine,
    machinePriceForKasko,
    kaskoAutoTotal,
    feeModes,
    handleSetFeeMode,
    sym,
    kpiSymbol,
    displayFinanceInterest,
    graceMonthCount,
    balloonMonthCount,
    planTermLabel,
    balloonKpiItems,
    stitchSummaryRows,
    stitchPrimaryTotal,
    stitchPrimaryTotalLabel,
    graceBalloonSummary,
    printProps,
    handleCreatePaymentPlan,
    printPreviewOpen,
    setPrintPreviewOpen,
    summaryReportOpen,
    setSummaryReportOpen,
  };
}

export type GraceBalloonPlan = ReturnType<typeof useGraceBalloonPlan>;

"use client";

import DecimalTextInput from "@/components/finance/DecimalTextInput";
import { formatNumber } from "@/components/finance/format";
import SectionCard from "@/components/finance/ui/SectionCard";
import CostSummaryPanel from "@/components/finance/ui/CostSummaryPanel";
import FinanceKpiStrip, {
  type FinanceKpiItem,
} from "@/components/finance/ui/FinanceKpiStrip";
import { FinanceDocumentPreviewModal } from "@/components/finance/FinanceDocumentPreviewModal";
import type { PrintableGraceBalloonSummaryProps } from "@/components/finance/PrintableGraceBalloonSummary";
import {
  buildGraceBalloonDetailedReportRows,
  buildGraceBalloonStitchSummaryRows,
  formatGraceBalloonPlanTerm,
} from "@/lib/graceBalloonSummaryRows";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeLeasingPaymentPlan,
  DEFAULT_EXTRA_COST_MODES,
  defaultBalloons,
  defaultMonthModes,
  type ExtraCostModes,
  type ExtraCostPaymentMode,
  type PaymentMonthMode,
} from "@/lib/leasingPaymentPlan";
import {
  computeLeasingPaymentPlanReverse,
  type LeasingPlanReverseResult,
} from "@/lib/leasingPaymentPlanReverse";
import { usePersistentState } from "@/lib/usePersistentState";
import { printFinanceDocument } from "@/lib/printFinanceDocument";
import { cn } from "@/lib/utils";
import PrintableGraceBalloonPlan, {
  PrintableGraceBalloonPreviewModal,
  type PrintableGraceBalloonProps,
} from "@/components/finance/PrintableGraceBalloonPlan";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Printer, Undo2 } from "lucide-react";
import PlanExtraCostPanel from "@/components/finance/PlanExtraCostPanel";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import { computeKaskoTotalForTerm } from "@/lib/financeExpenseCatalog";
import {
  EMPTY_SERVICE_FEE_MODES,
  SERVICE_FEE_MODES_KEY,
  type ExtraCostFieldKey,
  type ServiceFeeApplyMode,
  type ServiceFeeModes,
} from "@/lib/catalogServiceFees";
import { useMemo, useCallback, useState, useEffect, type SetStateAction } from "react";

const STORAGE = "llp:v2:grace-balloon-plan";
const DIRECTION_KEY = "llp:v2:grace-balloon:direction";

const GRACE_BALLOON_MODULE_TITLE = "3 Ay Ödemesiz & Balon Hesaplama";

type PlanDirection = "forward" | "reverse";

type PlanState = {
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

export default function LeasingPaymentPlanCalculatorClassic() {
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

  const supportCompare = useMemo(() => {
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
    if (
      direction === "reverse" &&
      solvedMachine != null &&
      solvedMachine > 0
    ) {
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

  const amountFieldForKey = (
    key: ExtraCostFieldKey,
  ): "totalInsurance" | "fileFee" | "importCost" | "attachmentCost" => {
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
  };

  useEffect(() => {
    setState((prev) => {
      let next: PlanState | null = null;
      const touch = (): PlanState => {
        if (!next) next = { ...prev };
        return next;
      };
      (
        ["kasko", "fileFee", "importCost"] as const
      ).forEach((key) => {
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

  const sym = state.currency === "TRY" ? "₺" : state.currency === "USD" ? "$" : "€";
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });
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

  const kpiSymbol: "€" | "₺" | "$" =
    state.currency === "TRY" ? "₺" : state.currency === "USD" ? "$" : "€";

  const graceMonthCount = useMemo(
    () => state.monthModes.filter((m) => m === "grace").length,
    [state.monthModes],
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
    direction === "reverse"
      ? (solvedMachine ?? 0)
      : summary.customerTotalPayment;

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
    const primaryTotal = stitchPrimaryTotal;
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
      primaryTotal,
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
  }, [
    ok,
    direction,
    solvedMachine,
    state,
    sym,
    summary,
    rows,
  ]);

  const handleCreatePaymentPlan = () => {
    if (!printProps) return;
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setPrintPreviewOpen(true);
      return;
    }
    printFinanceDocument("plan");
  };

  const inputCls =
    "h-9 border-[#c3c6d7] bg-white text-sm tabular-nums font-medium text-[#0b1c30]";

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:gap-5">
      <div className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          <div
            className="flex shrink-0 flex-col gap-1.5"
            role="tablist"
            aria-label="Hesaplama yönü"
          >
            <p className="text-xs font-semibold text-[#434655]">Hesaplama</p>
            <div className="flex w-fit flex-col gap-1 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff] p-1 sm:flex-row">
              <button
                type="button"
                role="tab"
                aria-selected={direction === "forward"}
                onClick={() => setDirection("forward")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  direction === "forward"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#565e74] hover:bg-white",
                )}
              >
                <Calculator className="h-4 w-4 shrink-0" aria-hidden />
                İleri hesaplama
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={direction === "reverse"}
                onClick={() => setDirection("reverse")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  direction === "reverse"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#565e74] hover:bg-white",
                )}
              >
                <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
                Geri hesaplama
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0b1c30]">
              {GRACE_BALLOON_MODULE_TITLE}
            </p>
            <p className="mt-1 text-sm text-[#434655]">
              İlk üç ay varsayılan ödemesiz; ay bazında balon ve ödemesiz seçimi. Ek
              maliyetlerde peşin veya plana (vade farkı ile) seçimi yapılır.
            </p>
          </div>

          <Button
            type="button"
            disabled={!ok}
            className="h-9 shrink-0 gap-2 self-start bg-[#004ac6] text-xs font-bold hover:bg-[#2563eb] disabled:opacity-50 lg:self-center"
            onClick={handleCreatePaymentPlan}
          >
            <Printer className="h-4 w-4" aria-hidden />
            Ödeme planı oluştur
          </Button>
        </div>
      </div>

      {balloonKpiItems.length > 0 ? (
        <FinanceKpiStrip items={balloonKpiItems} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <SectionCard title="Girişler" variant="stitch" className="lg:col-span-5">
          <div className="grid grid-cols-1 gap-3">
            <Field label="Firma bilgisi">
              <Input
                data-promo-field="grace-firma"
                className={cn(inputCls, "font-normal")}
                value={state.firma}
                placeholder="Örn: ABC İnşaat Ltd. Şti."
                onChange={(e) => setField("firma", e.target.value)}
              />
            </Field>
            <Field label="Makine / model">
              <Input
                className={cn(inputCls, "font-normal")}
                value={state.makine}
                placeholder="Örn: MT 1840-100"
                onChange={(e) => setField("makine", e.target.value)}
              />
            </Field>
            {direction === "forward" ? (
              <Field label="Makine bedeli" required>
                <DecimalTextInput
                  data-promo-field="grace-machinePrice"
                  className={inputCls}
                  value={state.machinePrice}
                  onValueChange={(n) => setField("machinePrice", n)}
                />
              </Field>
            ) : (
              <Field label="Hedef müşteri toplam ödemesi" required>
                <DecimalTextInput
                  className={inputCls}
                  value={state.targetCustomerTotal}
                  onValueChange={(n) => setField("targetCustomerTotal", n)}
                />
              </Field>
            )}
            <Field label="Peşinat">
              <DecimalTextInput
                data-promo-field="grace-downPayment"
                className={inputCls}
                value={state.downPayment}
                onValueChange={(n) => setField("downPayment", n)}
              />
            </Field>
            <Field label="Yıllık nominal faiz (%)">
              <DecimalTextInput
                className={inputCls}
                value={state.annualRate}
                onValueChange={(n) => setField("annualRate", n)}
              />
            </Field>
            <Field label="Toplam vade (ay)" required>
              <Input
                className={inputCls}
                inputMode="numeric"
                value={termDraft ?? String(state.termMonths)}
                onFocus={() => setTermDraft(String(state.termMonths))}
                onChange={(e) => setTermDraft(e.target.value.replace(/\D/g, ""))}
                onBlur={commitTermDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </Field>
            <Field label="Finansman başlangıç tarihi" required>
              <Input
                className={inputCls}
                type="date"
                value={state.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </Field>
            <Field label="Para birimi">
              <select
                className={cn(inputCls, "w-full rounded-md border px-2")}
                value={state.currency}
                onChange={(e) => setField("currency", e.target.value)}
              >
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="Finansman desteği (isteğe bağlı)">
              <DecimalTextInput
                className={inputCls}
                placeholder="0"
                value={state.financingSupport}
                onValueChange={(n) => setField("financingSupport", n)}
              />
            </Field>
          </div>

          <PlanExtraCostPanel
            className="mt-4"
            machinePriceEuro={machinePriceForKasko}
            fees={serviceFees}
            modes={feeModes}
            kaskoAutoTotal={computeKaskoTotalForTerm(
              machinePriceForKasko,
              serviceFees.kaskoPercentOfMachine,
              state.termMonths,
              "monthly",
            )}
            kaskoTermHint={
              serviceFees.kaskoPercentOfMachine > 0 && state.termMonths > 0
                ? `${state.termMonths} ay × (bedelin %${serviceFees.kaskoPercentOfMachine} / 12)`
                : undefined
            }
            amounts={{
              totalInsurance: state.totalInsurance,
              fileFee: state.fileFee,
              importCost: state.importCost,
              attachmentCost: state.attachmentCost,
            }}
            extraCostModes={state.extraCostModes}
            inputClassName={inputCls}
            onSetMode={handleSetFeeMode}
            onAmountChange={(key, value) => setField(key, value)}
            onPaymentModeChange={(key, mode) =>
              setState((prev) => ({
                ...prev,
                extraCostModes: { ...prev.extraCostModes, [key]: mode },
              }))
            }
          />
        </SectionCard>

        <SectionCard
          title={
            direction === "reverse" ? "Geri Hesaplama Özeti" : "Hesaplama Özeti"
          }
          variant="stitch"
          accentBar
          className="lg:col-span-7 lg:sticky lg:top-[4.75rem]"
          action={
            ok ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full border-[#c3c6d7] bg-white text-xs font-semibold text-[#004ac6] md:text-[13px]"
                data-promo-action="open-summary"
                onClick={() => setSummaryReportOpen(true)}
              >
                <FileText className="h-3.5 w-3.5" />
                Özet Rapor
              </Button>
            ) : undefined
          }
        >
          <div
            className={cn(
              "mb-3 rounded-lg border px-3 py-2.5",
              ok ? "border-[#004ac6]/25 bg-[#eff4ff]/80" : "border-amber-200 bg-amber-50",
            )}
          >
            <p className="text-xs font-semibold text-[#565e74]">Hesap durumu</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-bold",
                ok ? "text-[#004ac6]" : "text-amber-900",
              )}
            >
              {summary.message}
            </p>
            {state.firma.trim() || state.makine.trim() ? (
              <div className="mt-2 space-y-0.5 border-t border-[#004ac6]/15 pt-2 text-sm text-[#0b1c30]">
                {state.firma.trim() ? (
                  <p className="font-semibold">{state.firma.trim()}</p>
                ) : null}
                {state.makine.trim() ? (
                  <p className="text-xs font-medium text-[#565e74]">{state.makine.trim()}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {ok ? (
            <CostSummaryPanel
              rows={stitchSummaryRows}
              currencySymbol={kpiSymbol}
              layout="stitch"
              amountDecimals={2}
              totalEuro={stitchPrimaryTotal}
              stitchPrimaryTotalLabel={
                direction === "reverse"
                  ? supportCompare
                    ? "Bulunan makine bedeli (destekli)"
                    : "Bulunan makine bedeli"
                  : supportCompare
                    ? "Müşteri toplam ödemesi (destekli)"
                    : "Müşteri toplam ödemesi"
              }
              stitchCompare={supportCompare ?? undefined}
            />
          ) : (
            <p className="text-sm text-[#565e74]">
              Kalemler hesaplandığında özet satırları burada listelenir.
            </p>
          )}

          {ok ? (
            <dl className="mt-4 grid gap-2 border-t border-[#c3c6d7]/60 pt-3 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-0.5 rounded-lg border border-[#c3c6d7]/60 bg-[#f8f9ff] px-3 py-2">
                <dt className="text-[11px] font-semibold text-[#565e74]">Toplam balon</dt>
                <dd className="font-bold tabular-nums text-[#0b1c30]">
                  {fmt(summary.totalBalloon)} {sym}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg border border-[#c3c6d7]/60 bg-[#f8f9ff] px-3 py-2">
                <dt className="text-[11px] font-semibold text-[#565e74]">
                  Taksitli ay sayısı
                </dt>
                <dd className="font-bold tabular-nums text-[#0b1c30]">
                  {summary.payingMonthCount}
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="mt-3 text-[11px] leading-relaxed text-[#565e74]">
            Peşinat + taksitler + balonlar + peşin ek maliyetler. Plana dahil ekler vade
            farkı ile taksitlerde yer alır. KDV ve devir bedeli hariç.
          </p>
        </SectionCard>
      </div>

      {ok ? (
        <SectionCard title="Ödeme planı" variant="stitch">
          <div className="max-h-[min(520px,60vh)] overflow-auto rounded-lg border border-[#c3c6d7]">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px] sm:text-sm">
              <thead className="sticky top-0 z-10 bg-[#eff4ff] text-xs font-semibold text-[#434655] sm:text-[13px]">
                <tr>
                  <th className="px-2 py-2">Ay</th>
                  <th className="px-2 py-2">Ödeme tarihi</th>
                  <th className="px-2 py-2">Ödemeli / Ödemesiz</th>
                  <th className="px-2 py-2 text-right">Taksit</th>
                  <th className="px-2 py-2 text-right">Balon</th>
                  <th className="px-2 py-2 text-right">Kalan borç</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.month}
                    className={cn(
                      "border-t border-[#c3c6d7]/50 hover:bg-[#eff4ff]/40",
                      row.mode === "grace" && "bg-amber-50/60",
                    )}
                  >
                    <td className="px-2 py-1.5 font-medium">{row.month}</td>
                    <td className="px-2 py-1.5 tabular-nums">{row.paymentDate ?? "—"}</td>
                    <td className="px-2 py-1.5">
                      <select
                        className="h-8 w-full max-w-[120px] rounded border border-[#c3c6d7] bg-white px-1 text-xs"
                        value={row.mode}
                        onChange={(e) => {
                          const mode = e.target.value as PaymentMonthMode;
                          setState((prev) => {
                            const monthModes = [...prev.monthModes];
                            monthModes[idx] = mode;
                            return { ...prev, monthModes };
                          });
                        }}
                      >
                        <option value="paying">Ödemeli</option>
                        <option value="grace">Ödemesiz</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium text-[#0b1c30]">
                      {fmt(row.normalInstallment)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <DecimalTextInput
                        className="ml-auto h-8 w-24 border-[#c3c6d7] px-1 text-right text-xs tabular-nums"
                        value={state.balloons[idx] ?? 0}
                        onValueChange={(v) => {
                          setState((prev) => {
                            const balloons = [...prev.balloons];
                            balloons[idx] = Math.max(0, v);
                            return { ...prev, balloons };
                          });
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[#565e74]">
            Ödemesiz aylarda taksit sıfırdır; faiz kalan borca eklenir. Balon istediğiniz aya
            yazılır. İlk ödeme tarihi finansman başlangıcından bir ay sonradır.
          </p>
        </SectionCard>
      ) : null}

      {printProps && !summaryReportOpen && !printPreviewOpen ? (
        <PrintableGraceBalloonPlan {...printProps} />
      ) : null}
      {printProps ? (
        <PrintableGraceBalloonPreviewModal
          {...printProps}
          open={printPreviewOpen}
          onClose={() => setPrintPreviewOpen(false)}
        />
      ) : null}
      <FinanceDocumentPreviewModal
        open={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
        variant="grace-balloon-summary"
        graceBalloonSummary={graceBalloonSummary ?? undefined}
      />
    </div>
  );
}

function Field(props: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-[#434655]">
        {props.label}
        {props.required ? " *" : ""}
      </Label>
      {props.children}
    </div>
  );
}


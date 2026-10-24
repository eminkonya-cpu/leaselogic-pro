import {
  getForwardDisplayMetrics,
  type CalcSlice,
  type ForwardTabId,
} from "@/lib/forwardDisplayMetrics";
import type { ReverseFinanceLeg } from "@/lib/reverseFinanceCalc";

export type FinancingSupportCompare = {
  baselineLabel: string;
  baselineValue: number;
  deltaLabel: string;
  deltaValue: number;
};

const FORWARD_TABS_WITH_SUPPORT_REF: ForwardTabId[] = ["plain", "allin"];

export function forwardSummaryReportFinancing(args: {
  financingSupportEuro: number;
  activeTab: ForwardTabId;
  baselineCalc?: CalcSlice;
  params: {
    downPaymentEuro: number;
    euroRate: number;
    euroInterest: number;
    tlInterest: number;
    term: number | string;
  };
  display: ReturnType<typeof getForwardDisplayMetrics>;
  currencyIsTry: boolean;
}): {
  vadeFarkiDisplay: number;
  financingSupportDisplay: number;
  compare: FinancingSupportCompare | null;
} {
  const supportEuro = Math.max(0, args.financingSupportEuro);
  const rate = args.params.euroRate;
  const useRef =
    supportEuro > 0 &&
    args.baselineCalc != null &&
    FORWARD_TABS_WITH_SUPPORT_REF.includes(args.activeTab);

  const vadeActual = args.currencyIsTry
    ? args.display.vadeFarkiTl
    : args.display.vadeFarkiEuro;

  let vadeFarkiDisplay = vadeActual;
  if (useRef && args.baselineCalc) {
    const baseline = getForwardDisplayMetrics(
      args.activeTab,
      args.baselineCalc,
      args.params,
    );
    vadeFarkiDisplay = args.currencyIsTry
      ? baseline.vadeFarkiTl
      : baseline.vadeFarkiEuro;
  }

  const financingSupportDisplay = args.currencyIsTry
    ? supportEuro * rate
    : supportEuro;

  let compare: FinancingSupportCompare | null = null;
  if (useRef && args.baselineCalc) {
    const baseline = getForwardDisplayMetrics(
      args.activeTab,
      args.baselineCalc,
      args.params,
    );
    const without = args.currencyIsTry ? baseline.totalTl : baseline.totalEuro;
    const current = args.currencyIsTry
      ? args.display.totalTl
      : args.display.totalEuro;
    const delta = without - current;
    if (delta > 0.005) {
      compare = {
        baselineLabel: "Müşteri toplam ödemesi (desteksiz)",
        baselineValue: without,
        deltaLabel: "Destek etkisi (fark)",
        deltaValue: -delta,
      };
    }
  }

  return { vadeFarkiDisplay, financingSupportDisplay, compare };
}

export function reverseSummaryReportFinancing(args: {
  financingSupportEuro: number;
  baselineLeg?: ReverseFinanceLeg;
  leg: ReverseFinanceLeg;
  currencyIsTry: boolean;
  euroRate: number;
}): {
  interestDiffDisplay: number;
  financingSupportDisplay: number;
  compare: FinancingSupportCompare | null;
} {
  const supportEuro = Math.max(0, args.financingSupportEuro);
  const useRef = supportEuro > 0 && args.baselineLeg != null;

  const interestDiffDisplay = useRef
    ? args.baselineLeg!.interestDiff
    : args.leg.interestDiff;

  const financingSupportDisplay = args.currencyIsTry
    ? supportEuro * args.euroRate
    : supportEuro;

  let compare: FinancingSupportCompare | null = null;
  if (useRef && args.baselineLeg) {
    const without = args.baselineLeg.displayNetMachine;
    const current = args.leg.displayNetMachine;
    const delta = current - without;
    if (delta > 0.005) {
      compare = {
        baselineLabel: "Net makine bedeli (desteksiz)",
        baselineValue: without,
        deltaLabel: "Destek etkisi (fark)",
        deltaValue: delta,
      };
    }
  }

  return { interestDiffDisplay, financingSupportDisplay, compare };
}

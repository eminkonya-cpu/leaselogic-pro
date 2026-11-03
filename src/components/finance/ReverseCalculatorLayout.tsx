"use client";

import CatalogSelector from "@/components/finance/CatalogSelector";
import FinanceCatalogExpensePanel from "@/components/finance/FinanceCatalogExpensePanel";
import type { FinanceExpenses } from "@/lib/financeExpenseCatalog";
import type { PaymentFrequency } from "@/components/finance/PaymentFrequencySelector";
import CostSummaryPanel from "@/components/finance/ui/CostSummaryPanel";
import FinanceFieldGrid, {
  MACHINE_MODELS,
} from "@/components/finance/ui/FinanceFieldGrid";
import PaymentSchedulePanel from "@/components/finance/ui/PaymentSchedulePanel";
import SectionClearAction from "@/components/finance/ui/SectionClearAction";
import {
  CatalogScrollRail,
  CATALOG_SECTION_ID,
} from "@/components/finance/ui/CatalogScrollRail";
import {
  PlanContextFields,
  PlanFinancingSupportField,
} from "@/components/finance/ui/FinanceContextBar";
import CalcPageHeader from "@/components/finance/ui/CalcPageHeader";
import {
  CALC_PANEL_CLS,
  FormStep,
  ResultKpiBand,
  type ResultKpiItem,
} from "@/components/finance/ui/CalcFormChrome";
import { formatNumber } from "@/components/finance/format";
import ProCalcShell from "@/components/finance/ui/ProCalcShell";
import type { ReverseFinanceLeg } from "@/lib/reverseFinanceCalc";
import type { CatalogLine, CatalogSelection } from "@/lib/catalogPrices";
import { buildReverseStitchSummaryRows } from "@/lib/reverseSummaryReport";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type ReverseCalcSlice = {
  catalogLines: CatalogLine[];
  totalExpensesEuro: number;
  euro: ReverseFinanceLeg;
  tl: ReverseFinanceLeg;
};

export default function ReverseCalculatorLayout(props: {
  paymentFrequency: PaymentFrequency;
  onPaymentFrequencyChange: (v: PaymentFrequency) => void;
  pdfCurrency: "EUR" | "TRY";
  setPdfCurrency: (c: "EUR" | "TRY") => void;
  params: Record<string, unknown> & {
    firma: string;
    makine: string;
    allInTotalEuro: number;
    euroRate: number;
    downPaymentEuro: number;
    financingSupportEuro?: number;
    euroInterest: number;
    tlInterest: number;
    term: number | string;
  };
  calc: ReverseCalcSlice;
  /** Desteksiz senaryo (finansman desteği = 0). */
  baselineCalc?: ReverseCalcSlice;
  expenses: Record<string, number>;
  catalogSelection: CatalogSelection;
  handleParamChange: (key: string, value: string | number) => void;
  handleExpenseChange: (key: string, value: number) => void;
  onExpensesReplace: (next: FinanceExpenses) => void;
  handleCatalogToggle: (
    categoryId: keyof CatalogSelection,
    itemId: string,
  ) => void;
  handleCatalogClearAll: () => void;
  handleClearMachineFinance: () => void;
  handleClearExpenses: () => void;
  handlePrint: () => void;
  handleOpenSummaryReport: () => void;
  handleNewCalculation: () => void;
  handleRefreshEuroRate: () => void;
  termYears?: number;
}) {
  const isAnnual = props.paymentFrequency === "annual";
  const isTry = props.pdfCurrency === "TRY";
  const sym = isTry ? "₺" : "€";
  const rate = props.params.euroRate;
  const leg = isTry ? props.calc.tl : props.calc.euro;
  const catalogAmount = (line: CatalogLine) =>
    isTry ? line.priceEuro * rate : line.priceEuro;
  const allInTotal = isTry
    ? props.params.allInTotalEuro * rate
    : props.params.allInTotalEuro;
  const downPayment = isTry
    ? props.params.downPaymentEuro * rate
    : props.params.downPaymentEuro;
  const schedule = leg.schedule;
  const installment = leg.installment;
  const totalPrimary = leg.total;
  const planInterest = isTry
    ? props.params.tlInterest
    : props.params.euroInterest;
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });

  const financingSupportAmount = Math.max(
    0,
    Number(props.params.financingSupportEuro) || 0,
  );
  const baselineLeg = isTry
    ? props.baselineCalc?.tl
    : props.baselineCalc?.euro;

  const interestDiffForSummary = useMemo(() => {
    if (financingSupportAmount <= 0 || !baselineLeg) return leg.interestDiff;
    return baselineLeg.interestDiff;
  }, [baselineLeg, financingSupportAmount, leg.interestDiff]);

  const financingSupportCompare = useMemo(() => {
    if (financingSupportAmount <= 0 || !baselineLeg) return null;
    const without = baselineLeg.displayNetMachine;
    const current = leg.displayNetMachine;
    const delta = current - without;
    if (delta <= 0.005) return null;
    return {
      baselineLabel: "Net makine bedeli (desteksiz)",
      baselineValue: without,
      deltaLabel: "Destek etkisi (fark)",
      deltaValue: delta,
    };
  }, [baselineLeg, financingSupportAmount, leg.displayNetMachine]);

  const summaryRows = useMemo(
    () =>
      buildReverseStitchSummaryRows({
        allInTotal,
        totalExpenses: leg.totalExpenses,
        interestDiff: interestDiffForSummary,
        financingSupport: isTry
          ? financingSupportAmount * rate
          : financingSupportAmount,
        catalogLines: props.calc.catalogLines,
        catalogAmount,
        displayNetMachine: leg.displayNetMachine,
      }),
    [
      allInTotal,
      catalogAmount,
      financingSupportAmount,
      interestDiffForSummary,
      isTry,
      rate,
      leg.displayNetMachine,
      leg.totalExpenses,
      props.calc.catalogLines,
    ],
  );

  const netMachineDisplay = leg.displayNetMachine;
  const stitchPrimaryTotalLabel = financingSupportCompare
    ? "Net makine bedeli (destekli)"
    : isTry
      ? "Net makine bedeli"
      : "Net makine bedeli (EUR)";
  const heroSub = [props.params.firma.trim(), props.params.makine.trim()]
    .filter(Boolean)
    .join(" · ");
  const term = Number(props.params.term) || 0;

  const reverseKpiItems = useMemo((): ResultKpiItem[] => {
    return [
      {
        label: stitchPrimaryTotalLabel,
        value: `${fmt(netMachineDisplay)} ${sym}`,
        sub:
          heroSub ||
          (financingSupportCompare
            ? `${financingSupportCompare.deltaLabel}: ${
                financingSupportCompare.deltaValue >= 0 ? "+" : "−"
              }${fmt(Math.abs(financingSupportCompare.deltaValue))} ${sym}`
            : undefined),
        hero: true,
      },
      {
        label: isAnnual ? "Yıllık taksit" : "Aylık taksit",
        value: `${fmt(installment)} ${sym}`,
      },
      {
        label: "Toplam ödeme",
        value: `${fmt(totalPrimary)} ${sym}`,
      },
      {
        label: "Vade farkı",
        value: `${fmt(leg.interestDiff)} ${sym}`,
      },
      {
        label: "Plan",
        value: isAnnual ? `${term} yıl` : `${term} ay`,
        sub: isAnnual ? "Yılda bir taksit" : undefined,
      },
    ];
  }, [
    stitchPrimaryTotalLabel,
    netMachineDisplay,
    sym,
    heroSub,
    financingSupportCompare,
    isAnnual,
    installment,
    totalPrimary,
    leg.interestDiff,
    term,
  ]);

  const termField = isAnnual
    ? {
        key: "term",
        label: "Vade (Yıl) — en fazla 3",
      }
    : {
        key: "term",
        label: "Vade (Ay)",
      };

  return (
    <ProCalcShell>
      <CatalogScrollRail enabled observeKey={props.paymentFrequency} />
      <CalcPageHeader
        kicker="Leasing · Geri hesaplama"
        title="Geri hesaplama"
        description="Toplam ödemeden net makine bedeline. Tutarlar KDV hariçtir."
        onSummary={props.handleOpenSummaryReport}
        onPaymentPlan={props.handlePrint}
        summaryActionAttr="open-summary"
      />

      <ResultKpiBand items={reverseKpiItems} />

      <div className="grid gap-3 lg:grid-cols-12 lg:items-start [&>*]:min-w-0">
        <section className={cn(CALC_PANEL_CLS, "lg:col-span-7")}>
          <h3 className="sr-only">Girişler</h3>

          <FormStep index={1} title="Müşteri">
            <FinanceFieldGrid
              variant="plan"
              machineFields={[
                {
                  key: "firma",
                  label: "Firma",
                  placeholder: "Firma Adı",
                  type: "text",
                },
                {
                  key: "makine",
                  label: "Makine",
                  placeholder: "Model",
                  type: "text",
                  options: [...MACHINE_MODELS],
                },
              ]}
              financeFields={[]}
              values={props.params}
              onChange={props.handleParamChange}
            />
          </FormStep>

          <FormStep
            index={2}
            title="Finansman koşulları"
            action={
              <SectionClearAction
                onClick={props.handleClearMachineFinance}
                label="Parametreleri temizle"
              />
            }
          >
            <FinanceFieldGrid
              variant="plan"
              machineFields={[
                {
                  key: "allInTotalEuro",
                  label: "Makine fiyatı (€)",
                  placeholder: "144000",
                },
              ]}
              financeFields={[
                {
                  key: "downPaymentEuro",
                  label: "Peşinat (€)",
                },
                termField,
                {
                  key: "euroInterest",
                  label: "Euro faiz oranı (%)",
                  placeholder: "6.5",
                  step: "0.1",
                },
                {
                  key: "tlInterest",
                  label: "TL faiz oranı (%)",
                  placeholder: "42",
                  step: "0.1",
                },
              ]}
              values={props.params}
              onChange={props.handleParamChange}
              extra={
                <>
                  <PlanContextFields
                    paymentFrequency={props.paymentFrequency}
                    onPaymentFrequencyChange={props.onPaymentFrequencyChange}
                    pdfCurrency={props.pdfCurrency}
                    setPdfCurrency={props.setPdfCurrency}
                    euroRate={props.params.euroRate}
                    onEuroRateChange={(value) =>
                      props.handleParamChange("euroRate", value)
                    }
                    onRefreshEuroRate={props.handleRefreshEuroRate}
                  />
                  <PlanFinancingSupportField
                    value={Number(props.params.financingSupportEuro) || 0}
                    onValueChange={(value) =>
                      props.handleParamChange("financingSupportEuro", value)
                    }
                  />
                </>
              }
            />
          </FormStep>

          <FormStep
            index={3}
            title="Ek maliyetler"
            last
            action={
              <SectionClearAction
                onClick={props.handleClearExpenses}
                label="Ek masrafları temizle"
              />
            }
          >
            <FinanceCatalogExpensePanel
              hideTitle
              modesStorageKey="llp:v3:reverse:fee-modes"
              machinePriceEuro={Number(props.params.allInTotalEuro) || 0}
              term={Number(props.params.term) || 0}
              paymentFrequency={props.paymentFrequency}
              expenses={props.expenses as FinanceExpenses}
              onExpensesChange={props.onExpensesReplace}
              inputClassName="h-9 border-[#E2E8F0] bg-white text-[13px]"
            />
          </FormStep>
        </section>

        <aside
          className={cn(
            CALC_PANEL_CLS,
            "lg:sticky lg:top-[4.75rem] lg:col-span-5",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Maliyet özeti
            </h3>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
              KDV hariç
            </span>
          </div>
          <CostSummaryPanel
            rows={summaryRows}
            currencySymbol={sym}
            layout="stitch"
            totalEuro={netMachineDisplay}
            amountDecimals={2}
            stitchPrimaryTotalLabel={stitchPrimaryTotalLabel}
            stitchCompare={financingSupportCompare ?? undefined}
          />
        </aside>
      </div>

      <div id={CATALOG_SECTION_ID} className="scroll-mt-24">
        <CatalogSelector
          appearance="clean"
          layout="page"
          density="comfortable"
          selection={props.catalogSelection}
          onToggle={props.handleCatalogToggle}
          onClearAll={props.handleCatalogClearAll}
        />
      </div>

      <PaymentSchedulePanel
        schedule={schedule}
        currencySymbol={sym}
        downPayment={downPayment}
        interestRatePct={planInterest}
        periodUnit={isAnnual ? "year" : "month"}
        totalPayment={totalPrimary}
        amountDecimals={2}
      />
    </ProCalcShell>
  );
}

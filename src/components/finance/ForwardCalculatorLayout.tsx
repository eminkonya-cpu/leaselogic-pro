"use client";

import FinanceCatalogExpensePanel from "@/components/finance/FinanceCatalogExpensePanel";
import type { FinanceExpenses } from "@/lib/financeExpenseCatalog";
import CatalogSelector from "@/components/finance/CatalogSelector";
import CurrencyComparisonReport from "@/components/finance/CurrencyComparisonReport";
import RateProjectionInput from "@/components/finance/RateProjectionInput";
import type { PaymentFrequency } from "@/components/finance/PaymentFrequencySelector";
import CostSummaryPanel from "@/components/finance/ui/CostSummaryPanel";
import FinanceFieldGrid, {
  MACHINE_MODELS,
} from "@/components/finance/ui/FinanceFieldGrid";
import PaymentSchedulePanel from "@/components/finance/ui/PaymentSchedulePanel";
import SectionCard from "@/components/finance/ui/SectionCard";
import SectionClearAction from "@/components/finance/ui/SectionClearAction";
import SegmentedControl from "@/components/finance/ui/SegmentedControl";
import { cn } from "@/lib/utils";
import { type CatalogSelection } from "@/lib/catalogPrices";
import { getForwardTabOptions } from "@/lib/forwardCalculatorFeatures";
import { buildForwardStitchSummaryRows } from "@/lib/forwardSummaryRows";
import {
  scaleExpenseAmounts,
  splitExtraExpenseAmounts,
} from "@/lib/expenseSummaryLines";
import {
  getForwardDisplayMetrics,
  type CalcSlice,
  type ForwardTabId,
} from "@/lib/forwardDisplayMetrics";
import { useCallback, useMemo } from "react";
import { CATALOG_SECTION_ID } from "@/components/finance/ui/CatalogScrollRail";
import CalcPageHeader from "@/components/finance/ui/CalcPageHeader";
import {
  PlanContextFields,
  PlanFinancingSupportField,
} from "@/components/finance/ui/FinanceContextBar";
import {
  CALC_PANEL_CLS,
  FormStep,
  ResultKpiBand,
  type ResultKpiItem,
} from "@/components/finance/ui/CalcFormChrome";
import { formatNumber } from "@/components/finance/format";
import ProCalcShell from "@/components/finance/ui/ProCalcShell";

export default function ForwardCalculatorLayout(props: {
  activeTab: ForwardTabId;
  setActiveTab: (tab: ForwardTabId) => void;
  pdfCurrency: "EUR" | "TRY";
  setPdfCurrency: (c: "EUR" | "TRY") => void;
  params: Record<string, unknown> & {
    euroRate: number;
    dollarRate: number;
    downPaymentEuro: number;
    financingSupportEuro?: number;
    euroInterest: number;
    tlInterest: number;
    machinePriceEuro: number;
    term: number | string;
    firma: string;
    makine: string;
  };
  calc: CalcSlice;
  /** Desteksiz senaryo (finansman desteği = 0). */
  baselineCalc?: CalcSlice;
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
  machinePriceLabel: string;
  financeCardTitle: string;
  financeFields: Parameters<typeof FinanceFieldGrid>[0]["financeFields"];
  monthlyGrowthPct: number;
  setMonthlyGrowthPct: (v: number) => void;
  resetRates: () => void;
  computedRates: number[];
  paymentFrequency?: PaymentFrequency;
  onPaymentFrequencyChange?: (v: PaymentFrequency) => void;
  /** Kur avantajı: projeksiyon ay sayısı */
  rateProjectionMonths?: number;
  /** Kur avantajı: vade (ay veya yıl) */
  comparisonTerm?: number;
}) {
  const paymentFrequency = props.paymentFrequency ?? "monthly";
  const isAnnual = paymentFrequency === "annual";
  const display = useMemo(
    () => getForwardDisplayMetrics(props.activeTab, props.calc, props.params),
    [props.activeTab, props.calc, props.params],
  );

  const isTry = props.pdfCurrency === "TRY";
  const sym = isTry ? "₺" : "€";
  const rate = props.params.euroRate;
  const monthly = isTry ? display.monthlyTl : display.monthlyEuro;
  const totalPrimary = isTry ? display.totalTl : display.totalEuro;
  const vadeFarki = isTry ? display.vadeFarkiTl : display.vadeFarkiEuro;
  const schedule = isTry ? display.scheduleTl : display.scheduleEuro;
  const interestRate = isTry
    ? display.interestRateTl
    : display.interestRateEuro;
  const downPayment = isTry
    ? props.params.downPaymentEuro * rate
    : props.params.downPaymentEuro;

  const expenseAmounts = useMemo(
    () =>
      display.includeExpenses
        ? scaleExpenseAmounts(
            splitExtraExpenseAmounts(props.expenses),
            isTry ? rate : 1,
          )
        : { kasko: 0, masraflar: 0, ithalat: 0 },
    [display.includeExpenses, isTry, props.expenses, rate],
  );
  const machine = isTry
    ? props.params.machinePriceEuro * rate
    : props.params.machinePriceEuro;

  const catalogAmount = useCallback(
    (line: (typeof props.calc.catalogLines)[number]) =>
      isTry ? line.priceEuro * rate : line.priceEuro,
    [isTry, rate],
  );

  const financingSupportAmount = Math.max(
    0,
    Number(props.params.financingSupportEuro) || 0,
  );

  /** KPI, grafik ve özet: destek varken tam (desteksiz) vade farkı. */
  const referenceVadeFarki = useMemo(() => {
    const useBaseline =
      financingSupportAmount > 0 &&
      props.baselineCalc != null &&
      props.activeTab !== "advantage" &&
      props.activeTab !== "campaign";
    if (!useBaseline) {
      return {
        euro: display.vadeFarkiEuro,
        tl: display.vadeFarkiTl,
        primary: vadeFarki,
      };
    }
    const baselineDisplay = getForwardDisplayMetrics(
      props.activeTab,
      props.baselineCalc!,
      props.params,
    );
    return {
      euro: baselineDisplay.vadeFarkiEuro,
      tl: baselineDisplay.vadeFarkiTl,
      primary: isTry ? baselineDisplay.vadeFarkiTl : baselineDisplay.vadeFarkiEuro,
    };
  }, [
    financingSupportAmount,
    props.baselineCalc,
    props.activeTab,
    props.params,
    display.vadeFarkiEuro,
    display.vadeFarkiTl,
    vadeFarki,
    isTry,
  ]);

  /** Üst kalemler mal bedeli; Toplam = ileri hesaplama toplam ödemesi (faiz dahil, peşinat dahil). */
  const summaryRows = useMemo(
    () =>
      buildForwardStitchSummaryRows({
        machine,
        catalogLines: props.calc.catalogLines,
        catalogAmount,
        includeExpenses: display.includeExpenses,
        expenseAmounts,
        vadeFarki: referenceVadeFarki.primary,
        financingSupport: isTry
          ? financingSupportAmount * rate
          : financingSupportAmount,
        totalPrimary,
      }),
    [
      machine,
      props.calc.catalogLines,
      catalogAmount,
      display.includeExpenses,
      expenseAmounts,
      referenceVadeFarki.primary,
      isTry,
      rate,
      financingSupportAmount,
      totalPrimary,
    ],
  );

  const tabOptions = getForwardTabOptions();
  const isPlainTab = props.activeTab === "plain";
  const isAdvantage = props.activeTab === "advantage";
  const plainCatalogOnly = display.plainCatalogOnly ?? false;
  const showExtras = props.activeTab === "campaign" || props.activeTab === "allin";
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });

  const financingSupportCompare = useMemo(() => {
    if (financingSupportAmount <= 0 || !props.baselineCalc) return null;
    if (props.activeTab === "advantage" || props.activeTab === "campaign") {
      return null;
    }
    if (plainCatalogOnly && isPlainTab) return null;

    const baselineDisplay = getForwardDisplayMetrics(
      props.activeTab,
      props.baselineCalc,
      props.params,
    );
    const without = isTry ? baselineDisplay.totalTl : baselineDisplay.totalEuro;
    const current = totalPrimary;
    const delta = without - current;
    if (delta <= 0.005) return null;

    return {
      baselineLabel: "Müşteri toplam ödemesi (desteksiz)",
      baselineValue: without,
      deltaLabel: "Destek etkisi (fark)",
      deltaValue: -delta,
    };
  }, [
    financingSupportAmount,
    props.baselineCalc,
    props.activeTab,
    props.params,
    plainCatalogOnly,
    isPlainTab,
    isTry,
    totalPrimary,
  ]);

  const stitchPrimaryTotalLabel =
    plainCatalogOnly && isPlainTab
      ? "Toplam tutar"
      : financingSupportCompare
        ? "Müşteri toplam ödemesi (destekli)"
        : isTry
          ? "Toplam ödeme"
          : "Toplam (EUR)";

  const heroSub = [props.params.firma.trim(), props.params.makine.trim()]
    .filter(Boolean)
    .join(" · ");

  const forwardKpiItems = useMemo((): ResultKpiItem[] => {
    if (isAdvantage) return [];
    const term = Number(props.params.term) || 0;
    const items: ResultKpiItem[] = [
      {
        label: stitchPrimaryTotalLabel,
        value: `${fmt(totalPrimary)} ${sym}`,
        sub:
          heroSub ||
          (financingSupportCompare
            ? `${financingSupportCompare.deltaLabel}: ${
                financingSupportCompare.deltaValue >= 0 ? "+" : "−"
              }${fmt(Math.abs(financingSupportCompare.deltaValue))} ${sym}`
            : undefined),
        hero: true,
      },
    ];
    if (!(plainCatalogOnly && isPlainTab)) {
      items.push({
        label: isAnnual ? "Yıllık taksit" : "Aylık taksit",
        value: `${fmt(monthly)} ${sym}`,
      });
    }
    items.push(
      {
        label: "Vade farkı",
        value: `${fmt(referenceVadeFarki.primary)} ${sym}`,
      },
      {
        label: isTry ? "Toplam ödeme (EUR)" : "Toplam ödeme (TL)",
        value: isTry
          ? `${fmt(display.totalEuro)} €`
          : `${fmt(display.totalTl)} ₺`,
      },
      {
        label: "Plan",
        value: isAnnual ? `${term} yıl` : `${term} ay`,
        sub: isAnnual ? "Yılda bir taksit" : undefined,
      },
    );
    return items;
  }, [
    isAdvantage,
    props.params.term,
    stitchPrimaryTotalLabel,
    totalPrimary,
    sym,
    heroSub,
    financingSupportCompare,
    plainCatalogOnly,
    isPlainTab,
    isAnnual,
    monthly,
    referenceVadeFarki.primary,
    isTry,
    display.totalEuro,
    display.totalTl,
  ]);

  const optionChips = (
    <div id={CATALOG_SECTION_ID} className="scroll-mt-24">
      <CatalogSelector
        appearance="clean"
        profile="plain"
        selection={props.catalogSelection}
        onToggle={props.handleCatalogToggle}
        onClearAll={props.handleCatalogClearAll}
      />
    </div>
  );

  const summaryAside = isAdvantage ? (
    <div className="flex flex-col gap-3">
      <SectionCard title="Kur Projeksiyonu" variant="stitch">
        <RateProjectionInput
          baseRate={props.params.euroRate}
          monthlyGrowthPct={props.monthlyGrowthPct}
          onGrowthChange={props.setMonthlyGrowthPct}
          onReset={props.resetRates}
          months={
            props.rateProjectionMonths ?? (Number(props.params.term) || 0)
          }
          computedRates={props.computedRates}
        />
      </SectionCard>
      <CurrencyComparisonReport
        scheduleEuro={props.calc.plainScheduleEuro}
        scheduleTL={props.calc.plainScheduleTL}
        projectedRates={props.calc.projRates}
        euroRate={props.params.euroRate}
        monthlyGrowthPct={props.monthlyGrowthPct}
        downPaymentEuro={props.params.downPaymentEuro}
        downPaymentTL={props.calc.downPaymentTL}
        term={props.comparisonTerm ?? (Number(props.params.term) || 0)}
        paymentFrequency={paymentFrequency}
      />
    </div>
  ) : (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0F172A]">Maliyet özeti</h3>
        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
          KDV hariç
        </span>
      </div>
      <CostSummaryPanel
        rows={summaryRows}
        currencySymbol={sym}
        layout="stitch"
        totalEuro={totalPrimary}
        stitchPrimaryTotalLabel={stitchPrimaryTotalLabel}
        stitchCompare={financingSupportCompare ?? undefined}
      />
    </>
  );

  return (
    <ProCalcShell>
      <CalcPageHeader
        kicker="Leasing · İleri hesaplama"
        title="İleri hesaplama"
        description="Makine bedelinden taksit ve toplam ödemeye. Tutarlar KDV hariçtir."
        onSummary={props.handleOpenSummaryReport}
        onPaymentPlan={props.handlePrint}
        summaryActionAttr="open-summary"
      />

      <ResultKpiBand items={forwardKpiItems} />

      <div className="grid gap-3 lg:grid-cols-12 lg:items-start [&>*]:min-w-0">
        <section className={cn(CALC_PANEL_CLS, "lg:col-span-7")}>
          <h3 className="sr-only">Girişler</h3>

          <FormStep index={1} title="Müşteri">
            <div className="mb-3">
              <SegmentedControl
                options={tabOptions}
                value={props.activeTab}
                onChange={props.setActiveTab}
              />
            </div>
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
            last={false}
            action={
              <SectionClearAction
                onClick={props.handleClearMachineFinance}
                label="Makine ve finansman alanlarını temizle"
              />
            }
          >
            <FinanceFieldGrid
              variant="plan"
              machineFields={[
                {
                  key: "machinePriceEuro",
                  label: props.machinePriceLabel,
                },
              ]}
              financeFields={props.financeFields}
              values={props.params}
              onChange={props.handleParamChange}
              extra={
                <>
                  <PlanContextFields
                    paymentFrequency={paymentFrequency}
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

          {showExtras ? (
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
                modesStorageKey="llp:v3:forward:fee-modes"
                machinePriceEuro={Number(props.params.machinePriceEuro) || 0}
                term={Number(props.params.term) || 0}
                paymentFrequency={paymentFrequency}
                expenses={props.expenses as FinanceExpenses}
                onExpensesChange={props.onExpensesReplace}
                inputClassName="h-9 border-[#E2E8F0] bg-white text-[13px]"
              />
              <div className="mt-3 border-t border-[#E2E8F0] pt-3">{optionChips}</div>
            </FormStep>
          ) : (
            <FormStep index={3} title="Opsiyonlar" last>
              {optionChips}
            </FormStep>
          )}
        </section>

        <aside
          className={cn(
            CALC_PANEL_CLS,
            "lg:sticky lg:top-[4.75rem] lg:col-span-5",
          )}
        >
          {summaryAside}
        </aside>
      </div>

      {!isAdvantage && !(plainCatalogOnly && isPlainTab) ? (
        <PaymentSchedulePanel
          schedule={schedule}
          currencySymbol={sym}
          downPayment={downPayment}
          interestRatePct={interestRate}
          periodUnit={isAnnual ? "year" : "month"}
          totalPayment={totalPrimary}
        />
      ) : null}
    </ProCalcShell>
  );
}

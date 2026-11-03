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
import SummaryCard from "@/components/finance/ui/SummaryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  EMPTY_CATALOG_SELECTION,
  type CatalogSelection,
} from "@/lib/catalogPrices";
import { getForwardTabOptions } from "@/lib/forwardCalculatorFeatures";
import { buildForwardStitchSummaryRows } from "@/lib/forwardSummaryRows";
import {
  getForwardDisplayMetrics,
  type CalcSlice,
  type ForwardTabId,
} from "@/lib/forwardDisplayMetrics";
import { RefreshCw, RotateCcw, Printer, FileText } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  CatalogScrollRail,
  CATALOG_SECTION_ID,
} from "@/components/finance/ui/CatalogScrollRail";
import FinanceContextBar from "@/components/finance/ui/FinanceContextBar";
import CalcPageHeader from "@/components/finance/ui/CalcPageHeader";
import FinanceKpiStrip, {
  type FinanceKpiItem,
} from "@/components/finance/ui/FinanceKpiStrip";

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

  const attachment = isTry ? display.attachment * rate : display.attachment;
  const maintenance = isTry ? display.maintenance * rate : display.maintenance;
  const equipment = isTry ? display.equipment * rate : display.equipment;
  const catalogOther = isTry
    ? display.catalogOther * rate
    : display.catalogOther;
  const otherExpenses = isTry
    ? display.otherExpenses * rate
    : display.otherExpenses;
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
        otherExpenses,
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
      otherExpenses,
      referenceVadeFarki.primary,
      isTry,
      rate,
      financingSupportAmount,
      totalPrimary,
    ],
  );

  const segments = useMemo(() => {
    const items: { label: string; value: number; color: string }[] = [
      { label: "Makine bedeli", value: machine, color: "#1d4ed8" },
      { label: "Ataşman toplamı", value: attachment, color: "#2563eb" },
      { label: "Bakım paketi", value: maintenance, color: "#3b82f6" },
      { label: "Donanım toplamı", value: equipment, color: "#60a5fa" },
      { label: "Diğer giderler", value: catalogOther, color: "#93c5fd" },
    ];
    if (display.includeExpenses) {
      items.push({
        label: "Ek masraflar (Kasko, Leasing, İthalat)",
        value: otherExpenses,
        color: "#bfdbfe",
      });
    }
    const fin = Math.max(0, referenceVadeFarki.primary);
    if (fin > 0) {
      items.push({
        label: "Finansman maliyeti",
        value: fin,
        color: "#1e3a8a",
      });
    }
    return items;
  }, [
    machine,
    attachment,
    maintenance,
    equipment,
    catalogOther,
    display.includeExpenses,
    otherExpenses,
    referenceVadeFarki.primary,
  ]);

  const tabOptions = getForwardTabOptions();

  const showStitchChrome = Boolean(props.onPaymentFrequencyChange);
  const isPlainTab = props.activeTab === "plain";
  const plainCatalogOnly = display.plainCatalogOnly ?? false;

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

  const forwardKpiItems = useMemo((): FinanceKpiItem[] => {
    if (!showStitchChrome || props.activeTab === "advantage") return [];
    const items: FinanceKpiItem[] = [];
    if (!(plainCatalogOnly && isPlainTab)) {
      items.push({
        label: isAnnual ? "Yıllık taksit" : "Aylık taksit",
        value: monthly,
        hint: isAnnual ? "Seçilen para biriminde" : "Seçilen para biriminde",
        currencySymbol: sym,
        accent: "blue",
        noDecimals: true,
      });
    }
    items.push(
      {
        label: "Toplam ödeme (EUR)",
        value: display.totalEuro,
        hint: "Peşinat dahil",
        currencySymbol: "€",
        accent: "navy",
        noDecimals: true,
      },
      {
        label: "Vade farkı (EUR)",
        value: referenceVadeFarki.euro,
        hint: "Faiz maliyeti (tam)",
        currencySymbol: "€",
        accent: "purple",
        noDecimals: true,
      },
      {
        label: "Toplam ödeme (TL)",
        value: display.totalTl,
        hint: "Peşinat dahil",
        currencySymbol: "₺",
        accent: "green",
      },
    );
    return items;
  }, [
    showStitchChrome,
    props.activeTab,
    plainCatalogOnly,
    isPlainTab,
    isAnnual,
    monthly,
    sym,
    display.totalEuro,
    referenceVadeFarki.euro,
    display.totalTl,
  ]);

  const catalogPage = (
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
  );

  const summaryColumnContent =
    props.activeTab === "advantage" ? (
      <>
        <SectionCard title="Kur Projeksiyonu" variant={showStitchChrome ? "stitch" : "default"}>
          <RateProjectionInput
            baseRate={props.params.euroRate}
            monthlyGrowthPct={props.monthlyGrowthPct}
            onGrowthChange={props.setMonthlyGrowthPct}
            onReset={props.resetRates}
            months={
              props.rateProjectionMonths ??
              (Number(props.params.term) || 0)
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
          term={
            props.comparisonTerm ?? (Number(props.params.term) || 0)
          }
          paymentFrequency={paymentFrequency}
        />
      </>
    ) : showStitchChrome ? (
      <>
        <SectionCard
          title="Maliyet özeti"
          variant="stitch"
          accentBar
        >
          <CostSummaryPanel
            rows={summaryRows}
            currencySymbol={sym}
            layout="stitch"
            totalEuro={totalPrimary}
            stitchPrimaryTotalLabel={
              plainCatalogOnly && isPlainTab
                ? "Toplam tutar"
                : financingSupportCompare
                  ? "Müşteri toplam ödemesi (destekli)"
                  : isTry
                    ? "Toplam ödeme"
                    : "Toplam (EUR)"
            }
            stitchCompare={financingSupportCompare ?? undefined}
          />
        </SectionCard>

        {!(plainCatalogOnly && isPlainTab) ? (
          <PaymentSchedulePanel
            schedule={schedule}
            currencySymbol={sym}
            downPayment={downPayment}
            interestRatePct={interestRate}
            periodUnit={isAnnual ? "year" : "month"}
            defaultExpanded={showStitchChrome}
            comfortable={showStitchChrome}
            totalPayment={totalPrimary}
          />
        ) : null}
      </>
    ) : (
      <>
        <SectionCard
          title="Maliyet özeti"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-bold"
              data-promo-action="open-summary"
              onClick={props.handleOpenSummaryReport}
            >
              <FileText className="h-3.5 w-3.5" />
              Özet rapor
            </Button>
          }
        >
          <CostSummaryPanel
            rows={summaryRows}
            currencySymbol={sym}
            totalLabel="Toplam ödeme"
            totalValue={totalPrimary}
            segments={segments}
            layout="split"
          />
        </SectionCard>

        <PaymentSchedulePanel
          schedule={schedule}
          currencySymbol={sym}
          downPayment={downPayment}
          interestRatePct={interestRate}
          periodUnit={isAnnual ? "year" : "month"}
          defaultExpanded={false}
          totalPayment={totalPrimary}
        />
      </>
    );

  const summaryAsideClass = cn(
    "flex flex-col gap-4",
    showStitchChrome
      ? "lg:sticky lg:top-[4.75rem]"
      : "xl:sticky xl:top-4",
  );

  return (
    <div className="space-y-5 pb-5 max-lg:space-y-4 max-lg:pb-5">
      <CatalogScrollRail
        enabled={showStitchChrome}
        observeKey={props.activeTab}
      />

      {showStitchChrome ? (
        <CalcPageHeader
          kicker="Leasing · İleri hesaplama"
          title="İleri hesaplama"
          description="Makine bedelinden taksit ve toplam ödemeye. Tutarlar KDV hariçtir."
          onSummary={props.handleOpenSummaryReport}
          onPaymentPlan={props.handlePrint}
          summaryActionAttr="open-summary"
        />
      ) : null}

      {showStitchChrome && props.onPaymentFrequencyChange ? (
        <FinanceContextBar
          paymentFrequency={paymentFrequency}
          onPaymentFrequencyChange={props.onPaymentFrequencyChange}
          pdfCurrency={props.pdfCurrency}
          setPdfCurrency={props.setPdfCurrency}
          euroRate={props.params.euroRate}
          onEuroRateChange={(value) => props.handleParamChange("euroRate", value)}
          onRefreshEuroRate={props.handleRefreshEuroRate}
        />
      ) : null}

      {forwardKpiItems.length > 0 ? (
        <FinanceKpiStrip items={forwardKpiItems} heroFirst />
      ) : null}

      {isAnnual && !showStitchChrome ? (
        <p className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-2.5 text-center text-xs font-semibold text-[#565e74] shadow-sm">
          Yılda bir taksit · Vade en fazla 3 yıl · Tutarlar KDV hariçtir
        </p>
      ) : null}

      <div
        className={cn(
          "finance-calc-stack",
          showStitchChrome && !isPlainTab && "finance-calc-stack--with-catalog",
        )}
      >
        <div className="finance-calc-stack__main grid grid-cols-1 gap-4 max-lg:gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
        <div
          className={cn(
            "finance-mobile-tight flex flex-col lg:col-span-5",
            showStitchChrome ? "gap-4 max-lg:gap-3 lg:gap-4" : "gap-6 max-lg:gap-5",
          )}
        >
          <SectionCard
            title="Hesaplama Yöntemi"
            variant={showStitchChrome ? "stitch" : "default"}
            density={showStitchChrome ? "compact" : "default"}
          >
            <SegmentedControl
              options={tabOptions}
              value={props.activeTab}
              onChange={props.setActiveTab}
              size="default"
              className={
                showStitchChrome
                  ? "border-[#c3c6d7] bg-[#eff4ff]/50 [&_button]:min-h-7 [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs md:[&_button]:text-[13px]"
                  : undefined
              }
            />
            {showStitchChrome && isPlainTab ? (
              <p className="llp-pro-hint mt-3 rounded-lg border border-[#004ac6]/20 bg-[#eff4ff] px-3 py-2 text-sm text-[#434655] md:text-[15px]">
                Makine ve finansman bilgilerini girin; opsiyonlar hemen altında,
                sağdaki özet anında güncellenir.
              </p>
            ) : null}
            {!showStitchChrome ? (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Para birimi
                  </Label>
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                        props.pdfCurrency === "EUR"
                          ? "bg-[#2563eb] text-white"
                          : "text-slate-600"
                      }`}
                      onClick={() => props.setPdfCurrency("EUR")}
                    >
                      EUR
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                        props.pdfCurrency === "TRY"
                          ? "bg-[#2563eb] text-white"
                          : "text-slate-600"
                      }`}
                      onClick={() => props.setPdfCurrency("TRY")}
                    >
                      TL
                    </button>
                  </div>
                </div>
                <div className="min-w-[8rem] flex-1 space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Kur (₺ / €)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className="h-9 bg-white"
                      type="number"
                      step="0.01"
                      value={props.params.euroRate || ""}
                      onChange={(e) =>
                        props.handleParamChange(
                          "euroRate",
                          Number(e.target.value.replace(",", ".")) || 0,
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => props.handleRefreshEuroRate()}
                      title="Referans kur"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Makine ve Finansman"
            description="KDV hariç tutarlar"
            variant={showStitchChrome ? "stitch" : "default"}
            density={showStitchChrome ? "compact" : "default"}
            action={
              <SectionClearAction
                onClick={props.handleClearMachineFinance}
                label="Makine ve finansman alanlarını temizle"
              />
            }
          >
            <FinanceFieldGrid
              layout={showStitchChrome ? "stack" : "split"}
              machineTitle="Makine bilgileri"
              financeTitle={props.financeCardTitle}
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
                {
                  key: "machinePriceEuro",
                  label: props.machinePriceLabel,
                },
              ]}
              financeFields={props.financeFields}
              values={props.params}
              onChange={props.handleParamChange}
              comfortable={showStitchChrome}
            />
          </SectionCard>

          {(props.activeTab === "campaign" ||
            props.activeTab === "allin") && (
            <SectionCard
              title="Ek Masraflar"
              description="(Kasko, Leasing, İthalat)"
              variant={showStitchChrome ? "stitch" : "default"}
              density={showStitchChrome ? "compact" : "default"}
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
                inputClassName="h-8 border-[#c3c6d7] bg-white text-[13px] md:text-sm"
              />
            </SectionCard>
          )}

          {showStitchChrome && isPlainTab ? (
            <div id={CATALOG_SECTION_ID} className="scroll-mt-24">
              <CatalogSelector
                appearance="clean"
                layout="full"
                density="compact"
                profile="plain"
                selection={props.catalogSelection}
                onToggle={props.handleCatalogToggle}
                onClearAll={props.handleCatalogClearAll}
              />
            </div>
          ) : null}

          {!showStitchChrome ? (
            <CatalogSelector
              appearance="clean"
              layout="full"
              density="compact"
              selection={props.catalogSelection}
              onToggle={props.handleCatalogToggle}
              onClearAll={props.handleCatalogClearAll}
            />
          ) : null}
        </div>

        <div className={cn("hidden lg:flex lg:col-span-7", summaryAsideClass)}>
          {summaryColumnContent}
        </div>
        </div>

        {showStitchChrome && !isPlainTab ? (
          <div className="finance-calc-stack__catalog">{catalogPage}</div>
        ) : null}

        <div className="finance-calc-stack__summary flex flex-col gap-4 max-lg:gap-3 lg:hidden">
          {summaryColumnContent}
        </div>
      </div>

      {!showStitchChrome ? (
        <>
      <div className="space-y-3 border-t border-slate-200/80 pt-6">
        <h2 className="text-sm font-bold text-slate-800">Özet sonuç</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label={isAnnual ? "Yıllık Taksit" : "Aylık Taksit"}
            value={monthly}
            hint={isAnnual ? "Yıllık ödeme tutarı" : "Aylık ödeme tutarı"}
            currencySymbol={sym}
            accent="blue"
            noDecimals
          />
          <SummaryCard
            label="Toplam Ödeme EUR"
            value={display.totalEuro}
            hint="Peşinat dahil toplam"
            currencySymbol="€"
            accent="green"
            noDecimals
          />
          <SummaryCard
            label="Vade Farkı"
            value={referenceVadeFarki.euro}
            hint="Faiz maliyeti (tam)"
            currencySymbol="€"
            accent="purple"
            noDecimals
          />
          <SummaryCard
            label="Toplam Ödeme TL"
            value={display.totalTl}
            hint="Peşinat dahil toplam"
            currencySymbol="₺"
            accent="orange"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="gap-2 font-bold"
          onClick={props.handleNewCalculation}
        >
          <RotateCcw className="h-4 w-4" />
          Yeni Hesaplama
        </Button>
        <Button
          type="button"
          className="gap-2 bg-[#2563eb] font-bold hover:bg-[#1d4ed8] sm:min-w-[240px]"
          onClick={props.handlePrint}
        >
          <Printer className="h-4 w-4" />
          Ödeme planı oluştur
        </Button>
      </div>

      <p className="text-center text-[10px] font-medium text-slate-400">
        * Hesaplamalar bilgilendirme amaçlıdır. Resmi teklif için bizimle iletişime
        geçiniz.
      </p>
        </>
      ) : null}
    </div>
  );
}

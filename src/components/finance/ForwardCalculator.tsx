"use client";

import {
  FORWARD_DEFAULT_ACTIVE_TAB,
  normalizeForwardActiveTab,
} from "@/lib/forwardCalculatorFeatures";
import {
  migrateLegacyForwardTermInParams,
  normalizeForwardTermMonths,
} from "@/lib/forwardTerm";
import { useEffect, useMemo, useState } from "react";
import ForwardCalculatorLayout from "@/components/finance/ForwardCalculatorLayout";
import { FinanceDocumentPreviewModal } from "@/components/finance/FinanceDocumentPreviewModal";
import PrintablePDF, { PrintablePDFPreviewModal } from "@/components/finance/PrintablePDF";
import type { PrintableCalculationSummaryProps } from "@/components/finance/PrintableCalculationSummary";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  EMPTY_CATALOG_SELECTION,
  resolveCatalogSelection,
} from "@/lib/catalogPrices";
import { useCatalogSelection } from "@/lib/useCatalogSelection";
import { buildDetailedSummaryReportRows } from "@/lib/calculationSummaryReport";
import { forwardSummaryReportFinancing } from "@/lib/financingSupportReport";
import { clearForwardMachineFinance } from "@/lib/financeFormClear";
import { computeMonthlyForwardCalc } from "@/lib/forwardCalculatorCore";
import { getForwardDisplayMetrics } from "@/lib/forwardDisplayMetrics";
import { fetchReferenceTryRates } from "@/lib/referenceRates";
import { usePersistentState } from "@/lib/usePersistentState";
import { EMPTY_EXPENSES } from "@/components/finance/ExpenseInputCard";

const FORWARD_STORAGE_PREFIX = "llp:v2:forward";

export default function ForwardCalculator(props: {
  paymentFrequency?: "monthly" | "annual";
  onPaymentFrequencyChange?: (v: "monthly" | "annual") => void;
}) {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState(false);
  const [activeTab, setActiveTab] = usePersistentState<
    "campaign" | "plain" | "allin" | "advantage"
  >(
    `${FORWARD_STORAGE_PREFIX}:shared:active-tab`,
    FORWARD_DEFAULT_ACTIVE_TAB,
  );

  useEffect(() => {
    const normalized = normalizeForwardActiveTab(activeTab);
    if (normalized !== activeTab) setActiveTab(normalized);
  }, [activeTab, setActiveTab]);
  const [pdfCurrency, setPdfCurrency] = usePersistentState<"EUR" | "TRY">(
    `${FORWARD_STORAGE_PREFIX}:shared:pdf-currency`,
    "EUR",
  );
  const [sharedParams, setSharedParams] = usePersistentState(
    `${FORWARD_STORAGE_PREFIX}:shared:params`,
    {
      euroRate: 51.5,
      dollarRate: 42,
      firma: "Maats Makia A.Ş.",
      makine: "MT 1840-100",
      machinePriceEuro: 0,
      euroInterest: 6.8,
      tlInterest: 42,
      downPaymentEuro: 0,
      financingSupportEuro: 0,
      term: 0,
    },
  );
  const [expenses, setExpenses] = usePersistentState(
    `${FORWARD_STORAGE_PREFIX}:shared:expenses`,
    { ...EMPTY_EXPENSES },
  );
  const [monthlyGrowthPct, setMonthlyGrowthPct] = usePersistentState(
    `${FORWARD_STORAGE_PREFIX}:shared:monthly-growth-pct`,
    1.5,
  );
  const { selection: catalogSelection, setSelection, toggle: handleCatalogToggle } =
    useCatalogSelection();
  const { categories: catalogCategories } = useCatalogCategories();

  const params = sharedParams;

  useEffect(() => {
    migrateLegacyForwardTermInParams(setSharedParams);
  }, [setSharedParams]);

  const handleParamChange = (key: string, value: string | number) => {
    if (key === "term") {
      setSharedParams((prev) => ({
        ...prev,
        term: normalizeForwardTermMonths(value),
      }));
      return;
    }

    setSharedParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleExpenseChange = (key: string, value: number) =>
    setExpenses((prev) => ({ ...prev, [key]: value }));
  const resetRates = () => setMonthlyGrowthPct(1.5);

  const handleCatalogClearAll = () =>
    setSelection(EMPTY_CATALOG_SELECTION);

  const handleRefreshEuroRate = () => {
    void fetchReferenceTryRates().then(({ eurTry, usdTry }) => {
      if (eurTry != null && Number.isFinite(eurTry)) {
        handleParamChange("euroRate", eurTry);
      }
      if (usdTry != null && Number.isFinite(usdTry)) {
        handleParamChange("dollarRate", usdTry);
      }
    });
  };

  const handleNewCalculation = () => {
    setSharedParams({
      euroRate: 51.5,
      dollarRate: 42,
      firma: "Maats Makia A.Ş.",
      makine: "MT 1840-100",
      machinePriceEuro: 0,
      euroInterest: 6.8,
      tlInterest: 42,
      downPaymentEuro: 0,
      financingSupportEuro: 0,
      term: 0,
    });
    setExpenses({ ...EMPTY_EXPENSES });
    setSelection(EMPTY_CATALOG_SELECTION);
    setMonthlyGrowthPct(1.5);
    setActiveTab(FORWARD_DEFAULT_ACTIVE_TAB);
    setPdfCurrency("EUR");
  };

  const computedRates = useMemo(() => {
    const rates: number[] = [];
    for (let i = 0; i < 36; i++) {
      rates.push(
        params.euroRate *
          Math.pow(1 + monthlyGrowthPct / 100, i + 1),
      );
    }
    return rates;
  }, [params.euroRate, monthlyGrowthPct]);

  const calc = useMemo(() => {
    const {
      machinePriceEuro,
      euroRate,
      euroInterest,
      tlInterest,
      downPaymentEuro,
      financingSupportEuro,
    } = params;
    const termMonths = normalizeForwardTermMonths(params.term);
    const catalog = resolveCatalogSelection(
      catalogSelection,
      catalogCategories,
    );
    const core = computeMonthlyForwardCalc({
      machinePriceEuro,
      euroRate,
      termMonths,
      euroInterest,
      tlInterest,
      downPaymentEuro,
      financingSupportEuro: Number(financingSupportEuro) || 0,
      catalogTotalEuro: catalog.totalEuro,
      catalogLines: catalog.lines,
      expenses,
      computedRates,
    });
    return {
      ...core,
      baseMachineTL: core.baseMachineTL,
    };
  }, [params, expenses, computedRates, catalogSelection, catalogCategories]);

  const baselineCalc = useMemo(() => {
    const {
      machinePriceEuro,
      euroRate,
      euroInterest,
      tlInterest,
      downPaymentEuro,
    } = params;
    const termMonths = normalizeForwardTermMonths(params.term);
    const catalog = resolveCatalogSelection(
      catalogSelection,
      catalogCategories,
    );
    return computeMonthlyForwardCalc({
      machinePriceEuro,
      euroRate,
      termMonths,
      euroInterest,
      tlInterest,
      downPaymentEuro,
      financingSupportEuro: 0,
      catalogTotalEuro: catalog.totalEuro,
      catalogLines: catalog.lines,
      expenses,
      computedRates,
    });
  }, [params, expenses, computedRates, catalogSelection, catalogCategories]);

  const handlePrint = () => {
    setIsMobilePreviewOpen(true);
  };

  const display = useMemo(
    () => getForwardDisplayMetrics(activeTab, calc, params),
    [activeTab, calc, params],
  );

  const tabLabel =
    activeTab === "campaign"
      ? "Kampanyalı Fiyat"
      : activeTab === "plain"
        ? "Sade Makine"
        : activeTab === "allin"
          ? "Her Şey Dahil"
          : "Kur Avantajı";

  const calculationSummary = useMemo((): PrintableCalculationSummaryProps => {
    const isAnnual = props.paymentFrequency === "annual";
    const isTry = pdfCurrency === "TRY";
    const rate = Number(params.euroRate ?? 0);
    const scale = (v: number) => (isTry ? v * rate : v);
    const machinePriceLabel =
      activeTab === "campaign"
        ? "Kampanyalı makine bedeli"
        : "Makine bedeli";
    const financing = forwardSummaryReportFinancing({
      financingSupportEuro: Number(params.financingSupportEuro) || 0,
      activeTab,
      baselineCalc,
      params: {
        downPaymentEuro: Number(params.downPaymentEuro ?? 0),
        euroRate: rate,
        euroInterest: Number(params.euroInterest ?? 0),
        tlInterest: Number(params.tlInterest ?? 0),
        term: Number(params.term ?? 0),
      },
      display,
      currencyIsTry: isTry,
    });
    const baseRows = buildDetailedSummaryReportRows({
      catalogLines: calc.catalogLines,
      expenses,
      includeExpenses: display.includeExpenses,
      vadeFarkiEuro: financing.vadeFarkiDisplay,
      financingSupport: financing.financingSupportDisplay,
    });
    return {
      firma: String(params.firma ?? ""),
      makine: String(params.makine ?? ""),
      tabLabel,
      activeTab,
      machinePriceEuro: Number(params.machinePriceEuro ?? 0),
      machinePriceLabel,
      downPaymentEuro: Number(params.downPaymentEuro ?? 0),
      term: Number(params.term ?? 0),
      termUnit: isAnnual ? "year" : "month",
      euroInterest:
        activeTab === "campaign" ? 0 : Number(params.euroInterest ?? 0),
      tlInterest: activeTab === "campaign" ? 0 : Number(params.tlInterest ?? 0),
      euroRate: rate,
      rows: baseRows.map((row) => ({
        ...row,
        valueEuro:
          isTry &&
          (row.label === "Finansman maliyeti (vade farkı)" ||
            row.label === "Finansman desteği")
            ? row.valueEuro
            : scale(row.valueEuro),
      })),
      financingSupportDisplay: financing.financingSupportDisplay,
      supportCompare: financing.compare,
      primaryTotalLabel: financing.compare
        ? "Müşteri toplam ödemesi (destekli)"
        : undefined,
      totalEuro: display.totalEuro,
      totalTl: display.totalTl,
      monthlyInstallmentEuro: display.monthlyEuro,
      monthlyInstallmentTl: display.monthlyTl,
      installmentLabel: isAnnual ? "Yıllık Taksit:" : "Aylık Taksit:",
      currency: pdfCurrency,
    };
  }, [
    activeTab,
    baselineCalc,
    calc.catalogLines,
    display,
    expenses,
    params.financingSupportEuro,
    params.downPaymentEuro,
    params.euroInterest,
    params.euroRate,
    params.firma,
    params.makine,
    params.machinePriceEuro,
    params.term,
    params.tlInterest,
    pdfCurrency,
    props.paymentFrequency,
    tabLabel,
  ]);

  const machinePriceLabel =
    activeTab === "campaign"
      ? "Kampanyalı Makina Bedeli (€) KDV Hariç"
      : "Makine Bedeli (€) KDV Hariç";
  const financeCardTitle =
    activeTab === "campaign" ? "Ödeme Detayları" : "Finansman Detayları";
  const financeFields =
    activeTab === "campaign"
      ? [
          { key: "downPaymentEuro", label: "Peşinat (€)" },
          { key: "term", label: "Vade (Ay)" },
        ]
      : [
          { key: "downPaymentEuro", label: "Peşinat (€)" },
          { key: "term", label: "Vade (Ay)" },
          {
            key: "euroInterest",
            label: "Euro Faiz Oranı (%)",
            step: "0.1",
          },
          {
            key: "tlInterest",
            label: "TL Faiz Oranı (%)",
            step: "0.1",
          },
        ];

  const handleClearExpenses = () => setExpenses({ ...EMPTY_EXPENSES });
  const handleClearMachineFinance = () =>
    clearForwardMachineFinance(handleParamChange, [
      ...financeFields.map((field) => field.key),
      "financingSupportEuro",
    ]);

  const printMode =
    activeTab === "campaign"
      ? "campaign"
      : activeTab === "allin"
        ? "allin"
        : "plain";
  const printParams =
    activeTab === "campaign"
      ? { ...params, euroInterest: 0, tlInterest: 0 }
      : params;
  const printCalc = {
    plainScheduleEuro:
      activeTab === "campaign"
        ? calc.campaignScheduleEuro
        : activeTab === "allin"
          ? calc.allInScheduleEuro
          : calc.plainScheduleEuro,
    plainScheduleTL:
      activeTab === "campaign"
        ? calc.campaignScheduleTL
        : activeTab === "allin"
          ? calc.allInScheduleTL
          : calc.plainScheduleTL,
    plainMonthlyEuro:
      activeTab === "campaign"
        ? calc.campaignMonthlyEuro
        : activeTab === "allin"
          ? calc.allInMonthlyEuro
          : calc.plainMonthlyEuro,
    plainMonthlyTL:
      activeTab === "campaign"
        ? calc.campaignMonthlyTL
        : activeTab === "allin"
          ? calc.allInMonthlyTL
          : calc.plainMonthlyTL,
    totalExpenses: calc.totalExpenses,
  };

  return (
    <>
      <ForwardCalculatorLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pdfCurrency={pdfCurrency}
        setPdfCurrency={setPdfCurrency}
        params={params}
        calc={calc}
        baselineCalc={baselineCalc}
        expenses={expenses}
        catalogSelection={catalogSelection}
        handleParamChange={handleParamChange}
        handleExpenseChange={handleExpenseChange}
        onExpensesReplace={setExpenses}
        handleCatalogToggle={handleCatalogToggle}
        handleCatalogClearAll={handleCatalogClearAll}
        handleClearMachineFinance={handleClearMachineFinance}
        handleClearExpenses={handleClearExpenses}
        handlePrint={handlePrint}
        handleOpenSummaryReport={() => setSummaryReportOpen(true)}
        handleNewCalculation={handleNewCalculation}
        handleRefreshEuroRate={handleRefreshEuroRate}
        machinePriceLabel={machinePriceLabel}
        financeCardTitle={financeCardTitle}
        financeFields={financeFields}
        monthlyGrowthPct={monthlyGrowthPct}
        setMonthlyGrowthPct={setMonthlyGrowthPct}
        resetRates={resetRates}
        computedRates={computedRates}
        paymentFrequency={props.paymentFrequency}
        onPaymentFrequencyChange={props.onPaymentFrequencyChange}
      />

      {!summaryReportOpen && !isMobilePreviewOpen ? (
        <PrintablePDF
          params={printParams}
          calc={printCalc}
          mode={printMode}
          expenses={expenses}
          printCurrency={pdfCurrency}
        />
      ) : null}
      <FinanceDocumentPreviewModal
        open={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
        variant="calculation-summary"
        calculationSummary={calculationSummary}
      />
      <PrintablePDFPreviewModal
        open={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        params={printParams}
        calc={printCalc}
        mode={printMode}
        expenses={expenses}
        printCurrency={pdfCurrency}
      />
    </>
  );
}

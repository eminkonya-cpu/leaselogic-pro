"use client";

import { useMemo, useState } from "react";
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
import { clearForwardMachineFinance } from "@/lib/financeFormClear";
import { calculatePMT, generateAmortization } from "@/lib/financeCalculations";
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
    "campaign",
  );
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
    },
  );
  const [term, setTerm] = usePersistentState(`${FORWARD_STORAGE_PREFIX}:term-monthly`, 0);
  const [expenses, setExpenses] = usePersistentState(
    `${FORWARD_STORAGE_PREFIX}:shared:expenses`,
    {
    kasko1: 0,
    kasko2: 0,
    kasko3: 0,
    kasko4: 0,
    leasingCost: 0,
    importCost: 0,
    },
  );
  const [monthlyGrowthPct, setMonthlyGrowthPct] = usePersistentState(
    `${FORWARD_STORAGE_PREFIX}:shared:monthly-growth-pct`,
    1.5,
  );
  const { selection: catalogSelection, setSelection, toggle: handleCatalogToggle } =
    useCatalogSelection();
  const { categories: catalogCategories } = useCatalogCategories();

  const params = useMemo(() => ({ ...sharedParams, term }), [sharedParams, term]);

  const handleParamChange = (key: string, value: string | number) => {
    if (key === "term") {
      setTerm(Number(value));
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
    });
    setTerm(0);
    setExpenses({
      kasko1: 0,
      kasko2: 0,
      kasko3: 0,
      kasko4: 0,
      leasingCost: 0,
      importCost: 0,
    });
    setSelection(EMPTY_CATALOG_SELECTION);
    setMonthlyGrowthPct(1.5);
    setActiveTab("campaign");
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
      term,
      euroInterest,
      tlInterest,
      downPaymentEuro,
    } = params;
    const catalog = resolveCatalogSelection(
      catalogSelection,
      catalogCategories,
    );
    const machineWithCatalogEuro = machinePriceEuro + catalog.totalEuro;
    const priceTL = machineWithCatalogEuro * euroRate;
    const baseMachineTL = machinePriceEuro * euroRate;
    const downPaymentTL = downPaymentEuro * euroRate;
    const plainFinanceEuro = machineWithCatalogEuro - downPaymentEuro;
    const plainFinanceTL = priceTL - downPaymentTL;
    const plainMonthlyEuro = calculatePMT(plainFinanceEuro, euroInterest, term);
    const plainMonthlyTL = calculatePMT(plainFinanceTL, tlInterest, term);
    const plainTotalEuro = plainMonthlyEuro * term + downPaymentEuro;
    const plainTotalTL = plainMonthlyTL * term + downPaymentTL;
    const plainDiffEuro = plainTotalEuro - machineWithCatalogEuro;
    const plainDiffTL = plainTotalTL - priceTL;
    const plainScheduleEuro = generateAmortization(
      plainFinanceEuro,
      euroInterest,
      term,
    );
    const plainScheduleTL = generateAmortization(
      plainFinanceTL,
      tlInterest,
      term,
    );
    const totalExpenses = Object.values(expenses).reduce(
      (s, v) => s + (v || 0),
      0,
    );
    const totalExpensesTL = totalExpenses * euroRate;
    const allInBaseEuro = machineWithCatalogEuro + totalExpenses;
    const allInBaseTL = priceTL + totalExpensesTL;
    const allInFinanceEuro = Math.max(0, allInBaseEuro - downPaymentEuro);
    const allInFinanceTL = Math.max(0, allInBaseTL - downPaymentTL);
    const allInMonthlyEuro = calculatePMT(allInFinanceEuro, euroInterest, term);
    const allInMonthlyTL = calculatePMT(allInFinanceTL, tlInterest, term);
    const allInTotalEuro = allInMonthlyEuro * term + downPaymentEuro;
    const allInTotalTL = allInMonthlyTL * term + downPaymentTL;
    const allInDiffEuro = allInTotalEuro - allInBaseEuro;
    const allInDiffTL = allInTotalTL - allInBaseTL;
    const allInScheduleEuro = generateAmortization(
      allInFinanceEuro,
      euroInterest,
      term,
    );
    const allInScheduleTL = generateAmortization(
      allInFinanceTL,
      tlInterest,
      term,
    );
    const campaignRemainingEuro = Math.max(0, allInBaseEuro - downPaymentEuro);
    const campaignRemainingTL = Math.max(0, allInBaseTL - downPaymentTL);
    const campaignMonthlyEuro = calculatePMT(campaignRemainingEuro, 0, term);
    const campaignMonthlyTL = calculatePMT(campaignRemainingTL, 0, term);
    const campaignScheduleEuro = generateAmortization(
      campaignRemainingEuro,
      0,
      term,
    );
    const campaignScheduleTL = generateAmortization(
      campaignRemainingTL,
      0,
      term,
    );
    const netMachineEuro = machinePriceEuro;
    const projRates = computedRates
      .slice(0, term)
      .map((r, i) => ({ month: i + 1, rate: r }));

    return {
      catalogLines: catalog.lines,
      catalogTotalEuro: catalog.totalEuro,
      machineWithCatalogEuro,
      baseMachineTL,
      priceTL,
      downPaymentTL,
      plainFinanceEuro,
      plainFinanceTL,
      plainMonthlyEuro,
      plainMonthlyTL,
      plainTotalEuro,
      plainTotalTL,
      plainDiffEuro,
      plainDiffTL,
      plainScheduleEuro,
      plainScheduleTL,
      allInMonthlyEuro,
      allInMonthlyTL,
      allInScheduleEuro,
      allInScheduleTL,
      totalExpenses,
      totalExpensesTL,
      allInBaseEuro,
      allInBaseTL,
      allInFinanceEuro,
      allInFinanceTL,
      campaignRemainingEuro,
      campaignRemainingTL,
      campaignMonthlyEuro,
      campaignMonthlyTL,
      campaignScheduleEuro,
      campaignScheduleTL,
      allInTotalEuro,
      allInTotalTL,
      allInDiffEuro,
      allInDiffTL,
      netMachineEuro,
      projRates,
    };
  }, [params, expenses, computedRates, catalogSelection, catalogCategories]);

  const handlePrint = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobilePreviewOpen(true);
      return;
    }
    window.print();
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
    const baseRows = buildDetailedSummaryReportRows({
      catalogLines: calc.catalogLines,
      expenses,
      includeExpenses: display.includeExpenses,
      vadeFarkiEuro: isTry ? display.vadeFarkiTl : display.vadeFarkiEuro,
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
          isTry && row.label === "Finansman maliyeti (vade farkı)"
            ? row.valueEuro
            : scale(row.valueEuro),
      })),
      totalEuro: display.totalEuro,
      totalTl: display.totalTl,
      monthlyInstallmentEuro: display.monthlyEuro,
      monthlyInstallmentTl: display.monthlyTl,
      installmentLabel: isAnnual ? "Yıllık Taksit:" : "Aylık Taksit:",
      currency: pdfCurrency,
    };
  }, [
    activeTab,
    calc.catalogLines,
    display,
    expenses,
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
          { key: "downPaymentEuro", label: "Peşinat (€)", placeholder: "20000" },
          { key: "term", label: "Vade (Ay)", placeholder: "24" },
        ]
      : [
          { key: "downPaymentEuro", label: "Peşinat (€)", placeholder: "20000" },
          { key: "term", label: "Vade (Ay)", placeholder: "24" },
          {
            key: "euroInterest",
            label: "Euro Faiz Oranı (%)",
            placeholder: "6.5",
            step: "0.1",
          },
          {
            key: "tlInterest",
            label: "TL Faiz Oranı (%)",
            placeholder: "38",
            step: "0.1",
          },
        ];

  const handleClearExpenses = () => setExpenses({ ...EMPTY_EXPENSES });
  const handleClearMachineFinance = () =>
    clearForwardMachineFinance(
      handleParamChange,
      financeFields.map((field) => field.key),
    );

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
        expenses={expenses}
        catalogSelection={catalogSelection}
        handleParamChange={handleParamChange}
        handleExpenseChange={handleExpenseChange}
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

      {!summaryReportOpen ? (
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

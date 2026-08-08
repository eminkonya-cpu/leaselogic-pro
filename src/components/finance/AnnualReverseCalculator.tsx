"use client";

import { useMemo, useState } from "react";
import ReverseCalculatorLayout from "@/components/finance/ReverseCalculatorLayout";
import { FinanceDocumentPreviewModal } from "@/components/finance/FinanceDocumentPreviewModal";
import PrintableReversePDF, {
  type PrintableReversePdfProps,
} from "@/components/finance/PrintableReversePDF";
import type { PrintableReverseSummaryProps } from "@/components/finance/PrintableReverseSummary";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  EMPTY_CATALOG_SELECTION,
  resolveCatalogSelection,
  type CatalogLine,
} from "@/lib/catalogPrices";
import { useCatalogSelection } from "@/lib/useCatalogSelection";
import { buildDetailedReverseReportRows } from "@/lib/reverseSummaryReport";
import {
  computeReverseFinanceLeg,
  type ReverseFinanceLeg,
} from "@/lib/reverseFinanceCalc";
import { fetchReferenceTryRates } from "@/lib/referenceRates";
import { usePersistentState } from "@/lib/usePersistentState";

const REVERSE_STORAGE_PREFIX = "llp:v2:reverse";

type ReverseCalcBundle = {
  catalogLines: CatalogLine[];
  totalExpensesEuro: number;
  euro: ReverseFinanceLeg;
  tl: ReverseFinanceLeg;
};

function clampTermYears(v: string | number) {
  const raw =
    typeof v === "string"
      ? Number(String(v).replace(",", "."))
      : Number(v);
  const n = Math.trunc(Number.isFinite(raw) ? raw : 0);
  return Math.min(3, Math.max(0, n));
}

function computeBothLegs(
  params: {
    allInTotalEuro: number;
    downPaymentEuro: number;
    euroRate: number;
    euroInterest: number;
    tlInterest: number;
    term: number;
  },
  totalExpensesEuro: number,
  catalogTotalEuro: number,
  paymentMode: "monthly" | "annual",
) {
  const rate = params.euroRate;
  return {
    euro: computeReverseFinanceLeg({
      allInTotal: params.allInTotalEuro,
      downPayment: params.downPaymentEuro,
      annualRatePct: params.euroInterest,
      term: params.term,
      totalExpenses: totalExpensesEuro,
      catalogTotal: catalogTotalEuro,
      paymentMode,
    }),
    tl: computeReverseFinanceLeg({
      allInTotal: params.allInTotalEuro * rate,
      downPayment: params.downPaymentEuro * rate,
      annualRatePct: params.tlInterest,
      term: params.term,
      totalExpenses: totalExpensesEuro * rate,
      catalogTotal: catalogTotalEuro * rate,
      paymentMode,
    }),
  };
}

function buildReverseSummaryProps(args: {
  firma: string;
  makine: string;
  frequencyLabel: string;
  pdfCurrency: "EUR" | "TRY";
  allInTotalEuro: number;
  downPaymentEuro: number;
  euroRate: number;
  euroInterest: number;
  tlInterest: number;
  term: number;
  termUnit: "month" | "year";
  installmentLabel: string;
  catalogLines: CatalogLine[];
  expenses: Record<string, number>;
  calc: ReverseCalcBundle;
}): PrintableReverseSummaryProps {
  const isTry = args.pdfCurrency === "TRY";
  const rate = args.euroRate;
  const leg = isTry ? args.calc.tl : args.calc.euro;
  const catalogAmount = (line: CatalogLine) =>
    isTry ? line.priceEuro * rate : line.priceEuro;
  const expenseAmount = (v: number) => (isTry ? v * rate : v);

  return {
    firma: args.firma,
    makine: args.makine,
    frequencyLabel: args.frequencyLabel,
    currency: args.pdfCurrency,
    currencySymbol: isTry ? "₺" : "€",
    allInTotal: isTry ? args.allInTotalEuro * rate : args.allInTotalEuro,
    downPayment: isTry
      ? args.downPaymentEuro * rate
      : args.downPaymentEuro,
    term: args.term,
    termUnit: args.termUnit,
    planInterest: isTry ? args.tlInterest : args.euroInterest,
    euroRate: args.euroRate,
    interestDiff: leg.interestDiff,
    displayNetMachine: leg.displayNetMachine,
    detailRows: buildDetailedReverseReportRows({
      catalogLines: args.catalogLines,
      expenses: args.expenses,
      interestDiff: leg.interestDiff,
      catalogAmount,
      expenseAmount,
    }),
    totalPayment: leg.total,
    installment: leg.installment,
    installmentLabel: args.installmentLabel,
  };
}

export default function AnnualReverseCalculator(props: {
  paymentFrequency?: "monthly" | "annual";
  onPaymentFrequencyChange?: (v: "monthly" | "annual") => void;
}) {
  const [summaryReportOpen, setSummaryReportOpen] = useState(false);
  const [pdfCurrency, setPdfCurrency] = usePersistentState<"EUR" | "TRY">(
    `${REVERSE_STORAGE_PREFIX}:pdf-currency`,
    "EUR",
  );

  const [sharedParams, setSharedParams] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:shared:params`,
    {
      allInTotalEuro: 100_000,
      euroRate: 50.5,
      downPaymentEuro: 0,
      euroInterest: 6.5,
      tlInterest: 42,
      firma: "",
      makine: "",
    },
  );
  const [term, setTerm] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:term-annual`,
    "0",
  );
  const [expenses, setExpenses] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:shared:expenses`,
    {
      kasko1: 0,
      kasko2: 0,
      kasko3: 0,
      leasingCost: 0,
      importCost: 0,
    },
  );

  const { selection: catalogSelection, toggle: handleCatalogToggle, setSelection } =
    useCatalogSelection();
  const { categories: catalogCategories } = useCatalogCategories();

  const params = useMemo(() => ({ ...sharedParams, term }), [sharedParams, term]);
  const termYears = clampTermYears(params.term);

  const handleParamChange = (key: string, value: string | number) => {
    if (key === "term") {
      setTerm(String(value));
      return;
    }
    if (key === "firma" || key === "makine") {
      setSharedParams((prev) => ({
        ...prev,
        [key]: String(value),
      }));
      return;
    }
    const n =
      typeof value === "string"
        ? Number(String(value).replace(",", "."))
        : Number(value);
    setSharedParams((prev) => ({
      ...prev,
      [key]: Number.isFinite(n) ? n : 0,
    }));
  };

  const handleExpenseChange = (key: string, value: number) =>
    setExpenses((prev) => ({ ...prev, [key]: value }));

  const handleCatalogClearAll = () => setSelection(EMPTY_CATALOG_SELECTION);

  const handleRefreshEuroRate = () => {
    void fetchReferenceTryRates().then(({ eurTry }) => {
      if (eurTry != null && Number.isFinite(eurTry)) {
        handleParamChange("euroRate", eurTry);
      }
    });
  };

  const handleNewCalculation = () => {
    setSharedParams({
      allInTotalEuro: 100_000,
      euroRate: 50.5,
      downPaymentEuro: 0,
      euroInterest: 6.5,
      tlInterest: 42,
      firma: "",
      makine: "",
    });
    setTerm("0");
    setExpenses({
      kasko1: 0,
      kasko2: 0,
      kasko3: 0,
      leasingCost: 0,
      importCost: 0,
    });
    setSelection(EMPTY_CATALOG_SELECTION);
    setPdfCurrency("EUR");
  };

  const calc = useMemo((): ReverseCalcBundle => {
    const catalog = resolveCatalogSelection(
      catalogSelection,
      catalogCategories,
    );
    const totalExpensesEuro = Object.values(expenses).reduce(
      (s, v) => s + (v || 0),
      0,
    );
    const legs = computeBothLegs(
      {
        allInTotalEuro: params.allInTotalEuro,
        downPaymentEuro: params.downPaymentEuro,
        euroRate: params.euroRate,
        euroInterest: params.euroInterest,
        tlInterest: params.tlInterest,
        term: termYears,
      },
      totalExpensesEuro,
      catalog.totalEuro,
      "annual",
    );
    return {
      catalogLines: catalog.lines,
      totalExpensesEuro,
      ...legs,
    };
  }, [params, expenses, catalogSelection, catalogCategories, termYears]);

  const reverseSummary = useMemo(
    (): PrintableReverseSummaryProps =>
      buildReverseSummaryProps({
        firma: params.firma,
        makine: params.makine,
        frequencyLabel: "Yılda bir ödeme · Geri hesaplama",
        pdfCurrency,
        allInTotalEuro: params.allInTotalEuro,
        downPaymentEuro: params.downPaymentEuro,
        euroRate: params.euroRate,
        euroInterest: params.euroInterest,
        tlInterest: params.tlInterest,
        term: termYears,
        termUnit: "year",
        installmentLabel: "Yıllık Taksit:",
        catalogLines: calc.catalogLines,
        expenses,
        calc,
      }),
    [calc, expenses, params, pdfCurrency, termYears],
  );

  const printPayload = useMemo((): PrintableReversePdfProps => {
    const leg = pdfCurrency === "TRY" ? calc.tl : calc.euro;
    return {
      summary: reverseSummary,
      schedule: leg.schedule,
      printCurrency: pdfCurrency,
      paymentMode: "annual",
      downPayment: reverseSummary.downPayment,
      planInterest: reverseSummary.planInterest,
    };
  }, [calc.euro, calc.tl, pdfCurrency, reverseSummary]);

  const handlePrint = () => {
    window.print();
  };

  const paymentFrequency = props.paymentFrequency ?? "annual";

  if (!props.onPaymentFrequencyChange) {
    return null;
  }

  return (
    <>
      <ReverseCalculatorLayout
        paymentFrequency={paymentFrequency}
        onPaymentFrequencyChange={props.onPaymentFrequencyChange}
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
        handlePrint={handlePrint}
        handleOpenSummaryReport={() => setSummaryReportOpen(true)}
        handleNewCalculation={handleNewCalculation}
        handleRefreshEuroRate={handleRefreshEuroRate}
        termYears={termYears}
      />

      {!summaryReportOpen ? (
        <PrintableReversePDF {...printPayload} />
      ) : null}
      <FinanceDocumentPreviewModal
        open={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
        variant="reverse-summary"
        reverseSummary={reverseSummary}
      />
    </>
  );
}

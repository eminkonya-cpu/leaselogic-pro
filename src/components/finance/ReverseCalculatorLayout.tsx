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
import SectionCard from "@/components/finance/ui/SectionCard";
import SectionClearAction from "@/components/finance/ui/SectionClearAction";
import { CATALOG_SECTION_ID } from "@/components/finance/ui/CatalogScrollRail";
import FinanceContextBar from "@/components/finance/ui/FinanceContextBar";
import CalcPageHeader from "@/components/finance/ui/CalcPageHeader";
import FinanceKpiStrip, {
  type FinanceKpiItem,
} from "@/components/finance/ui/FinanceKpiStrip";
import type { ReverseFinanceLeg } from "@/lib/reverseFinanceCalc";
import type { CatalogLine, CatalogSelection } from "@/lib/catalogPrices";
import { buildReverseStitchSummaryRows } from "@/lib/reverseSummaryReport";
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

  const reverseKpiItems = useMemo((): FinanceKpiItem[] => {
    const vadeFarki = leg.interestDiff;
    return [
      {
        label: "Net makine bedeli",
        value: netMachineDisplay,
        hint: "KDV hariç",
        currencySymbol: sym,
        accent: "navy",
      },
      {
        label: isAnnual ? "Yıllık taksit" : "Aylık taksit",
        value: installment,
        hint: "Seçilen para biriminde",
        currencySymbol: sym,
        accent: "blue",
        noDecimals: true,
      },
      {
        label: "Toplam ödeme",
        value: totalPrimary,
        hint: "Peşinat dahil",
        currencySymbol: sym,
        accent: "green",
        noDecimals: true,
      },
      {
        label: "Vade farkı",
        value: vadeFarki,
        hint: "Faiz maliyeti",
        currencySymbol: sym,
        accent: "purple",
        noDecimals: true,
      },
    ];
  }, [
    isAnnual,
    installment,
    sym,
    netMachineDisplay,
    totalPrimary,
    leg.interestDiff,
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

  const reverseSummaryContent = (
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
          totalEuro={netMachineDisplay}
          amountDecimals={2}
          stitchPrimaryTotalLabel={
            financingSupportCompare
              ? "Net makine bedeli (destekli)"
              : isTry
                ? "Net makine bedeli"
                : "Net makine bedeli (EUR)"
          }
          stitchCompare={financingSupportCompare ?? undefined}
        />
      </SectionCard>

      <PaymentSchedulePanel
        schedule={schedule}
        currencySymbol={sym}
        downPayment={downPayment}
        interestRatePct={planInterest}
        periodUnit={isAnnual ? "year" : "month"}
        defaultExpanded
        comfortable
        totalPayment={totalPrimary}
        amountDecimals={2}
      />
    </>
  );

  return (
    <div className="space-y-5 pb-5 max-lg:space-y-4 max-lg:pb-5">
      <CalcPageHeader
        kicker="Leasing · Geri hesaplama"
        title="Geri hesaplama"
        description="Toplam ödemeden net makine bedeline. Tutarlar KDV hariçtir."
        onSummary={props.handleOpenSummaryReport}
        onPaymentPlan={props.handlePrint}
        summaryActionAttr="open-summary"
      />
      {isAnnual ? (
        <p className="llp-pro-banner rounded-xl border border-[#c3c6d7] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#565e74] shadow-sm md:text-[15px]">
          Geri hesaplama · Yılda bir taksit · Vade en fazla 3 yıl · KDV hariç
        </p>
      ) : (
        <p className="llp-pro-banner rounded-xl border border-[#c3c6d7] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#565e74] shadow-sm md:text-[15px]">
          Geri hesaplama · Makine fiyatından net makine bedeline · KDV hariç
        </p>
      )}

      <FinanceContextBar
        paymentFrequency={props.paymentFrequency}
        onPaymentFrequencyChange={props.onPaymentFrequencyChange}
        pdfCurrency={props.pdfCurrency}
        setPdfCurrency={props.setPdfCurrency}
        euroRate={props.params.euroRate}
        onEuroRateChange={(value) => props.handleParamChange("euroRate", value)}
        onRefreshEuroRate={props.handleRefreshEuroRate}
      />

      <FinanceKpiStrip items={reverseKpiItems} heroFirst />

      <div className="finance-calc-stack finance-calc-stack--with-catalog">
        <div className="finance-calc-stack__main grid grid-cols-1 gap-4 max-lg:gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
        <div className="finance-mobile-tight flex flex-col gap-4 max-lg:gap-3 lg:col-span-5 lg:gap-4">
          <SectionCard
            title="Geri Hesaplama Parametreleri"
            description="KDV hariç tutarlar"
            variant="stitch"
            action={
              <SectionClearAction
                onClick={props.handleClearMachineFinance}
                label="Parametreleri temizle"
              />
            }
          >
            <FinanceFieldGrid
              layout="stack"
              machineTitle="Müşteri ve makine"
              financeTitle="Finansman"
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
                {
                  key: "financingSupportEuro",
                  label: "Finansman desteği (€)",
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
              comfortable
            />
          </SectionCard>

          <SectionCard
            title="Ek Masraflar"
            description="(Kasko, Leasing, İthalat)"
            variant="stitch"
            density="compact"
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
              inputClassName="h-8 border-[#c3c6d7] bg-white text-[13px] md:text-sm"
            />
          </SectionCard>
        </div>

        <div className="hidden lg:flex lg:col-span-7 lg:sticky lg:top-[4.75rem] flex-col gap-4">
          {reverseSummaryContent}
        </div>
        </div>

        <div
          id={CATALOG_SECTION_ID}
          className="finance-calc-stack__catalog scroll-mt-24"
        >
          <CatalogSelector
            appearance="clean"
            layout="page"
            density="comfortable"
            selection={props.catalogSelection}
            onToggle={props.handleCatalogToggle}
            onClearAll={props.handleCatalogClearAll}
          />
        </div>

        <div className="finance-calc-stack__summary flex flex-col gap-4 max-lg:gap-3 lg:hidden">
          {reverseSummaryContent}
        </div>
      </div>
    </div>
  );
}

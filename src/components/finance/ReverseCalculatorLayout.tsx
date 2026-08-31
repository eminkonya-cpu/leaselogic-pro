"use client";

import CatalogSelector from "@/components/finance/CatalogSelector";
import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import {
  PaymentFrequencySelector,
  type PaymentFrequency,
} from "@/components/finance/PaymentFrequencySelector";
import CostSummaryPanel, {
  CostDistributionChart,
} from "@/components/finance/ui/CostSummaryPanel";
import FinanceFieldGrid, {
  MACHINE_MODELS,
} from "@/components/finance/ui/FinanceFieldGrid";
import PaymentSchedulePanel from "@/components/finance/ui/PaymentSchedulePanel";
import SectionCard from "@/components/finance/ui/SectionCard";
import SectionClearAction from "@/components/finance/ui/SectionClearAction";
import { CATALOG_SECTION_ID } from "@/components/finance/ui/CatalogScrollRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReverseFinanceLeg } from "@/lib/reverseFinanceCalc";
import type { CatalogLine, CatalogSelection } from "@/lib/catalogPrices";
import {
  buildReverseDistributionSegments,
  buildReverseStitchSummaryRows,
} from "@/lib/reverseSummaryReport";
import { RefreshCw, RotateCcw, Printer, FileText } from "lucide-react";
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
    euroInterest: number;
    tlInterest: number;
    term: number | string;
  };
  calc: ReverseCalcSlice;
  expenses: Record<string, number>;
  catalogSelection: CatalogSelection;
  handleParamChange: (key: string, value: string | number) => void;
  handleExpenseChange: (key: string, value: number) => void;
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

  const summaryRows = useMemo(
    () =>
      buildReverseStitchSummaryRows({
        allInTotal,
        totalExpenses: leg.totalExpenses,
        interestDiff: leg.interestDiff,
        catalogLines: props.calc.catalogLines,
        catalogAmount,
        displayNetMachine: leg.displayNetMachine,
      }),
    [
      allInTotal,
      catalogAmount,
      leg.displayNetMachine,
      leg.interestDiff,
      leg.totalExpenses,
      props.calc.catalogLines,
    ],
  );

  const segments = useMemo(
    () =>
      buildReverseDistributionSegments({
        displayNetMachine: leg.displayNetMachine,
        totalExpenses: leg.totalExpenses,
        interestDiff: leg.interestDiff,
        catalogLines: props.calc.catalogLines,
        catalogAmount,
      }),
    [catalogAmount, leg, props.calc.catalogLines],
  );

  const netMachineDisplay = leg.displayNetMachine;

  const termField = isAnnual
    ? {
        key: "term",
        label: "Vade (Yıl) — en fazla 3",
        placeholder: "3",
      }
    : {
        key: "term",
        label: "Vade (Ay)",
        placeholder: "24",
      };

  const reverseSummaryContent = (
    <>
      <SectionCard
        title="Geri Hesaplama Özeti"
        variant="stitch"
        accentBar
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-[#c3c6d7] bg-white text-xs font-semibold text-[#004ac6] md:text-[13px]"
            onClick={props.handleOpenSummaryReport}
          >
            <FileText className="h-3.5 w-3.5" />
            Özet Rapor
          </Button>
        }
      >
        <CostSummaryPanel
          rows={summaryRows}
          currencySymbol={sym}
          layout="stitch"
          totalEuro={netMachineDisplay}
          monthlyInstallment={installment}
          amountDecimals={2}
          installmentLabel={
            isAnnual ? "Yıllık Taksit:" : "Aylık Taksit:"
          }
          stitchPrimaryTotalLabel={
            isTry ? "Net makine bedeli" : "Net makine bedeli (EUR)"
          }
        />
      </SectionCard>

      <SectionCard variant="stitch">
        <CostDistributionChart
          segments={segments}
          totalLabel="Makine fiyatı"
          totalValue={allInTotal}
          currencySymbol={sym}
          large
          amountDecimals={2}
        />
      </SectionCard>

      <PaymentSchedulePanel
        schedule={schedule}
        currencySymbol={sym}
        downPayment={downPayment}
        interestRatePct={planInterest}
        periodUnit={isAnnual ? "year" : "month"}
        defaultExpanded={false}
        comfortable
        totalPayment={totalPrimary}
        amountDecimals={2}
      />

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          className="h-11 gap-2 rounded-xl bg-[#004ac6] text-sm font-semibold hover:bg-[#2563eb] shadow-md max-lg:h-11 max-lg:text-sm"
          onClick={props.handlePrint}
        >
          <Printer className="h-5 w-5" />
          PDF Raporu Oluştur
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-xl border-[#c3c6d7] font-semibold text-sm max-lg:h-10 max-lg:text-sm"
          onClick={props.handleNewCalculation}
        >
          <RotateCcw className="h-4 w-4" />
          Yeni Hesaplama
        </Button>
      </div>
    </>
  );

  return (
    <div className="space-y-5 pb-5 max-lg:space-y-4 max-lg:pb-5">
      {isAnnual ? (
        <p className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#565e74] shadow-sm md:text-[15px]">
          Geri hesaplama · Yılda bir taksit · Vade en fazla 3 yıl · KDV hariç
        </p>
      ) : (
        <p className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#565e74] shadow-sm md:text-[15px]">
          Geri hesaplama · Makine fiyatından net makine bedeline · KDV hariç
        </p>
      )}

      <div className="finance-calc-stack finance-calc-stack--with-catalog">
        <div className="finance-calc-stack__main grid grid-cols-1 gap-4 max-lg:gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
        <div className="finance-mobile-tight flex flex-col gap-4 max-lg:gap-3 lg:col-span-8 lg:gap-4">
          <div className="grid grid-cols-1 gap-3 max-lg:gap-2.5 md:grid-cols-2">
            <PaymentFrequencySelector
              variant="card"
              density="compact"
              value={props.paymentFrequency}
              onChange={props.onPaymentFrequencyChange}
            />
            <SectionCard
              title="Para Birimi ve Kur"
              variant="stitch"
              density="compact"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex rounded-lg border border-[#c3c6d7] bg-[#eff4ff] p-0.5">
                  <button
                    type="button"
                    className={`rounded-md px-4 py-1.5 text-sm font-semibold shadow-sm ${
                      props.pdfCurrency === "EUR"
                        ? "bg-[#004ac6] text-white"
                        : "text-[#565e74]"
                    }`}
                    onClick={() => props.setPdfCurrency("EUR")}
                  >
                    EUR
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                      props.pdfCurrency === "TRY"
                        ? "bg-[#004ac6] text-white shadow-sm"
                        : "text-[#565e74]"
                    }`}
                    onClick={() => props.setPdfCurrency("TRY")}
                  >
                    TL
                  </button>
                </div>
                <div className="min-w-[8rem] flex-1 space-y-1">
                  <Label className="text-sm font-semibold text-[#434655] md:text-[15px]">
                    Kur (₺ / €)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 border-[#c3c6d7] bg-white text-[13px] md:text-sm"
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
                      className="h-8 w-8 shrink-0 border-[#c3c6d7]"
                      onClick={() => props.handleRefreshEuroRate()}
                      title="Referans kur"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

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
                  placeholder: "30000",
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
            <ExpenseInputCard
              expenses={props.expenses}
              onChange={props.handleExpenseChange}
              appearance="minimal"
              comfortable
              compact
              variant={isAnnual ? "annual" : "monthly"}
            />
          </SectionCard>
        </div>

        <div className="hidden lg:flex lg:col-span-4 lg:sticky lg:top-[4.75rem] flex-col gap-4">
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

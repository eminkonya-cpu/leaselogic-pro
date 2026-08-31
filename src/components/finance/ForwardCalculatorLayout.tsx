"use client";

import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import CatalogSelector from "@/components/finance/CatalogSelector";
import CurrencyComparisonReport from "@/components/finance/CurrencyComparisonReport";
import RateProjectionInput from "@/components/finance/RateProjectionInput";
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
import {
  getForwardDisplayMetrics,
  type CalcSlice,
  type ForwardTabId,
} from "@/lib/forwardDisplayMetrics";
import { RefreshCw, RotateCcw, Printer, FileText } from "lucide-react";
import { useMemo } from "react";
import {
  CatalogScrollRail,
  CATALOG_SECTION_ID,
} from "@/components/finance/ui/CatalogScrollRail";

export default function ForwardCalculatorLayout(props: {
  activeTab: ForwardTabId;
  setActiveTab: (tab: ForwardTabId) => void;
  pdfCurrency: "EUR" | "TRY";
  setPdfCurrency: (c: "EUR" | "TRY") => void;
  params: Record<string, unknown> & {
    euroRate: number;
    dollarRate: number;
    downPaymentEuro: number;
    euroInterest: number;
    tlInterest: number;
    machinePriceEuro: number;
    term: number | string;
    firma: string;
    makine: string;
  };
  calc: CalcSlice;
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

  /** Üst kalemler mal bedeli; Toplam = ileri hesaplama toplam ödemesi (faiz dahil, peşinat dahil). */
  const summaryRows = useMemo(() => {
    const rows: Parameters<typeof CostSummaryPanel>[0]["rows"] = [
      { label: "Makine bedeli", value: machine },
      { label: "Ataşman toplamı", value: attachment },
      { label: "Bakım paketi", value: maintenance },
      { label: "Donanım toplamı", value: equipment },
      { label: "Diğer giderler", value: catalogOther },
    ];
    if (display.includeExpenses) {
      rows.push({
        label: "Ek masraflar (Kasko, Leasing, İthalat)",
        value: otherExpenses,
      });
    }
    const finCost = Math.max(0, vadeFarki);
    if (finCost > 0) {
      rows.push({
        label: "Finansman maliyeti (vade farkı)",
        value: finCost,
      });
    }
    rows.push(
      { label: "Toplam", value: totalPrimary, tone: "subtotal" },
    );
    return rows;
  }, [
    machine,
    attachment,
    maintenance,
    equipment,
    catalogOther,
    display.includeExpenses,
    otherExpenses,
    vadeFarki,
    totalPrimary,
  ]);

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
    const fin = Math.max(0, vadeFarki);
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
    vadeFarki,
  ]);

  const tabOptions = [
    { value: "plain" as const, label: "Sade Makine" },
    { value: "allin" as const, label: "Her Şey Dahil" },
    { value: "campaign" as const, label: "Kampanyalı Fiyat" },
    { value: "advantage" as const, label: "Kur Avantajı" },
  ];

  const showStitchChrome = Boolean(props.onPaymentFrequencyChange);
  const isPlainTab = props.activeTab === "plain";
  const plainCatalogOnly = display.plainCatalogOnly ?? false;

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
          title="Hesaplama Özeti"
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
            totalEuro={totalPrimary}
            monthlyInstallment={
              plainCatalogOnly && isPlainTab ? undefined : monthly
            }
            installmentLabel={
              isAnnual ? "Yıllık Taksit:" : "Aylık Taksit:"
            }
            stitchPrimaryTotalLabel={
              plainCatalogOnly && isPlainTab
                ? "Toplam tutar"
                : isTry
                  ? "Toplam ödeme"
                  : "Toplam (EUR)"
            }
          />
        </SectionCard>

        <SectionCard variant="stitch">
          <CostDistributionChart
            segments={segments}
            totalLabel={
              plainCatalogOnly && isPlainTab ? "Toplam Tutar" : "Toplam Ödeme"
            }
            totalValue={totalPrimary}
            currencySymbol={sym}
            large
          />
        </SectionCard>

        {!(plainCatalogOnly && isPlainTab) ? (
          <PaymentSchedulePanel
            schedule={schedule}
            currencySymbol={sym}
            downPayment={downPayment}
            interestRatePct={interestRate}
            periodUnit={isAnnual ? "year" : "month"}
            defaultExpanded={false}
            comfortable={showStitchChrome}
            totalPayment={totalPrimary}
          />
        ) : null}

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
    ) : (
      <>
        <SectionCard
          title="Hesaplama Özeti"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-bold"
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
            "finance-mobile-tight flex flex-col lg:col-span-8",
            showStitchChrome ? "gap-4 max-lg:gap-3 lg:gap-4" : "gap-6 max-lg:gap-5",
          )}
        >
          {showStitchChrome ? (
            <div className="grid grid-cols-1 gap-3 max-lg:gap-2.5 md:grid-cols-2">
              <PaymentFrequencySelector
                variant="card"
                density="compact"
                value={paymentFrequency}
                onChange={props.onPaymentFrequencyChange!}
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
          ) : null}

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
              <p className="mt-3 rounded-lg border border-[#004ac6]/20 bg-[#eff4ff] px-3 py-2 text-sm text-[#434655] md:text-[15px]">
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
              machineTitle="Makine Bilgileri"
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
                  placeholder: "100000",
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
              <ExpenseInputCard
                expenses={props.expenses}
                onChange={props.handleExpenseChange}
                appearance="minimal"
                comfortable={showStitchChrome}
                compact={showStitchChrome}
                variant={isAnnual ? "annual" : "monthly"}
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

        <div className={cn("hidden lg:flex lg:col-span-4", summaryAsideClass)}>
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
            value={display.vadeFarkiEuro}
            hint="Faiz maliyeti"
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
          PDF Raporu Oluştur
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

"use client";

import { useMemo, useState } from "react";
import { Banknote, Euro, Package, Printer } from "lucide-react";
import ParameterCard from "@/components/finance/ParameterCard";
import ResultCard from "@/components/finance/ResultCard";
import AmortizationTable from "@/components/finance/AmortizationTable";
import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import RateProjectionInput from "@/components/finance/RateProjectionInput";
import CurrencyComparisonReport from "@/components/finance/CurrencyComparisonReport";
import PrintablePDF, { PrintablePDFPreviewModal } from "@/components/finance/PrintablePDF";
import { MACHINE_MODELS } from "@/components/finance/machineModels";
import {
  calculateAnnualPMT,
  expandAnnualScheduleToMonthlyPdfRows,
  generateAnnualAmortization,
} from "@/lib/financeCalculations";
import { usePersistentState } from "@/lib/usePersistentState";

function clampTermYears(v: string | number) {
  const raw =
    typeof v === "string"
      ? Number(String(v).replace(",", "."))
      : Number(v);
  const n = Math.trunc(Number.isFinite(raw) ? raw : 3);
  return Math.min(3, Math.max(1, n));
}

export default function AnnualForwardCalculator() {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = usePersistentState<
    "plain" | "allin" | "advantage"
  >(
    "llp:forward-shared:active-tab",
    "plain",
  );
  const [pdfCurrency, setPdfCurrency] = usePersistentState<"EUR" | "TRY">(
    "llp:forward-shared:pdf-currency",
    "EUR",
  );
  const [sharedParams, setSharedParams] = usePersistentState(
    "llp:forward-shared:params",
    {
    euroRate: 50.5,
    dollarRate: 43.5,
    firma: "Maats Makia A.Ş.",
    makine: "MT 1840-100",
    machinePriceEuro: 100_000,
    euroInterest: 6.5,
    tlInterest: 38,
    downPaymentEuro: 20000,
    },
  );
  const [term, setTerm] = usePersistentState("llp:forward:term-annual", "3");
  const [expenses, setExpenses] = usePersistentState(
    "llp:forward-shared:expenses",
    {
    kasko1: 1300,
    kasko2: 1300,
    kasko3: 0,
    leasingCost: 1700,
    importCost: 0,
    },
  );
  const [monthlyGrowthPct, setMonthlyGrowthPct] = usePersistentState(
    "llp:forward-shared:monthly-growth-pct",
    1.5,
  );

  const params = useMemo(() => ({ ...sharedParams, term }), [sharedParams, term]);

  const handleParamChange = (key: string, value: string | number) => {
    if (key === "term") {
      setTerm(String(value));
      return;
    }

    setSharedParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleExpenseChange = (key: string, value: number) =>
    setExpenses((prev) => ({ ...prev, [key]: value }));
  const resetRates = () => setMonthlyGrowthPct(1.5);

  const termYears = clampTermYears(params.term);
  const projectionMonths = termYears * 12;

  const computedRates = useMemo(() => {
    const rates: number[] = [];
    for (let i = 0; i < 36; i++) {
      rates.push(
        params.euroRate * Math.pow(1 + monthlyGrowthPct / 100, i + 1),
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
    const years = clampTermYears(term);
    const priceTL = machinePriceEuro * euroRate;
    const downPaymentTL = downPaymentEuro * euroRate;
    const plainFinanceEuro = machinePriceEuro - downPaymentEuro;
    const plainFinanceTL = priceTL - downPaymentTL;
    const plainAnnualEuro = calculateAnnualPMT(
      plainFinanceEuro,
      euroInterest,
      years,
    );
    const plainAnnualTL = calculateAnnualPMT(
      plainFinanceTL,
      tlInterest,
      years,
    );
    const plainTotalEuro = plainAnnualEuro * years + downPaymentEuro;
    const plainTotalTL = plainAnnualTL * years + downPaymentTL;
    const plainDiffEuro = plainTotalEuro - machinePriceEuro;
    const plainDiffTL = plainTotalTL - priceTL;
    const plainScheduleEuro = generateAnnualAmortization(
      plainFinanceEuro,
      euroInterest,
      years,
    );
    const plainScheduleTL = generateAnnualAmortization(
      plainFinanceTL,
      tlInterest,
      years,
    );
    const pdfScheduleEuro = expandAnnualScheduleToMonthlyPdfRows(
      plainScheduleEuro,
      years,
    );
    const pdfScheduleTL = expandAnnualScheduleToMonthlyPdfRows(
      plainScheduleTL,
      years,
    );
    const totalExpenses = Object.values(expenses).reduce(
      (s, v) => s + (v || 0),
      0,
    );
    const totalExpensesTL = totalExpenses * euroRate;
    const allInBaseEuro = machinePriceEuro + totalExpenses;
    const allInBaseTL = priceTL + totalExpensesTL;
    const allInFinanceEuro = Math.max(0, allInBaseEuro - downPaymentEuro);
    const allInFinanceTL = Math.max(0, allInBaseTL - downPaymentTL);
    const allInAnnualEuro = calculateAnnualPMT(
      allInFinanceEuro,
      euroInterest,
      years,
    );
    const allInAnnualTL = calculateAnnualPMT(
      allInFinanceTL,
      tlInterest,
      years,
    );
    const allInTotalEuro = allInAnnualEuro * years + downPaymentEuro;
    const allInTotalTL = allInAnnualTL * years + downPaymentTL;
    const allInDiffEuro = allInTotalEuro - allInBaseEuro;
    const allInDiffTL = allInTotalTL - allInBaseTL;
    const allInScheduleEuro = generateAnnualAmortization(
      allInFinanceEuro,
      euroInterest,
      years,
    );
    const allInScheduleTL = generateAnnualAmortization(
      allInFinanceTL,
      tlInterest,
      years,
    );
    const allInPdfScheduleEuro = expandAnnualScheduleToMonthlyPdfRows(
      allInScheduleEuro,
      years,
    );
    const allInPdfScheduleTL = expandAnnualScheduleToMonthlyPdfRows(
      allInScheduleTL,
      years,
    );
    const netMachineEuro = machinePriceEuro;
    const projRates = Array.from({ length: years }, (_, i) => {
      const monthIdx = (i + 1) * 12 - 1;
      return {
        month: i + 1,
        rate: computedRates[monthIdx] ?? params.euroRate,
      };
    });

    return {
      priceTL,
      downPaymentTL,
      plainFinanceEuro,
      plainFinanceTL,
      plainMonthlyEuro: plainAnnualEuro,
      plainMonthlyTL: plainAnnualTL,
      plainTotalEuro,
      plainTotalTL,
      plainDiffEuro,
      plainDiffTL,
      plainScheduleEuro,
      plainScheduleTL,
      pdfScheduleEuro,
      pdfScheduleTL,
      allInMonthlyEuro: allInAnnualEuro,
      allInMonthlyTL: allInAnnualTL,
      allInScheduleEuro,
      allInScheduleTL,
      allInPdfScheduleEuro,
      allInPdfScheduleTL,
      totalExpenses,
      totalExpensesTL,
      allInBaseEuro,
      allInBaseTL,
      allInTotalEuro,
      allInTotalTL,
      allInDiffEuro,
      allInDiffTL,
      netMachineEuro,
      projRates,
    };
  }, [params, expenses, computedRates]);

  const handlePrint = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobilePreviewOpen(true);
      return;
    }
    window.print();
  };

  const tabConfig = [
    {
      value: "plain" as const,
      label: "Sade Makine",
      activeClass: "bg-[#1f6fa7] text-white shadow-lg",
      inactiveClass: "bg-[#d9ecf7] text-[#114a72] hover:bg-[#c6e2f1]",
    },
    {
      value: "allin" as const,
      label: "Her Şey Dahil",
      activeClass: "bg-[#e28b1f] text-white shadow-lg",
      inactiveClass: "bg-[#fde8cb] text-[#985a0d] hover:bg-[#f9ddb1]",
    },
    {
      value: "advantage" as const,
      label: "Kur Avantajı",
      activeClass: "bg-[#1e8f54] text-white shadow-lg",
      inactiveClass: "bg-[#d4f2e2] text-[#0f5f36] hover:bg-[#bee8d1]",
    },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-white/70 bg-white/50 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur md:p-5">
      <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-center text-xs font-bold text-amber-950">
        Yılda bir taksit · Vade en fazla 3 yıl · Tüm tutarlar KDV hariçtir (KDV
        uygulanmaz).
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ParameterCard
          title="Döviz Kurları"
          icon={Euro}
          fields={[
            { key: "euroRate", label: "Euro Kur (₺)", placeholder: "50.5" },
            { key: "dollarRate", label: "Dolar Kur (₺)", placeholder: "43.5" },
          ]}
          values={params}
          onChange={handleParamChange}
        />
        <ParameterCard
          title="Makine Bilgileri"
          icon={Package}
          fields={[
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
              options: MACHINE_MODELS,
            },
            {
              key: "machinePriceEuro",
              label: "Makine Bedeli (€) KDV Hariç",
              placeholder: "100000",
            },
          ]}
          values={params}
          onChange={handleParamChange}
        />
        <ParameterCard
          title="Finansman Detayları"
          icon={Banknote}
          fields={[
            { key: "downPaymentEuro", label: "Peşinat (€)", placeholder: "20000" },
            {
              key: "term",
              label: "Vade (Yıl) — en fazla 3",
              placeholder: "3",
            },
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
          ]}
          values={params}
          onChange={handleParamChange}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid w-full max-w-3xl grid-cols-1 gap-1.5 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-md sm:grid-cols-3 sm:gap-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex w-full items-center justify-center rounded-xl px-2.5 py-2 text-center text-[12px] font-extrabold transition-all duration-200 sm:px-3 sm:py-2.5 sm:text-sm ${
                  activeTab === tab.value ? tab.activeClass : tab.inactiveClass
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {(activeTab === "plain" || activeTab === "allin") && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="rounded-xl border border-primary/20 bg-white/80 p-1 text-[11px] shadow-sm sm:text-xs">
                <button
                  type="button"
                  onClick={() => setPdfCurrency("EUR")}
                  className={`rounded-md px-1.5 py-1 font-bold sm:px-2 ${
                    pdfCurrency === "EUR"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  EURO
                </button>
                <button
                  type="button"
                  onClick={() => setPdfCurrency("TRY")}
                  className={`rounded-md px-1.5 py-1 font-bold sm:px-2 ${
                    pdfCurrency === "TRY"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  TL
                </button>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[12px] font-extrabold text-primary transition-colors hover:bg-primary/10 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
                title="PDF önizleme aç"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>PDF Önizle</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === "plain" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ResultCard
                title="€ Sade Makine - Euro Finansman"
                icon={Euro}
                currency="€"
                noDecimals
                rows={[
                  {
                    label: "Mal Bedeli (KDV Hariç)",
                    value: params.machinePriceEuro,
                  },
                  { label: "Peşinat", value: params.downPaymentEuro },
                  { label: "Yıllık € Taksit", value: calc.plainMonthlyEuro },
                  {
                    label: "Toplam € Ödeme",
                    value: calc.plainTotalEuro,
                    highlight: true,
                  },
                  { label: "Vade Farkı", value: calc.plainDiffEuro },
                  {
                    label: "(Fiyatlar KDV hariçtir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
              <ResultCard
                title="₺ Sade Makine - TL Finansman"
                icon={Banknote}
                currency="₺"
                rows={[
                  {
                    label: "Mal Bedeli (KDV Hariç)",
                    value: calc.priceTL,
                  },
                  { label: "Peşinat", value: calc.downPaymentTL },
                  { label: "Yıllık ₺ Taksit", value: calc.plainMonthlyTL },
                  {
                    label: "Toplam ₺ Ödeme",
                    value: calc.plainTotalTL,
                    highlight: true,
                  },
                  { label: "Vade Farkı", value: calc.plainDiffTL },
                  {
                    label: "(Fiyatlar KDV hariçtir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
            </div>
            <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2">
              <AmortizationTable
                schedule={calc.plainScheduleEuro}
                currency="€"
                downPayment={params.downPaymentEuro}
                interestRatePct={params.euroInterest}
                periodUnit="year"
              />
              <AmortizationTable
                schedule={calc.plainScheduleTL}
                currency="₺"
                downPayment={calc.downPaymentTL}
                interestRatePct={params.tlInterest}
                periodUnit="year"
              />
            </div>
          </div>
        )}

        {activeTab === "allin" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ExpenseInputCard
                variant="annual"
                expenses={expenses}
                onChange={handleExpenseChange}
                className="sm:[&_input]:h-8 sm:[&_input]:text-[12px] lg:[&_input]:h-10 lg:[&_input]:text-sm"
              />
              <ResultCard
                title="Toplam Maliyet (Euro)"
                icon={Euro}
                currency="€"
                noDecimals
                className="sm:[&_svg]:h-3.5 sm:[&_svg]:w-3.5 sm:[&_span]:max-w-[12rem] lg:[&_span]:max-w-[18rem]"
                rows={[
                  {
                    label: "Mal Bedeli (KDV Hariç)",
                    value: calc.netMachineEuro,
                  },
                  {
                    label: "Toplam Ek Masraflar",
                    value: calc.totalExpenses,
                  },
                  { label: "Finanse Edilen Toplam", value: calc.allInBaseEuro },
                  { label: "Faiz", value: calc.allInDiffEuro },
                  {
                    label: "Anahtar Teslim Toplam",
                    value: calc.allInTotalEuro,
                    highlight: true,
                  },
                  { label: "Yıllık € Taksit", value: calc.allInMonthlyEuro },
                  {
                    label: "(Fiyatlar KDV hariçtir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
              <ResultCard
                title="Toplam Maliyet (TL)"
                icon={Banknote}
                currency="₺"
                className="sm:[&_svg]:h-3.5 sm:[&_svg]:w-3.5 sm:[&_span]:max-w-[12rem] lg:[&_span]:max-w-[18rem]"
                rows={[
                  {
                    label: "Mal Bedeli (KDV Hariç)",
                    value: calc.netMachineEuro * params.euroRate,
                  },
                  {
                    label: "Toplam Ek Masraflar",
                    value: calc.totalExpensesTL,
                  },
                  { label: "Finanse Edilen Toplam", value: calc.allInBaseTL },
                  { label: "Faiz", value: calc.allInDiffTL },
                  {
                    label: "Anahtar Teslim Toplam",
                    value: calc.allInTotalTL,
                    highlight: true,
                  },
                  { label: "Yıllık ₺ Taksit", value: calc.allInMonthlyTL },
                  {
                    label: "(Fiyatlar KDV hariçtir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
            </div>
            <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2">
              <AmortizationTable
                schedule={calc.allInScheduleEuro}
                currency="€"
                downPayment={params.downPaymentEuro}
                interestRatePct={params.euroInterest}
                periodUnit="year"
              />
              <AmortizationTable
                schedule={calc.allInScheduleTL}
                currency="₺"
                downPayment={calc.downPaymentTL}
                interestRatePct={params.tlInterest}
                periodUnit="year"
              />
            </div>
          </div>
        )}

        {activeTab === "advantage" && (
          <div className="space-y-4">
            <RateProjectionInput
              baseRate={params.euroRate}
              monthlyGrowthPct={monthlyGrowthPct}
              onGrowthChange={setMonthlyGrowthPct}
              onReset={resetRates}
              months={projectionMonths}
              computedRates={computedRates}
            />
            <CurrencyComparisonReport
              scheduleEuro={calc.plainScheduleEuro}
              scheduleTL={calc.plainScheduleTL}
              projectedRates={calc.projRates}
              euroRate={params.euroRate}
              monthlyGrowthPct={monthlyGrowthPct}
              downPaymentEuro={params.downPaymentEuro}
              downPaymentTL={calc.downPaymentTL}
              term={termYears}
              paymentFrequency="annual"
            />
          </div>
        )}
      </div>

      <PrintablePDF
        params={{ ...params, term: termYears }}
        calc={{
          plainScheduleEuro:
            activeTab === "allin" ? calc.allInScheduleEuro : calc.plainScheduleEuro,
          plainScheduleTL:
            activeTab === "allin" ? calc.allInScheduleTL : calc.plainScheduleTL,
          plainMonthlyEuro:
            activeTab === "allin" ? calc.allInMonthlyEuro : calc.plainMonthlyEuro,
          plainMonthlyTL:
            activeTab === "allin" ? calc.allInMonthlyTL : calc.plainMonthlyTL,
          totalExpenses: calc.totalExpenses,
        }}
        mode={activeTab}
        expenses={expenses}
        printCurrency={pdfCurrency}
        paymentMode="annual"
        printScheduleEuro={
          activeTab === "allin" ? calc.allInPdfScheduleEuro : calc.pdfScheduleEuro
        }
        printScheduleTL={
          activeTab === "allin" ? calc.allInPdfScheduleTL : calc.pdfScheduleTL
        }
      />
      <PrintablePDFPreviewModal
        open={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        params={{ ...params, term: termYears }}
        calc={{
          plainScheduleEuro:
            activeTab === "allin" ? calc.allInScheduleEuro : calc.plainScheduleEuro,
          plainScheduleTL:
            activeTab === "allin" ? calc.allInScheduleTL : calc.plainScheduleTL,
          plainMonthlyEuro:
            activeTab === "allin" ? calc.allInMonthlyEuro : calc.plainMonthlyEuro,
          plainMonthlyTL:
            activeTab === "allin" ? calc.allInMonthlyTL : calc.plainMonthlyTL,
          totalExpenses: calc.totalExpenses,
        }}
        mode={activeTab}
        expenses={expenses}
        printCurrency={pdfCurrency}
        paymentMode="annual"
        printScheduleEuro={
          activeTab === "allin" ? calc.allInPdfScheduleEuro : calc.pdfScheduleEuro
        }
        printScheduleTL={
          activeTab === "allin" ? calc.allInPdfScheduleTL : calc.pdfScheduleTL
        }
      />
    </div>
  );
}

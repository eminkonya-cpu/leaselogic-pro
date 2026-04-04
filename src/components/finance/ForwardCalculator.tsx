"use client";

import { useMemo, useState } from "react";
import { Banknote, Check, Euro, Package, Printer } from "lucide-react";
import ParameterCard from "@/components/finance/ParameterCard";
import ResultCard from "@/components/finance/ResultCard";
import AmortizationTable from "@/components/finance/AmortizationTable";
import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import RateProjectionInput from "@/components/finance/RateProjectionInput";
import CurrencyComparisonReport from "@/components/finance/CurrencyComparisonReport";
import PrintablePDF, { PrintablePDFPreviewModal } from "@/components/finance/PrintablePDF";
import { MACHINE_MODELS } from "@/components/finance/machineModels";
import { calculatePMT, generateAmortization } from "@/lib/financeCalculations";
import { usePersistentState } from "@/lib/usePersistentState";

const FORWARD_STORAGE_PREFIX = "llp:v2:forward";

export default function ForwardCalculator() {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
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
    const priceTL = machinePriceEuro * euroRate;
    const downPaymentTL = downPaymentEuro * euroRate;
    const plainFinanceEuro = machinePriceEuro - downPaymentEuro;
    const plainFinanceTL = priceTL - downPaymentTL;
    const plainMonthlyEuro = calculatePMT(plainFinanceEuro, euroInterest, term);
    const plainMonthlyTL = calculatePMT(plainFinanceTL, tlInterest, term);
    const plainTotalEuro = plainMonthlyEuro * term + downPaymentEuro;
    const plainTotalTL = plainMonthlyTL * term + downPaymentTL;
    const plainDiffEuro = plainTotalEuro - machinePriceEuro;
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
    const allInBaseEuro = machinePriceEuro + totalExpenses;
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
  }, [params, expenses, computedRates]);

  const handlePrint = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobilePreviewOpen(true);
      return;
    }
    window.print();
  };

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

  const tabConfig = [
    {
      value: "campaign" as const,
      label: "Kampanyalı Fiyat",
      activeClass:
        "bg-[#8b5cf6] text-white shadow-[0_10px_24px_rgba(139,92,246,0.34)] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-100 border border-white/70 scale-[1.02]",
      inactiveClass: "bg-[#eee5ff] text-[#5d3cb3] hover:bg-[#e1d4ff]",
    },
    {
      value: "plain" as const,
      label: "Sade Makine",
      activeClass:
        "bg-[#1f6fa7] text-white shadow-[0_10px_24px_rgba(31,111,167,0.32)] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-100 border border-white/70 scale-[1.02]",
      inactiveClass: "bg-[#d9ecf7] text-[#114a72] hover:bg-[#c6e2f1]",
    },
    {
      value: "allin" as const,
      label: "Her Şey Dahil",
      activeClass:
        "bg-[#e28b1f] text-white shadow-[0_10px_24px_rgba(226,139,31,0.34)] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-100 border border-white/70 scale-[1.02]",
      inactiveClass: "bg-[#fde8cb] text-[#985a0d] hover:bg-[#f9ddb1]",
    },
    {
      value: "advantage" as const,
      label: "Kur Avantajı",
      activeClass:
        "bg-[#1e8f54] text-white shadow-[0_10px_24px_rgba(30,143,84,0.34)] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-100 border border-white/70 scale-[1.02]",
      inactiveClass: "bg-[#d4f2e2] text-[#0f5f36] hover:bg-[#bee8d1]",
    },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-white/70 bg-white/50 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur md:p-5">
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
              label: machinePriceLabel,
              placeholder: "100000",
            },
          ]}
          values={params}
          onChange={handleParamChange}
        />
        <ParameterCard
          title={financeCardTitle}
          icon={Banknote}
          fields={financeFields}
          values={params}
          onChange={handleParamChange}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-between">
          <div className="grid w-full flex-1 grid-cols-2 gap-1.5 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-md sm:grid-cols-4 sm:gap-1.5 lg:max-w-[880px]">
            {tabConfig.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                aria-pressed={activeTab === tab.value}
                className={`flex min-h-10 w-full items-center justify-center rounded-xl px-2 py-1.5 text-center text-[11px] font-extrabold leading-tight transition-all duration-200 sm:min-h-11 sm:px-2.5 sm:py-2 sm:text-[12px] lg:min-h-10 lg:px-2.5 lg:py-2 lg:text-[13px] ${
                  activeTab === tab.value ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                      activeTab === tab.value
                        ? "h-5 w-5 border-white/95 bg-white text-slate-900 shadow-md"
                        : "border-current/25 bg-white/35 text-transparent"
                    }`}
                  >
                    {activeTab === tab.value ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current/40" />
                    )}
                  </span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
          {(activeTab === "plain" || activeTab === "allin" || activeTab === "campaign") && (
            <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:w-auto">
              <div className="rounded-xl border border-primary/20 bg-white/80 p-1 text-[10px] shadow-sm sm:text-[11px]">
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
                className="flex items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px] font-extrabold text-primary transition-colors hover:bg-primary/10 sm:gap-2 sm:px-2.5 sm:py-2 sm:text-[12px] lg:text-[13px]"
                title="PDF önizleme aç"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>PDF Önizle</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === "campaign" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.74fr_1.13fr_1.13fr]">
              <ExpenseInputCard
                expenses={expenses}
                onChange={handleExpenseChange}
                className="sm:[&_input]:h-8 sm:[&_input]:text-[11px] lg:[&_input]:h-10 lg:[&_input]:text-sm"
              />
              <ResultCard
                title="Toplam Müşteri Ödemesi (Euro)"
                icon={Euro}
                currency="€"
                noDecimals
                tabletCompact
                rows={[
                  {
                    label: "Kampanyalı Makina Bedeli",
                    value: calc.netMachineEuro,
                  },
                  {
                    label: "Seçilen Ek Masraflar",
                    value: calc.totalExpenses,
                  },
                  {
                    label: "Toplam Müşteri Ödemesi",
                    value: calc.allInBaseEuro,
                    highlight: true,
                  },
                  { label: "Peşinat", value: params.downPaymentEuro },
                  {
                    label: "Peşinat Sonrası Kalan",
                    value: calc.campaignRemainingEuro,
                  },
                  { label: "Aylık € Taksit", value: calc.campaignMonthlyEuro },
                  {
                    label: "(Kampanya fiyatına finansman maliyeti dahildir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
              <ResultCard
                title="Toplam Müşteri Ödemesi (TL)"
                icon={Banknote}
                currency="₺"
                tabletCompact
                rows={[
                  {
                    label: "Kampanyalı Makina Bedeli",
                    value: calc.netMachineEuro * params.euroRate,
                  },
                  {
                    label: "Seçilen Ek Masraflar",
                    value: calc.totalExpensesTL,
                  },
                  {
                    label: "Toplam Müşteri Ödemesi",
                    value: calc.allInBaseTL,
                    highlight: true,
                  },
                  { label: "Peşinat", value: calc.downPaymentTL },
                  {
                    label: "Peşinat Sonrası Kalan",
                    value: calc.campaignRemainingTL,
                  },
                  {
                    label: "Aylık ₺ Taksit",
                    value: calc.campaignMonthlyTL,
                  },
                  {
                    label: "(Kampanya fiyatına finansman maliyeti dahildir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
            </div>
            <div className="hidden xl:grid xl:grid-cols-2 xl:gap-4">
              <AmortizationTable
                schedule={calc.campaignScheduleEuro}
                currency="€"
                downPayment={params.downPaymentEuro}
                interestRatePct={0}
              />
              <AmortizationTable
                schedule={calc.campaignScheduleTL}
                currency="₺"
                downPayment={calc.downPaymentTL}
                interestRatePct={0}
              />
            </div>
          </div>
        )}

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
                  { label: "Aylık € Taksit", value: calc.plainMonthlyEuro },
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
                  { label: "Aylık ₺ Taksit", value: calc.plainMonthlyTL },
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
            <div className="hidden xl:grid xl:grid-cols-2 xl:gap-4">
              <AmortizationTable
                schedule={calc.plainScheduleEuro}
                currency="€"
                downPayment={params.downPaymentEuro}
                interestRatePct={params.euroInterest}
              />
              <AmortizationTable
                schedule={calc.plainScheduleTL}
                currency="₺"
                downPayment={calc.downPaymentTL}
                interestRatePct={params.tlInterest}
              />
            </div>
          </div>
        )}

        {activeTab === "allin" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.74fr_1.13fr_1.13fr]">
              <ExpenseInputCard
                expenses={expenses}
                onChange={handleExpenseChange}
                className="sm:[&_input]:h-8 sm:[&_input]:text-[11px] lg:[&_input]:h-10 lg:[&_input]:text-sm"
              />
              <ResultCard
                title="Toplam Maliyet (Euro)"
                icon={Euro}
                currency="€"
                noDecimals
                tabletCompact
                rows={[
                  {
                    label: "Makina Bedeli (KDV Hariç)",
                    value: calc.netMachineEuro,
                  },
                  {
                    label: "Seçilen Ek Masraflar",
                    value: calc.totalExpenses,
                  },
                  { label: "Finanse Edilen Toplam", value: calc.allInFinanceEuro },
                  { label: "Faiz", value: calc.allInDiffEuro },
                  {
                    label: "Anahtar Teslim Toplam",
                    value: calc.allInTotalEuro,
                    highlight: true,
                  },
                  { label: "Aylık € Taksit", value: calc.allInMonthlyEuro },
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
                tabletCompact
                rows={[
                  {
                    label: "Makina Bedeli (KDV Hariç)",
                    value: calc.netMachineEuro * params.euroRate,
                  },
                  {
                    label: "Seçilen Ek Masraflar",
                    value: calc.totalExpensesTL,
                  },
                  { label: "Finanse Edilen Toplam", value: calc.allInFinanceTL },
                  { label: "Faiz", value: calc.allInDiffTL },
                  {
                    label: "Anahtar Teslim Toplam",
                    value: calc.allInTotalTL,
                    highlight: true,
                  },
                  {
                    label: "Aylık ₺ Taksit",
                    value: calc.allInMonthlyTL,
                  },
                  {
                    label: "(Fiyatlar KDV hariçtir)",
                    value: null,
                    note: true,
                  },
                ]}
              />
            </div>
            <div className="hidden xl:grid xl:grid-cols-2 xl:gap-4">
              <AmortizationTable
                schedule={calc.allInScheduleEuro}
                currency="€"
                downPayment={params.downPaymentEuro}
                interestRatePct={params.euroInterest}
              />
              <AmortizationTable
                schedule={calc.allInScheduleTL}
                currency="₺"
                downPayment={calc.downPaymentTL}
                interestRatePct={params.tlInterest}
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
              months={params.term}
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
              term={params.term}
            />
          </div>
        )}
      </div>

      <PrintablePDF
        params={printParams}
        calc={printCalc}
        mode={printMode}
        expenses={expenses}
        printCurrency={pdfCurrency}
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
    </div>
  );
}

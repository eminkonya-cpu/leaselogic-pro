"use client";

import { useMemo } from "react";
import { Euro } from "lucide-react";
import ParameterCard from "@/components/finance/ParameterCard";
import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import ResultCard from "@/components/finance/ResultCard";
import {
  calculateAnnualPMT,
  generateAnnualAmortization,
} from "@/lib/financeCalculations";
import AmortizationTable from "@/components/finance/AmortizationTable";
import { usePersistentState } from "@/lib/usePersistentState";

const REVERSE_STORAGE_PREFIX = "llp:v2:reverse";

function totalPaymentEuroAnnual(
  grossBaseEuro: number,
  downPaymentEuro: number,
  annualRatePct: number,
  termYears: number,
) {
  if (termYears <= 0) {
    return Math.max(0, grossBaseEuro);
  }

  const financed = Math.max(0, grossBaseEuro - downPaymentEuro);
  const pmt = calculateAnnualPMT(financed, annualRatePct, termYears);
  return pmt * termYears + downPaymentEuro;
}

function solveNetMachineFromAllInTotalAnnual(args: {
  allInTotalEuro: number;
  downPaymentEuro: number;
  annualRatePct: number;
  termYears: number;
  totalExpensesEuro: number;
}) {
  const targetTotal = Math.max(0, args.allInTotalEuro);
  let lo = Math.max(0, args.downPaymentEuro);
  let hi = Math.max(lo + 1, args.allInTotalEuro);
  for (
    let i = 0;
    i < 40 &&
    totalPaymentEuroAnnual(
      hi + args.totalExpensesEuro,
      args.downPaymentEuro,
      args.annualRatePct,
      args.termYears,
    ) < targetTotal;
    i++
  ) {
    hi *= 2;
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const total = totalPaymentEuroAnnual(
      mid + args.totalExpensesEuro,
      args.downPaymentEuro,
      args.annualRatePct,
      args.termYears,
    );
    if (total > targetTotal) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

function clampTermYears(v: string | number) {
  const raw =
    typeof v === "string"
      ? Number(String(v).replace(",", "."))
      : Number(v);
  const n = Math.trunc(Number.isFinite(raw) ? raw : 0);
  return Math.min(3, Math.max(0, n));
}

export default function AnnualReverseCalculator() {
  const [sharedParams, setSharedParams] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:shared:params`,
    {
    allInTotalEuro: 100_000,
    euroRate: 50.5,
    downPaymentEuro: 0,
    euroInterest: 6.5,
    },
  );
  const [term, setTerm] = usePersistentState(`${REVERSE_STORAGE_PREFIX}:term-annual`, "0");
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

  const params = useMemo(() => ({ ...sharedParams, term }), [sharedParams, term]);

  const handleParamChange = (key: string, value: string | number) =>
    {
      if (key === "term") {
        setTerm(String(value));
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

  const calc = useMemo(() => {
    const totalExpensesEuro = Object.values(expenses).reduce(
      (s, v) => s + (v || 0),
      0,
    );
    const termYears = clampTermYears(params.term);
    const netMachineEuro = solveNetMachineFromAllInTotalAnnual({
      allInTotalEuro: params.allInTotalEuro,
      downPaymentEuro: params.downPaymentEuro,
      annualRatePct: params.euroInterest,
      termYears,
      totalExpensesEuro,
    });
    const grossBaseEuro = netMachineEuro + totalExpensesEuro;
    const financed = Math.max(0, grossBaseEuro - params.downPaymentEuro);
    const annual = calculateAnnualPMT(
      financed,
      params.euroInterest,
      termYears,
    );
    const total =
      termYears > 0
        ? annual * termYears + params.downPaymentEuro
        : grossBaseEuro;
    const interestDiff = termYears > 0 ? total - grossBaseEuro : 0;
    const schedule =
      termYears > 0
        ? generateAnnualAmortization(
            financed,
            params.euroInterest,
            termYears,
          )
        : [];
    return {
      totalExpensesEuro,
      netMachineEuro,
      grossBaseEuro,
      annual,
      interestDiff,
      total,
      schedule,
    };
  }, [params, expenses]);

  return (
    <div className="space-y-6 rounded-2xl border border-white/70 bg-white/50 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur md:p-5">
      <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-center text-xs font-bold text-amber-950">
        Yılda bir taksit · Geri hesaplama · Vade en fazla 3 yıl · KDV hariç.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ParameterCard
          title="Ana Parametreler"
          icon={Euro}
          fields={[
            {
              key: "allInTotalEuro",
              label: "Anahtar Teslim Fiyat (€)",
              placeholder: "100000",
            },
            { key: "euroRate", label: "Euro Kur (₺)", placeholder: "50.5" },
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
          ]}
          values={params}
          onChange={handleParamChange}
        />
        <ExpenseInputCard
          variant="annual"
          expenses={expenses}
          onChange={handleExpenseChange}
        />
        <ResultCard
          title="Net Makine Bedeli (Euro)"
          icon={Euro}
          currency="€"
          noDecimals
          rows={[
            {
              label: "Anahtar Teslim Fiyat",
              value: params.allInTotalEuro,
              highlight: true,
            },
            {
              label: "- Seçilen Ek Masraflar",
              value: -calc.totalExpensesEuro,
            },
            { label: "- Vade Farkı", value: -calc.interestDiff },
            {
              label: "Net Makine Bedeli (KDV Hariç)",
              value: calc.netMachineEuro,
              highlight: true,
            },
            {
              label: "(Fiyatlar KDV hariçtir)",
              value: null,
              note: true,
            },
          ]}
        />
      </div>
      <div className="hidden xl:block">
        <AmortizationTable
          schedule={calc.schedule}
          currency="€"
          downPayment={params.downPaymentEuro}
          interestRatePct={params.euroInterest}
          periodUnit="year"
        />
      </div>
    </div>
  );
}

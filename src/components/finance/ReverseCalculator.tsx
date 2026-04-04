"use client";

import { useMemo } from "react";
import { Euro } from "lucide-react";
import ParameterCard from "@/components/finance/ParameterCard";
import ExpenseInputCard from "@/components/finance/ExpenseInputCard";
import ResultCard from "@/components/finance/ResultCard";
import { calculatePMT, generateAmortization } from "@/lib/financeCalculations";
import AmortizationTable from "@/components/finance/AmortizationTable";
import { usePersistentState } from "@/lib/usePersistentState";

const REVERSE_STORAGE_PREFIX = "llp:v2:reverse";

function totalPaymentEuro(
  grossBaseEuro: number,
  downPaymentEuro: number,
  annualRatePct: number,
  term: number,
) {
  if (term <= 0) {
    return Math.max(0, grossBaseEuro);
  }

  const financed = Math.max(0, grossBaseEuro - downPaymentEuro);
  const pmt = calculatePMT(financed, annualRatePct, term);
  return pmt * term + downPaymentEuro;
}

function solveNetMachineFromAllInTotal(args: {
  allInTotalEuro: number;
  downPaymentEuro: number;
  annualRatePct: number;
  term: number;
  totalExpensesEuro: number;
}) {
  const targetTotal = Math.max(0, args.allInTotalEuro);
  let lo = Math.max(0, args.downPaymentEuro);
  let hi = Math.max(lo + 1, args.allInTotalEuro);
  for (
    let i = 0;
    i < 40 &&
    totalPaymentEuro(
      hi + args.totalExpensesEuro,
      args.downPaymentEuro,
      args.annualRatePct,
      args.term,
    ) < targetTotal;
    i++
  ) {
    hi *= 2;
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const total = totalPaymentEuro(
      mid + args.totalExpensesEuro,
      args.downPaymentEuro,
      args.annualRatePct,
      args.term,
    );
    if (total > targetTotal) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export default function ReverseCalculator() {
  const [sharedParams, setSharedParams] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:shared:params`,
    {
    allInTotalEuro: 100_000,
    euroRate: 50.5,
    downPaymentEuro: 0,
    euroInterest: 6.5,
    },
  );
  const [term, setTerm] = usePersistentState(`${REVERSE_STORAGE_PREFIX}:term-monthly`, 0);
  const [expenses, setExpenses] = usePersistentState(
    `${REVERSE_STORAGE_PREFIX}:shared:expenses`,
    {
    kasko1: 0,
    kasko2: 0,
    kasko3: 0,
    kasko4: 0,
    leasingCost: 0,
    importCost: 0,
    },
  );

  const params = useMemo(() => ({ ...sharedParams, term }), [sharedParams, term]);

  const handleParamChange = (key: string, value: string | number) => {
    if (key === "term") {
      setTerm(Number(value));
      return;
    }

    setSharedParams((prev) => {
      const n =
        typeof value === "string"
          ? Number(String(value).replace(",", "."))
          : Number(value);
      return { ...prev, [key]: Number.isFinite(n) ? n : 0 };
    });
  };
  const handleExpenseChange = (key: string, value: number) =>
    setExpenses((prev) => ({ ...prev, [key]: value }));

  const calc = useMemo(() => {
    const totalExpensesEuro = Object.values(expenses).reduce(
      (s, v) => s + (v || 0),
      0,
    );
    const netMachineEuro = solveNetMachineFromAllInTotal({
      allInTotalEuro: params.allInTotalEuro,
      downPaymentEuro: params.downPaymentEuro,
      annualRatePct: params.euroInterest,
      term: params.term,
      totalExpensesEuro,
    });
    const grossBaseEuro = netMachineEuro + totalExpensesEuro;
    const financed = Math.max(0, grossBaseEuro - params.downPaymentEuro);
    const monthly = calculatePMT(financed, params.euroInterest, params.term);
    const total =
      params.term > 0
        ? monthly * params.term + params.downPaymentEuro
        : grossBaseEuro;
    const interestDiff = params.term > 0 ? total - grossBaseEuro : 0;
    const schedule =
      params.term > 0
        ? generateAmortization(
            financed,
            params.euroInterest,
            params.term,
          )
        : [];
    return {
      totalExpensesEuro,
      netMachineEuro,
      grossBaseEuro,
      monthly,
      interestDiff,
      total,
      schedule,
    };
  }, [params, expenses]);

  return (
    <div className="space-y-6 rounded-2xl border border-white/70 bg-white/50 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur md:p-5">
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
            { key: "term", label: "Vade (Ay)", placeholder: "24" },
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
        <ExpenseInputCard expenses={expenses} onChange={handleExpenseChange} />
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
      <div className="hidden sm:block">
        <AmortizationTable
          schedule={calc.schedule}
          currency="€"
          downPayment={params.downPaymentEuro}
          interestRatePct={params.euroInterest}
        />
      </div>
    </div>
  );
}

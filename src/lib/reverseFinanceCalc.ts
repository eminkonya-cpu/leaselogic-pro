import {
  calculateAnnualPMT,
  calculatePMT,
  generateAmortization,
  generateAnnualAmortization,
  type AmortizationRow,
} from "@/lib/financeCalculations";

function totalPayment(
  grossBase: number,
  downPayment: number,
  annualRatePct: number,
  term: number,
  paymentMode: "monthly" | "annual",
) {
  if (term <= 0) {
    return Math.max(0, grossBase);
  }
  const financed = Math.max(0, grossBase - downPayment);
  const pmt =
    paymentMode === "annual"
      ? calculateAnnualPMT(financed, annualRatePct, term)
      : calculatePMT(financed, annualRatePct, term);
  return pmt * term + downPayment;
}

export function solveNetMachineFromAllInTotal(args: {
  allInTotal: number;
  downPayment: number;
  annualRatePct: number;
  term: number;
  totalExpenses: number;
  paymentMode: "monthly" | "annual";
}) {
  const targetTotal = Math.max(0, args.allInTotal);
  let lo = Math.max(0, args.downPayment);
  let hi = Math.max(lo + 1, args.allInTotal);
  for (
    let i = 0;
    i < 40 &&
    totalPayment(
      hi + args.totalExpenses,
      args.downPayment,
      args.annualRatePct,
      args.term,
      args.paymentMode,
    ) < targetTotal;
    i++
  ) {
    hi *= 2;
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const total = totalPayment(
      mid + args.totalExpenses,
      args.downPayment,
      args.annualRatePct,
      args.term,
      args.paymentMode,
    );
    if (total > targetTotal) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export type ReverseFinanceLeg = {
  netMachine: number;
  displayNetMachine: number;
  grossBase: number;
  financed: number;
  installment: number;
  total: number;
  interestDiff: number;
  schedule: AmortizationRow[];
  totalExpenses: number;
};

export function computeReverseFinanceLeg(args: {
  allInTotal: number;
  downPayment: number;
  annualRatePct: number;
  term: number;
  totalExpenses: number;
  catalogTotal: number;
  paymentMode: "monthly" | "annual";
}): ReverseFinanceLeg {
  const netMachine = solveNetMachineFromAllInTotal({
    allInTotal: args.allInTotal,
    downPayment: args.downPayment,
    annualRatePct: args.annualRatePct,
    term: args.term,
    totalExpenses: args.totalExpenses,
    paymentMode: args.paymentMode,
  });
  const grossBase = netMachine + args.totalExpenses;
  const financed = Math.max(0, grossBase - args.downPayment);
  const installment =
    args.term > 0
      ? args.paymentMode === "annual"
        ? calculateAnnualPMT(financed, args.annualRatePct, args.term)
        : calculatePMT(financed, args.annualRatePct, args.term)
      : 0;
  const total =
    args.term > 0
      ? installment * args.term + args.downPayment
      : grossBase;
  const interestDiff = args.term > 0 ? total - grossBase : 0;
  const schedule =
    args.term > 0
      ? args.paymentMode === "annual"
        ? generateAnnualAmortization(financed, args.annualRatePct, args.term)
        : generateAmortization(financed, args.annualRatePct, args.term)
      : [];
  const displayNetMachine = Math.max(0, netMachine - args.catalogTotal);

  return {
    netMachine,
    displayNetMachine,
    grossBase,
    financed,
    installment,
    total,
    interestDiff,
    schedule,
    totalExpenses: args.totalExpenses,
  };
}

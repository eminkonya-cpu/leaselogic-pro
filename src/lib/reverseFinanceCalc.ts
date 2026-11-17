import {
  calculateAnnualPMT,
  calculatePMT,
  generateAmortization,
  generateAnnualAmortization,
  type AmortizationRow,
} from "@/lib/financeCalculations";

export const DEFAULT_REVERSE_EURO_INTEREST = 6.5;
export const DEFAULT_REVERSE_TL_INTEREST = 42;

/** Boş / 0 faiz kutusunda yer tutucu 6,5 gibi durmasın diye gerçek orana düşer. */
export function resolveReverseInterestPct(
  raw: unknown,
  fallback: number,
): number {
  const n = parseReverseInterestPct(raw);
  return n > 0 ? n : fallback;
}

/** Kutuya yazılan faiz; boş veya 0 ise finansman yok (6,5’e zorlanmaz). */
export function parseReverseInterestPct(raw: unknown): number {
  const n =
    typeof raw === "string"
      ? Number(String(raw).trim().replace(",", "."))
      : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function reverseFinanceEnabled(
  term: number,
  annualRatePct: number,
): boolean {
  return term > 0 && annualRatePct > 0;
}

function totalPayment(
  grossBase: number,
  downPayment: number,
  financingSupport: number,
  annualRatePct: number,
  term: number,
  paymentMode: "monthly" | "annual",
) {
  if (!reverseFinanceEnabled(term, annualRatePct)) {
    return Math.max(0, grossBase);
  }
  const financed = Math.max(0, grossBase - downPayment - financingSupport);
  const pmt =
    paymentMode === "annual"
      ? calculateAnnualPMT(financed, annualRatePct, term)
      : calculatePMT(financed, annualRatePct, term);
  return pmt * term + downPayment;
}

export function solveNetMachineFromAllInTotal(args: {
  allInTotal: number;
  downPayment: number;
  financingSupport?: number;
  annualRatePct: number;
  term: number;
  totalExpenses: number;
  paymentMode: "monthly" | "annual";
}) {
  const support = Math.max(0, args.financingSupport ?? 0);
  const targetTotal = Math.max(0, args.allInTotal);
  let lo = Math.max(0, args.downPayment + support);
  let hi = Math.max(lo + 1, args.allInTotal);
  for (
    let i = 0;
    i < 40 &&
    totalPayment(
      hi + args.totalExpenses,
      args.downPayment,
      support,
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
      support,
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
  financingSupport?: number;
  annualRatePct: number;
  term: number;
  totalExpenses: number;
  catalogTotal: number;
  paymentMode: "monthly" | "annual";
}): ReverseFinanceLeg {
  const support = Math.max(0, args.financingSupport ?? 0);
  const financeOn = reverseFinanceEnabled(args.term, args.annualRatePct);
  const netMachine = solveNetMachineFromAllInTotal({
    allInTotal: args.allInTotal,
    downPayment: args.downPayment,
    financingSupport: support,
    annualRatePct: args.annualRatePct,
    term: args.term,
    totalExpenses: args.totalExpenses,
    paymentMode: args.paymentMode,
  });
  const grossBase = netMachine + args.totalExpenses;
  const financed = Math.max(0, grossBase - args.downPayment - support);
  const installment = financeOn
    ? args.paymentMode === "annual"
      ? calculateAnnualPMT(financed, args.annualRatePct, args.term)
      : calculatePMT(financed, args.annualRatePct, args.term)
    : 0;
  const total = financeOn
    ? installment * args.term + args.downPayment
    : grossBase;
  const interestDiff = financeOn ? total - grossBase : 0;
  const schedule = financeOn
    ? args.paymentMode === "annual"
      ? generateAnnualAmortization(financed, args.annualRatePct, args.term)
      : generateAmortization(financed, args.annualRatePct, args.term)
    : [];
  /** Faiz veya vade yoksa finansman yok; ataşman düşer, katkı/finansman desteği neti yükseltir. */
  const displayNetMachine = Math.max(
    0,
    netMachine - args.catalogTotal + (financeOn ? 0 : support),
  );

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

export function computeReverseBothLegs(
  params: {
    allInTotalEuro: number;
    downPaymentEuro: number;
    financingSupportEuro?: number;
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
  const support = Math.max(0, params.financingSupportEuro ?? 0);
  const legArgs = {
    downPayment: params.downPaymentEuro,
    financingSupport: support,
    annualRatePct: params.euroInterest,
    term: params.term,
    totalExpenses: totalExpensesEuro,
    catalogTotal: catalogTotalEuro,
    paymentMode,
  };
  return {
    euro: computeReverseFinanceLeg({
      allInTotal: params.allInTotalEuro,
      ...legArgs,
      annualRatePct: params.euroInterest,
    }),
    tl: computeReverseFinanceLeg({
      allInTotal: params.allInTotalEuro * rate,
      downPayment: params.downPaymentEuro * rate,
      financingSupport: support * rate,
      annualRatePct: params.tlInterest,
      term: params.term,
      totalExpenses: totalExpensesEuro * rate,
      catalogTotal: catalogTotalEuro * rate,
      paymentMode,
    }),
  };
}

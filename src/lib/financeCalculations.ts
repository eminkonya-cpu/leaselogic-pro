export type AmortizationRow = {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

function toMonthlyRate(annualRatePct: number) {
  return (annualRatePct ?? 0) / 100 / 12;
}

export function calculatePMT(
  principal: number,
  annualRatePct: number,
  termMonths: number,
) {
  const pv = Number(principal) || 0;
  const n = Math.max(0, Math.trunc(Number(termMonths) || 0));
  const r = toMonthlyRate(Number(annualRatePct) || 0);
  if (n === 0) return 0;
  if (r === 0) return pv / n;
  return (r * pv) / (1 - Math.pow(1 + r, -n));
}

export function generateAmortization(
  principal: number,
  annualRatePct: number,
  termMonths: number,
) {
  const pv = Number(principal) || 0;
  const n = Math.max(0, Math.trunc(Number(termMonths) || 0));
  const r = toMonthlyRate(Number(annualRatePct) || 0);
  const payment = calculatePMT(pv, annualRatePct, n);
  const rows: AmortizationRow[] = [];
  let balance = pv;
  for (let month = 1; month <= n; month++) {
    const interest = r === 0 ? 0 : balance * r;
    let principalPaid = payment - interest;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    rows.push({
      month,
      payment,
      interest,
      principal: principalPaid,
      balance,
    });
  }
  return rows;
}

function toAnnualRate(annualRatePct: number) {
  return (Number(annualRatePct) || 0) / 100;
}

/** Yılda bir taksit: dönem sayısı = yıl, faiz yıllık bileşik. */
export function calculateAnnualPMT(
  principal: number,
  annualRatePct: number,
  termYears: number,
) {
  const pv = Number(principal) || 0;
  const n = Math.max(0, Math.trunc(Number(termYears) || 0));
  const r = toAnnualRate(annualRatePct);
  if (n === 0) return 0;
  if (r === 0) return pv / n;
  return (r * pv) / (1 - Math.pow(1 + r, -n));
}

export function generateAnnualAmortization(
  principal: number,
  annualRatePct: number,
  termYears: number,
) {
  const pv = Number(principal) || 0;
  const n = Math.max(0, Math.trunc(Number(termYears) || 0));
  const r = toAnnualRate(annualRatePct);
  const payment = calculateAnnualPMT(pv, annualRatePct, n);
  const rows: AmortizationRow[] = [];
  let balance = pv;
  for (let year = 1; year <= n; year++) {
    const interest = r === 0 ? 0 : balance * r;
    let principalPaid = payment - interest;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    rows.push({
      month: year,
      payment,
      interest,
      principal: principalPaid,
      balance,
    });
  }
  return rows;
}

/**
 * PDF: aylık satır yapısı; taksit/faiz/anapara 0, sadece yıl sonu aylarında (12, 24, …) gerçek tutarlar.
 * `month` sütunu takvim ayı (1…years*12). Kalan bakiye, son gerçekleşen yıllık ödemeden sonraki tutardır.
 */
export function expandAnnualScheduleToMonthlyPdfRows(
  annualRows: AmortizationRow[],
  years: number,
) {
  const y = Math.max(0, Math.trunc(Number(years) || 0));
  if (y === 0) return [];
  const ar0 = annualRows[0];
  const openingPrincipal =
    ar0 != null ? ar0.principal + ar0.balance : 0;
  const out: AmortizationRow[] = [];
  let balanceAfterLastAnnual = openingPrincipal;

  for (let m = 1; m <= y * 12; m++) {
    if (m % 12 !== 0) {
      out.push({
        month: m,
        payment: 0,
        interest: 0,
        principal: 0,
        balance: balanceAfterLastAnnual,
      });
      continue;
    }
    const yi = m / 12 - 1;
    const ar = annualRows[yi];
    if (ar) {
      balanceAfterLastAnnual = ar.balance;
      out.push({
        month: m,
        payment: ar.payment,
        interest: ar.interest,
        principal: ar.principal,
        balance: ar.balance,
      });
    }
  }
  return out;
}

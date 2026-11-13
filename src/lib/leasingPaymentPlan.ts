export type PaymentMonthMode = "paying" | "grace";

/** Peşin: müşteri toplamına düz eklenir. Financed: finanse anaparaya eklenir (vade farkı). */
export type ExtraCostPaymentMode = "cash" | "financed";

export type ExtraCostModes = {
  fileFee: ExtraCostPaymentMode;
  totalInsurance: ExtraCostPaymentMode;
  importCost: ExtraCostPaymentMode;
  attachmentCost: ExtraCostPaymentMode;
};

export const DEFAULT_EXTRA_COST_MODES: ExtraCostModes = {
  fileFee: "cash",
  totalInsurance: "cash",
  importCost: "cash",
  attachmentCost: "cash",
};

/** İleri Her Şey Dahil: kasko/masraf plana, ithalat ve opsiyonlar peşin. */
export const FORWARD_ALLIN_EXTRA_COST_MODES: ExtraCostModes = {
  fileFee: "financed",
  totalInsurance: "financed",
  importCost: "cash",
  attachmentCost: "cash",
};

export function extraCostPaymentModeLabel(
  mode: ExtraCostPaymentMode,
): "Peşin" | "Plana" {
  return mode === "financed" ? "Plana" : "Peşin";
}

export type LeasingPlanInput = {
  machinePrice: number;
  downPayment: number;
  annualNominalRatePct: number;
  termMonths: number;
  startDate: string;
  currency: string;
  financingSupport?: number;
  fileFee?: number;
  totalInsurance?: number;
  importCost?: number;
  attachmentCost?: number;
  extraCostModes?: Partial<ExtraCostModes>;
  monthModes: PaymentMonthMode[];
  balloons: number[];
  /**
   * Geri hesaplama / anahtar teslim: peşin ekler taksite eşit yayılır, anaparaya
   * ve vade farkına girmez. İleri hesaplamada kapalıdır (peşin ekler toplama eklenir).
   */
  spreadCashExtrasOnInstallments?: boolean;
};

export type LeasingPlanRow = {
  month: number;
  paymentDate: string | null;
  mode: PaymentMonthMode;
  openingBalance: number;
  periodInterest: number;
  normalInstallment: number;
  balloonPayment: number;
  totalPeriodPayment: number;
  principalPayment: number;
  closingBalance: number;
};

export type LeasingPlanStatus = "ok" | "invalid" | "incomplete";

export type LeasingPlanSummary = {
  status: LeasingPlanStatus;
  message: string;
  financedPrincipal: number;
  payingMonthCount: number;
  equalNormalInstallment: number;
  totalBalloon: number;
  totalLeasingPayments: number;
  totalFinanceInterest: number;
  totalExtraCosts: number;
  /** Peşin ödenen ek kalemler */
  cashExtraCosts: number;
  /** Plana / anaparaya dahil edilen ek kalemler */
  financedExtraCosts: number;
  /** Makine − peşinat − destek (ek hariç) */
  machineFinancedPrincipal: number;
  customerTotalPayment: number;
};

export type LeasingPlanResult = {
  summary: LeasingPlanSummary;
  rows: LeasingPlanRow[];
};

const EPS = 1e-6;

function num(v: number | undefined | null): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthlyRate(annualPct: number): number {
  return num(annualPct) / 100 / 12;
}

export function defaultMonthModes(termMonths: number): PaymentMonthMode[] {
  const n = Math.max(0, Math.trunc(termMonths));
  return Array.from({ length: n }, (_, i) => (i < 3 ? "grace" : "paying"));
}

export function defaultBalloons(termMonths: number): number[] {
  const n = Math.max(0, Math.trunc(termMonths));
  return Array.from({ length: n }, () => 0);
}

export function addMonthsToDate(isoDate: string, months: number): string | null {
  const trimmed = isoDate.trim();
  if (!trimmed) return null;
  const d = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function emptySummary(message: string, status: LeasingPlanStatus): LeasingPlanSummary {
  return {
    status,
    message,
    financedPrincipal: 0,
    payingMonthCount: 0,
    equalNormalInstallment: 0,
    totalBalloon: 0,
    totalLeasingPayments: 0,
    totalFinanceInterest: 0,
    totalExtraCosts: 0,
    cashExtraCosts: 0,
    financedExtraCosts: 0,
    machineFinancedPrincipal: 0,
    customerTotalPayment: 0,
  };
}

export function resolveExtraCostModes(
  partial?: Partial<ExtraCostModes>,
): ExtraCostModes {
  return { ...DEFAULT_EXTRA_COST_MODES, ...partial };
}

export function splitExtraCosts(
  amounts: {
    fileFee: number;
    totalInsurance: number;
    importCost: number;
    attachmentCost: number;
  },
  modes: ExtraCostModes,
): { cash: number; financed: number; total: number } {
  const items: { amount: number; mode: ExtraCostPaymentMode }[] = [
    { amount: amounts.fileFee, mode: modes.fileFee },
    { amount: amounts.totalInsurance, mode: modes.totalInsurance },
    { amount: amounts.importCost, mode: modes.importCost },
    { amount: amounts.attachmentCost, mode: modes.attachmentCost },
  ];
  let cash = 0;
  let financed = 0;
  for (const { amount, mode } of items) {
    const v = Math.max(0, num(amount));
    if (mode === "financed") financed += v;
    else cash += v;
  }
  return { cash, financed, total: cash + financed };
}

/** Eşit normal taksit — sıfır faiz dahil */
export function computeEqualNormalInstallment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  monthModes: PaymentMonthMode[],
  balloons: number[],
): number | null {
  const P = num(principal);
  const N = Math.max(0, Math.trunc(termMonths));
  if (P <= 0 || N === 0) return null;

  const r = monthlyRate(annualRatePct);
  let balloonPv = 0;
  let qDiscount = 0;

  for (let t = 1; t <= N; t++) {
    const b = Math.max(0, num(balloons[t - 1]));
    const q = monthModes[t - 1] === "paying" ? 1 : 0;
    if (r === 0) {
      balloonPv += b;
      qDiscount += q;
    } else {
      const disc = Math.pow(1 + r, t);
      balloonPv += b / disc;
      qDiscount += q / disc;
    }
  }

  if (qDiscount <= EPS) return null;

  const A = (P - balloonPv) / qDiscount;
  if (!Number.isFinite(A) || A < -EPS) return null;
  return Math.max(0, A);
}

export function computeLeasingPaymentPlan(raw: LeasingPlanInput): LeasingPlanResult {
  const machinePrice = num(raw.machinePrice);
  const downPayment = num(raw.downPayment);
  const financingSupport = num(raw.financingSupport);
  const annualRatePct = num(raw.annualNominalRatePct);
  const termMonths = Math.trunc(num(raw.termMonths));
  const fileFee = num(raw.fileFee);
  const totalInsurance = num(raw.totalInsurance);
  const importCost = num(raw.importCost);
  const attachmentCost = num(raw.attachmentCost);
  const startDate = String(raw.startDate ?? "").trim();

  if (machinePrice <= 0 || !Number.isFinite(machinePrice)) {
    return { summary: emptySummary("Makine bedelini girin.", "incomplete"), rows: [] };
  }
  if (termMonths < 1 || termMonths > 120) {
    return { summary: emptySummary("Toplam vade 1–120 ay arasında olmalı.", "invalid"), rows: [] };
  }
  if (
    downPayment < 0 ||
    financingSupport < 0 ||
    fileFee < 0 ||
    totalInsurance < 0 ||
    importCost < 0 ||
    attachmentCost < 0 ||
    annualRatePct < 0
  ) {
    return { summary: emptySummary("Tutarlar negatif olamaz.", "invalid"), rows: [] };
  }
  if (!startDate || !addMonthsToDate(startDate, 1)) {
    return { summary: emptySummary("Finansman başlangıç tarihini girin.", "incomplete"), rows: [] };
  }

  if (downPayment + financingSupport >= machinePrice - EPS) {
    return {
      summary: emptySummary(
        "Peşinat ve finansman desteği toplamı makine bedeline eşit veya fazla; finanse edilecek tutar kalmıyor.",
        "invalid",
      ),
      rows: [],
    };
  }

  const monthModes = defaultMonthModes(termMonths).map((d, i) => raw.monthModes[i] ?? d);
  const balloons = defaultBalloons(termMonths).map((d, i) => Math.max(0, num(raw.balloons[i])));

  const extraModes = resolveExtraCostModes(raw.extraCostModes);
  const extraSplit = splitExtraCosts(
    { fileFee, totalInsurance, importCost, attachmentCost },
    extraModes,
  );

  const machineFinancedPrincipal = machinePrice - downPayment - financingSupport;
  const P = machineFinancedPrincipal + extraSplit.financed;
  if (machineFinancedPrincipal <= EPS && extraSplit.financed <= EPS) {
    return {
      summary: emptySummary(
        "Finanse edilecek tutar yok (makine/peşinat/destek veya plana dahil ek maliyet girin).",
        "invalid",
      ),
      rows: [],
    };
  }

  let payingMonthCount = 0;
  for (let t = 0; t < termMonths; t++) {
    if (monthModes[t] === "paying") payingMonthCount++;
  }
  if (payingMonthCount === 0) {
    return {
      summary: emptySummary("En az bir ödemeli ay seçin.", "invalid"),
      rows: [],
    };
  }

  const A = computeEqualNormalInstallment(P, annualRatePct, termMonths, monthModes, balloons);
  if (A == null) {
    return {
      summary: emptySummary(
        "Balon ödemelerin bugünkü değeri anaparayı aşıyor; normal taksit hesaplanamıyor.",
        "invalid",
      ),
      rows: [],
    };
  }

  const spreadCash = Boolean(raw.spreadCashExtrasOnInstallments);
  const extraPerPaying =
    spreadCash && payingMonthCount > 0 ? extraSplit.cash / payingMonthCount : 0;

  const r = monthlyRate(annualRatePct);
  const rows: LeasingPlanRow[] = [];
  let balance = P;
  let totalNormal = 0;
  let totalBalloon = 0;
  let lastPayingIndex = -1;

  for (let t = 1; t <= termMonths; t++) {
    const mode = monthModes[t - 1] ?? "paying";
    const balloon = balloons[t - 1] ?? 0;
    const openingBalance = balance;
    const periodInterest = r === 0 ? 0 : openingBalance * r;
    const loanInstallment = mode === "paying" ? A : 0;
    const extraShare = mode === "paying" ? extraPerPaying : 0;
    let normalInstallment = loanInstallment + extraShare;
    const balloonPayment = balloon;
    let totalPeriodPayment = normalInstallment + balloonPayment;
    let principalPayment = loanInstallment + balloonPayment - periodInterest;
    let closingBalance = openingBalance + periodInterest - loanInstallment - balloonPayment;

    if (closingBalance < -0.01) {
      return {
        summary: emptySummary(
          `${t}. ayda borç negatife düşüyor; balon veya plan geçersiz.`,
          "invalid",
        ),
        rows: [],
      };
    }

    if (mode === "paying") lastPayingIndex = rows.length;

    rows.push({
      month: t,
      paymentDate: addMonthsToDate(startDate, t),
      mode,
      openingBalance,
      periodInterest,
      normalInstallment,
      balloonPayment,
      totalPeriodPayment,
      principalPayment,
      closingBalance,
    });

    balance = closingBalance;
    totalNormal += normalInstallment;
    totalBalloon += balloonPayment;
  }

  const residual = balance;
  if (Math.abs(residual) > 0.005 && lastPayingIndex >= 0) {
    const last = rows[lastPayingIndex];
    const adjust = residual;
    last.normalInstallment += adjust;
    last.totalPeriodPayment += adjust;
    last.principalPayment += adjust;
    last.closingBalance = 0;
    totalNormal += adjust;
    balance = 0;
  }

  if (Math.abs(balance) > 0.02) {
    return {
      summary: emptySummary("Plan kapanış bakiyesi sıfırlanamadı; girdileri kontrol edin.", "invalid"),
      rows: [],
    };
  }

  const totalLeasingPayments = totalNormal + totalBalloon;
  const cashLump = spreadCash ? 0 : extraSplit.cash;
  const customerTotalPayment =
    downPayment + totalNormal + totalBalloon + cashLump;
  const loanPaymentSum = totalNormal - (spreadCash ? extraSplit.cash : 0);

  return {
    summary: {
      status: "ok",
      message: "Hesaplandı",
      financedPrincipal: P,
      payingMonthCount,
      equalNormalInstallment: A + extraPerPaying,
      totalBalloon,
      totalLeasingPayments,
      totalFinanceInterest: loanPaymentSum + totalBalloon - P,
      totalExtraCosts: extraSplit.total,
      cashExtraCosts: extraSplit.cash,
      financedExtraCosts: extraSplit.financed,
      machineFinancedPrincipal,
      customerTotalPayment,
    },
    rows,
  };
}

export type CatalogServiceFees = {
  /** Makine bedelinin yüzdesi (ör. 1.3 = %1,3) */
  kaskoPercentOfMachine: number;
  fileFeeEuro: number;
  importCostEuro: number;
};

export const DEFAULT_CATALOG_SERVICE_FEES: CatalogServiceFees = {
  kaskoPercentOfMachine: 0,
  fileFeeEuro: 0,
  importCostEuro: 0,
};

export const SERVICE_FEE_MODES_KEY = "llp:v3:service-fee-modes";

export type ExtraCostFieldKey =
  | "kasko"
  | "fileFee"
  | "importCost"
  | "attachmentCost";

export type ServiceFeeApplyMode = "off" | "auto" | "manual";

export type ServiceFeeModes = Record<ExtraCostFieldKey, ServiceFeeApplyMode>;

export const EMPTY_SERVICE_FEE_MODES: ServiceFeeModes = {
  kasko: "off",
  fileFee: "off",
  importCost: "off",
  attachmentCost: "off",
};

export function parseServiceFeeModes(raw: unknown): ServiceFeeModes {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_SERVICE_FEE_MODES };
  }
  const o = raw as Record<string, unknown>;
  const mode = (v: unknown): ServiceFeeApplyMode =>
    v === "auto" || v === "manual" ? v : "off";
  return {
    kasko: mode(o.kasko),
    fileFee: mode(o.fileFee),
    importCost: mode(o.importCost),
    attachmentCost: mode(o.attachmentCost),
  };
}

export function parseCatalogServiceFees(raw: unknown): CatalogServiceFees {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CATALOG_SERVICE_FEES };
  }
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) => {
    const n = Number(typeof v === "string" ? v.replace(",", ".") : v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    kaskoPercentOfMachine: Math.max(0, num(o.kaskoPercentOfMachine)),
    fileFeeEuro: Math.max(0, num(o.fileFeeEuro)),
    importCostEuro: Math.max(0, num(o.importCostEuro)),
  };
}

export function computeKaskoFromMachinePrice(
  machinePriceEuro: number,
  percent: number,
): number {
  const price = Math.max(0, machinePriceEuro);
  const pct = Math.max(0, percent);
  if (price <= 0 || pct <= 0) return 0;
  return Math.round(price * (pct / 100) * 100) / 100;
}

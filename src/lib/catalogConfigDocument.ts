import {
  parseCatalogCategories,
  type CatalogCategory,
} from "@/lib/catalogPrices";
import {
  DEFAULT_CATALOG_SERVICE_FEES,
  parseCatalogServiceFees,
  type CatalogServiceFees,
} from "@/lib/catalogServiceFees";

export const CATALOG_SERVICE_FEES_LOCAL_KEY = "llp:v3:catalog-service-fees-local";

const SCHEMA_VERSION = 2;

export type CatalogConfigDocument = {
  schemaVersion: typeof SCHEMA_VERSION;
  categories: CatalogCategory[];
  serviceFees: CatalogServiceFees;
};

export function isCatalogConfigDocument(
  value: unknown,
): value is CatalogConfigDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    o.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(o.categories)
  );
}

export function readLocalServiceFees(): CatalogServiceFees | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOG_SERVICE_FEES_LOCAL_KEY);
    if (!raw) return null;
    return parseCatalogServiceFees(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalServiceFees(fees: CatalogServiceFees) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CATALOG_SERVICE_FEES_LOCAL_KEY,
      JSON.stringify(fees),
    );
  } catch {
    // ignore
  }
}

export function parseCatalogConfigFromStorage(
  categoriesColumn: unknown,
  serviceFeesColumn?: unknown,
): { categories: CatalogCategory[]; serviceFees: CatalogServiceFees } {
  let categories = parseCatalogCategories(
    isCatalogConfigDocument(categoriesColumn)
      ? categoriesColumn.categories
      : categoriesColumn,
  );

  let serviceFees = DEFAULT_CATALOG_SERVICE_FEES;

  if (isCatalogConfigDocument(categoriesColumn)) {
    serviceFees = parseCatalogServiceFees(categoriesColumn.serviceFees);
  } else if (serviceFeesColumn != null) {
    serviceFees = parseCatalogServiceFees(serviceFeesColumn);
  }

  const local = readLocalServiceFees();
  if (
    local &&
    serviceFees.kaskoPercentOfMachine === 0 &&
    serviceFees.fileFeeEuro === 0 &&
    serviceFees.importCostEuro === 0 &&
    (local.kaskoPercentOfMachine > 0 ||
      local.fileFeeEuro > 0 ||
      local.importCostEuro > 0)
  ) {
    serviceFees = local;
  }

  if (!categories.length) {
    categories = parseCatalogCategories(null);
  }

  return { categories, serviceFees };
}

export function buildCatalogConfigDocument(
  categories: CatalogCategory[],
  serviceFees: CatalogServiceFees,
): CatalogConfigDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    categories,
    serviceFees,
  };
}

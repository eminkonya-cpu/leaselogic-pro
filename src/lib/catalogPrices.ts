/**
 * Varsayilan opsiyon listesi (Supabase'de kayit yoksa veya hata olursa kullanilir).
 * Canli fiyatlar: giris yapan kullanicilar Supabase catalog_config tablosundan okur.
 */

export type CatalogCategoryId =
  | "attachment"
  | "maintenance"
  | "equipment"
  | "other";

export type CatalogItem = {
  id: string;
  label: string;
  priceEuro: number;
};

export type CatalogCategory = {
  id: CatalogCategoryId;
  title: string;
  items: CatalogItem[];
};

export const CATALOG_CATEGORY_IDS: CatalogCategoryId[] = [
  "attachment",
  "maintenance",
  "equipment",
  "other",
];

/** Kategori basina birden fazla kalem secilebilir (item id listesi). */
export type CatalogSelection = Record<CatalogCategoryId, string[]>;

export const CATALOG_STORAGE_KEY = "llp:v3:shared:catalog-selection";

export const EMPTY_CATALOG_SELECTION: CatalogSelection = {
  attachment: [],
  maintenance: [],
  equipment: [],
  other: [],
};

export const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "attachment",
    title: "Ataşman",
    items: [
      { id: "none", label: "Boş", priceEuro: 0 },
      { id: "acilir-kova", label: "Açılır Kova", priceEuro: 4500 },
      { id: "tahil-kovasi", label: "Tahıl Kovası", priceEuro: 3000 },
      { id: "sepet-yerli", label: "Sepet (Yerli)", priceEuro: 2500 },
      { id: "vinc-atasmany", label: "Vinç Ataşmanı", priceEuro: 14000 },
      { id: "rotasyonlu-catal", label: "Rotasyonlu Çatal", priceEuro: 7000 },
      {
        id: "orijinal-sepet",
        label: "Orijinal Sepet (PSE 4400)",
        priceEuro: 14000,
      },
      { id: "sidehift", label: "Sidehift", priceEuro: 1500 },
      { id: "hurda-kagit", label: "Hurda Kağıt Ataşmanı", priceEuro: 0 },
      { id: "tomruk", label: "Tomruk Ataşmanı", priceEuro: 0 },
      { id: "diger", label: "Diğer", priceEuro: 0 },
    ],
  },
  {
    id: "maintenance",
    title: "Bakım paketi",
    items: [
      { id: "none", label: "Boş", priceEuro: 0 },
      { id: "h250", label: "250 saat", priceEuro: 500 },
      { id: "h500", label: "500 saat", priceEuro: 1000 },
      { id: "h750", label: "750 saat", priceEuro: 1500 },
      { id: "h1000", label: "1000 saat", priceEuro: 2000 },
      { id: "h1250", label: "1250 saat", priceEuro: 2500 },
      { id: "h1500", label: "1500 saat", priceEuro: 3000 },
      { id: "h1750", label: "1750 saat", priceEuro: 3500 },
      { id: "h2000", label: "2000 saat", priceEuro: 4000 },
    ],
  },
  {
    id: "equipment",
    title: "Donanım",
    items: [
      { id: "none", label: "Boş", priceEuro: 0 },
      { id: "kamera", label: "Kamera", priceEuro: 1000 },
      { id: "bom-aydinlatma", label: "Bom Aydınlatma", priceEuro: 200 },
      { id: "on-cam-izgara", label: "Ön Cam Koruma Izgarası", priceEuro: 1000 },
    ],
  },
  {
    id: "other",
    title: "Diğer gider",
    items: [
      { id: "none", label: "Boş", priceEuro: 0 },
      { id: "nakliye", label: "Nakliye", priceEuro: 1000 },
    ],
  },
];

/** @deprecated DEFAULT_CATALOG_CATEGORIES kullanin */
export const CATALOG_CATEGORIES = DEFAULT_CATALOG_CATEGORIES;

function isCategoryId(value: string): value is CatalogCategoryId {
  return CATALOG_CATEGORY_IDS.includes(value as CatalogCategoryId);
}

function sanitizeItem(raw: unknown): CatalogItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.label !== "string") {
    return null;
  }
  const price =
    typeof o.priceEuro === "number"
      ? o.priceEuro
      : Number(String(o.priceEuro ?? 0).replace(",", "."));
  return {
    id: o.id,
    label: o.label,
    priceEuro: Number.isFinite(price) ? Math.max(0, price) : 0,
  };
}

/** Supabase JSON -> guvenli kategori listesi; eksik kategoriler varsayilandan tamamlanir. */
export function parseCatalogCategories(input: unknown): CatalogCategory[] {
  if (!Array.isArray(input)) {
    return DEFAULT_CATALOG_CATEGORIES;
  }

  const byId = new Map<CatalogCategoryId, CatalogCategory>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || !isCategoryId(o.id)) {
      continue;
    }
    const title = typeof o.title === "string" ? o.title : o.id;
    const itemsRaw = Array.isArray(o.items) ? o.items : [];
    const items: CatalogItem[] = [];
    for (const itemRaw of itemsRaw) {
      const item = sanitizeItem(itemRaw);
      if (item) {
        items.push(item);
      }
    }
    if (!items.some((i) => i.id === "none")) {
      items.unshift({ id: "none", label: "Boş", priceEuro: 0 });
    }
    byId.set(o.id, { id: o.id, title, items });
  }

  return CATALOG_CATEGORY_IDS.map(
    (id) => byId.get(id) ?? DEFAULT_CATALOG_CATEGORIES.find((c) => c.id === id)!,
  );
}

export function getCatalogCategories(
  categories?: CatalogCategory[],
): CatalogCategory[] {
  return categories?.length ? categories : DEFAULT_CATALOG_CATEGORIES;
}

/** Eski tek secimli (string) localStorage kayitlarini da okur. */
export function normalizeCatalogSelection(
  input: unknown,
  categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES,
): CatalogSelection {
  const cats = getCatalogCategories(categories);
  const next: CatalogSelection = {
    attachment: [],
    maintenance: [],
    equipment: [],
    other: [],
  };
  if (!input || typeof input !== "object") {
    return next;
  }
  const raw = input as Record<string, unknown>;
  for (const category of cats) {
    const value = raw[category.id];
    if (Array.isArray(value)) {
      const ids = value.filter(
        (id): id is string => typeof id === "string" && id !== "none",
      );
      next[category.id] =
        category.id === "maintenance" ? ids.slice(0, 1) : ids;
    } else if (typeof value === "string" && value !== "none") {
      next[category.id] = [value];
    }
  }
  return next;
}

export function toggleCatalogItem(
  selection: CatalogSelection,
  categoryId: CatalogCategoryId,
  itemId: string,
  categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES,
): CatalogSelection {
  const sel = normalizeCatalogSelection(selection, categories);
  if (itemId === "none") {
    return { ...sel, [categoryId]: [] };
  }

  if (categoryId === "maintenance") {
    const onlyThis =
      sel.maintenance.length === 1 && sel.maintenance[0] === itemId;
    return { ...sel, maintenance: onlyThis ? [] : [itemId] };
  }

  const ids = new Set(sel[categoryId]);
  if (ids.has(itemId)) {
    ids.delete(itemId);
  } else {
    ids.add(itemId);
  }
  return { ...sel, [categoryId]: [...ids] };
}

export const CATALOG_SINGLE_SELECT_CATEGORY_IDS: readonly CatalogCategoryId[] =
  ["maintenance"];

export function isCatalogSingleSelectCategory(
  categoryId: CatalogCategoryId,
): boolean {
  return CATALOG_SINGLE_SELECT_CATEGORY_IDS.includes(categoryId);
}

export function isCatalogItemSelected(
  selection: CatalogSelection,
  categoryId: CatalogCategoryId,
  itemId: string,
  categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES,
): boolean {
  return normalizeCatalogSelection(selection, categories)[categoryId].includes(
    itemId,
  );
}

export type CatalogLine = {
  categoryId: CatalogCategoryId;
  categoryTitle: string;
  itemId: string;
  itemLabel: string;
  priceEuro: number;
};

export function findCatalogItem(
  categoryId: CatalogCategoryId,
  itemId: string,
  categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES,
): CatalogItem | undefined {
  const category = getCatalogCategories(categories).find((c) => c.id === categoryId);
  return category?.items.find((item) => item.id === itemId);
}

export function resolveCatalogSelection(
  selection: CatalogSelection,
  categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES,
): { lines: CatalogLine[]; totalEuro: number } {
  const lines: CatalogLine[] = [];
  const sel = normalizeCatalogSelection(selection, categories);
  const cats = getCatalogCategories(categories);

  for (const category of cats) {
    const itemIds =
      category.id === "maintenance"
        ? sel[category.id].slice(0, 1)
        : sel[category.id];
    for (const itemId of itemIds) {
      const item = findCatalogItem(category.id, itemId, cats);
      if (!item || item.id === "none" || item.priceEuro <= 0) {
        continue;
      }
      lines.push({
        categoryId: category.id,
        categoryTitle: category.title,
        itemId: item.id,
        itemLabel: item.label,
        priceEuro: item.priceEuro,
      });
    }
  }

  const totalEuro = lines.reduce((sum, line) => sum + line.priceEuro, 0);
  return { lines, totalEuro };
}

export function catalogRowsForDisplay(
  lines: CatalogLine[],
  sign: "add" | "subtract",
) {
  return lines.map((line) => ({
    label:
      sign === "subtract"
        ? `- ${line.categoryTitle}: ${line.itemLabel}`
        : `${line.categoryTitle}: ${line.itemLabel}`,
    value: sign === "subtract" ? -line.priceEuro : line.priceEuro,
  }));
}

export function newCatalogItemId(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base ? `${base}-${Date.now().toString(36)}` : `kalem-${Date.now().toString(36)}`;
}

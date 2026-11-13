import {
  resolveCatalogSelection,
  type CatalogCategory,
  type CatalogCategoryId,
  type CatalogItem,
  type CatalogLine,
  type CatalogSelection,
} from "@/lib/catalogPrices";

export const GRACE_BALLOON_CATALOG_KEY = "llp:v3:grace:catalog-selection";

const CAMERA_RE = /kamera|camera|g[oö]r[uü][sş]/i;
const WINDSHIELD_RE = /ön\s*cam|on-cam|izgara|windshield/i;

export function isGraceBalloonOptionItem(
  _categoryId: CatalogCategoryId,
  item: CatalogItem,
): boolean {
  return item.id !== "none" && item.priceEuro > 0;
}

export function graceBalloonOptionLabel(
  item: CatalogItem,
  opts?: { compact?: boolean },
): string {
  const haystack = `${item.id} ${item.label}`;
  if (CAMERA_RE.test(haystack) && !/g[oö]r[uü][sş]/i.test(item.label)) {
    return "Geri görüş kamerası";
  }
  if (WINDSHIELD_RE.test(haystack) && /izgara/i.test(item.label)) {
    return "Ön cam koruma";
  }
  if (opts?.compact && /^\d+\s*saat$/i.test(item.label.trim())) {
    return item.label.replace(/\s*saat$/i, " h");
  }
  return item.label;
}

export type GraceBalloonOptionGroup = {
  id: CatalogCategoryId;
  title: string;
  items: CatalogItem[];
};

const GROUP_TITLES: Record<CatalogCategoryId, string> = {
  attachment: "Ataşman",
  maintenance: "Bakım",
  equipment: "Donanım",
  other: "Diğer giderler",
};

export function graceBalloonOptionGroups(
  categories: CatalogCategory[],
): GraceBalloonOptionGroup[] {
  const groups: GraceBalloonOptionGroup[] = [];
  for (const category of categories) {
    const items = category.items.filter((item) =>
      isGraceBalloonOptionItem(category.id, item),
    );
    if (items.length === 0) {
      continue;
    }
    groups.push({
      id: category.id,
      title: GROUP_TITLES[category.id],
      items,
    });
  }
  return groups;
}

export function resolveGraceBalloonOptionLines(
  selection: CatalogSelection,
  categories: CatalogCategory[],
): CatalogLine[] {
  const allowed = new Set(
    graceBalloonOptionGroups(categories).flatMap((group) =>
      group.items.map((item) => `${group.id}:${item.id}`),
    ),
  );
  return resolveCatalogSelection(selection, categories).lines.filter((line) =>
    allowed.has(`${line.categoryId}:${line.itemId}`),
  );
}

export function graceBalloonOptionSummaryRows(
  lines: CatalogLine[],
): { label: string; value: number }[] {
  return lines.map((line) => ({
    label: graceBalloonOptionLabel({
      id: line.itemId,
      label: line.itemLabel,
      priceEuro: line.priceEuro,
    }),
    value: line.priceEuro,
  }));
}

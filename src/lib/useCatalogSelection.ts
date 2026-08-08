"use client";

import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  CATALOG_STORAGE_KEY,
  EMPTY_CATALOG_SELECTION,
  normalizeCatalogSelection,
  toggleCatalogItem,
  type CatalogCategoryId,
  type CatalogSelection,
} from "@/lib/catalogPrices";
import { usePersistentState } from "@/lib/usePersistentState";
import { useCallback, useMemo } from "react";

export function useCatalogSelection() {
  const { categories } = useCatalogCategories();
  const [stored, setStored] = usePersistentState<unknown>(
    CATALOG_STORAGE_KEY,
    EMPTY_CATALOG_SELECTION,
  );

  const selection = useMemo(
    () => normalizeCatalogSelection(stored, categories),
    [stored, categories],
  );

  const setSelection = useCallback(
    (updater: CatalogSelection | ((prev: CatalogSelection) => CatalogSelection)) => {
      setStored((prev: unknown) => {
        const current = normalizeCatalogSelection(prev, categories);
        const next =
          typeof updater === "function" ? updater(current) : updater;
        return normalizeCatalogSelection(next, categories);
      });
    },
    [setStored, categories],
  );

  const toggle = useCallback(
    (categoryId: CatalogCategoryId, itemId: string) => {
      setSelection((prev) =>
        toggleCatalogItem(prev, categoryId, itemId, categories),
      );
    },
    [setSelection, categories],
  );

  return { selection, setSelection, toggle };
}

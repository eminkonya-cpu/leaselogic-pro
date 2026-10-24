"use client";

import {
  DEFAULT_CATALOG_CATEGORIES,
  type CatalogCategory,
} from "@/lib/catalogPrices";
import {
  buildCatalogConfigDocument,
  parseCatalogConfigFromStorage,
  writeLocalServiceFees,
} from "@/lib/catalogConfigDocument";
import {
  DEFAULT_CATALOG_SERVICE_FEES,
  type CatalogServiceFees,
} from "@/lib/catalogServiceFees";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CatalogContextValue = {
  categories: CatalogCategory[];
  serviceFees: CatalogServiceFees;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveCategories: (
    next: CatalogCategory[],
    updatedByEmail: string,
    nextServiceFees?: CatalogServiceFees,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider(props: { children: ReactNode }) {
  const [categories, setCategories] = useState<CatalogCategory[]>(
    DEFAULT_CATALOG_CATEGORIES,
  );
  const [serviceFees, setServiceFees] = useState<CatalogServiceFees>(
    DEFAULT_CATALOG_SERVICE_FEES,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyLoaded = useCallback(
    (categoriesColumn: unknown, serviceFeesColumn?: unknown) => {
      const parsed = parseCatalogConfigFromStorage(
        categoriesColumn,
        serviceFeesColumn,
      );
      setCategories(parsed.categories);
      setServiceFees(parsed.serviceFees);
    },
    [],
  );

  const loadConfig = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      applyLoaded(null);
      setError(null);
      return;
    }

    let data: { categories?: unknown; service_fees?: unknown } | null = null;
    let fetchError: { message: string } | null = null;

    const withFees = await supabase
      .from("catalog_config")
      .select("categories, service_fees")
      .eq("id", 1)
      .maybeSingle();

    if (withFees.error?.message?.includes("service_fees")) {
      const fallback = await supabase
        .from("catalog_config")
        .select("categories")
        .eq("id", 1)
        .maybeSingle();
      data = fallback.data;
      fetchError = fallback.error;
    } else {
      data = withFees.data;
      fetchError = withFees.error;
    }

    if (fetchError) {
      setError(fetchError.message);
      applyLoaded(null);
    } else {
      setError(null);
      applyLoaded(data?.categories, data?.service_fees);
    }
  }, [applyLoaded]);

  const fetchFromSupabase = useCallback(
    async (showLoadingSpinner: boolean) => {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      await loadConfig();
      setLoading(false);
    },
    [loadConfig],
  );

  const refresh = useCallback(async () => {
    await fetchFromSupabase(true);
  }, [fetchFromSupabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadConfig();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConfig]);

  const saveCategories = useCallback(
    async (
      next: CatalogCategory[],
      updatedByEmail: string,
      nextServiceFees?: CatalogServiceFees,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const supabase = getSupabaseBrowserClient();
      const fees = nextServiceFees ?? serviceFees;
      writeLocalServiceFees(fees);

      if (!supabase) {
        setCategories(next);
        setServiceFees(fees);
        setError(null);
        return { ok: true };
      }

      const document = buildCatalogConfigDocument(next, fees);
      const payload = {
        id: 1,
        categories: document,
        service_fees: fees,
        updated_at: new Date().toISOString(),
        updated_by: updatedByEmail,
      };

      let upsertError = (
        await supabase.from("catalog_config").upsert(payload, { onConflict: "id" })
      ).error;

      if (upsertError?.message?.includes("service_fees")) {
        upsertError = (
          await supabase.from("catalog_config").upsert(
            {
              id: 1,
              categories: document,
              updated_at: payload.updated_at,
              updated_by: updatedByEmail,
            },
            { onConflict: "id" },
          )
        ).error;
      }

      if (upsertError) {
        return {
          ok: false,
          message: upsertError.message.includes("policy")
            ? "Kaydetme yetkiniz yok. Supabase'de can_edit_catalog = true olmali."
            : upsertError.message,
        };
      }

      setCategories(next);
      setServiceFees(fees);
      setError(null);
      return { ok: true };
    },
    [serviceFees],
  );

  const value = useMemo(
    () => ({
      categories,
      serviceFees,
      loading,
      error,
      refresh,
      saveCategories,
    }),
    [categories, serviceFees, loading, error, refresh, saveCategories],
  );

  return (
    <CatalogContext.Provider value={value}>{props.children}</CatalogContext.Provider>
  );
}

export function useCatalogCategories() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalogCategories must be used within CatalogProvider");
  }
  return ctx;
}

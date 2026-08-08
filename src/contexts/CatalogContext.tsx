"use client";

import {
  DEFAULT_CATALOG_CATEGORIES,
  parseCatalogCategories,
  type CatalogCategory,
} from "@/lib/catalogPrices";
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
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveCategories: (
    next: CatalogCategory[],
    updatedByEmail: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider(props: { children: ReactNode }) {
  const [categories, setCategories] = useState<CatalogCategory[]>(
    DEFAULT_CATALOG_CATEGORIES,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromSupabase = useCallback(async (showLoadingSpinner: boolean) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setCategories(DEFAULT_CATALOG_CATEGORIES);
      setLoading(false);
      setError(null);
      return;
    }

    if (showLoadingSpinner) {
      setLoading(true);
    }

    const { data, error: fetchError } = await supabase
      .from("catalog_config")
      .select("categories")
      .eq("id", 1)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setCategories(DEFAULT_CATALOG_CATEGORIES);
    } else if (data?.categories) {
      setError(null);
      setCategories(parseCatalogCategories(data.categories));
    } else {
      setError(null);
      setCategories(DEFAULT_CATALOG_CATEGORIES);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    await fetchFromSupabase(true);
  }, [fetchFromSupabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) {
          setCategories(DEFAULT_CATALOG_CATEGORIES);
          setLoading(false);
          setError(null);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("catalog_config")
        .select("categories")
        .eq("id", 1)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setCategories(DEFAULT_CATALOG_CATEGORIES);
      } else if (data?.categories) {
        setError(null);
        setCategories(parseCatalogCategories(data.categories));
      } else {
        setError(null);
        setCategories(DEFAULT_CATALOG_CATEGORIES);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveCategories = useCallback(
    async (
      next: CatalogCategory[],
      updatedByEmail: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { ok: false, message: "Supabase baglantisi yok." };
      }

      const payload = {
        id: 1,
        categories: next,
        updated_at: new Date().toISOString(),
        updated_by: updatedByEmail,
      };

      const { error: upsertError } = await supabase
        .from("catalog_config")
        .upsert(payload, { onConflict: "id" });

      if (upsertError) {
        return {
          ok: false,
          message: upsertError.message.includes("policy")
            ? "Kaydetme yetkiniz yok. Supabase'de can_edit_catalog = true olmali."
            : upsertError.message,
        };
      }

      setCategories(next);
      setError(null);
      return { ok: true };
    },
    [],
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      error,
      refresh,
      saveCategories,
    }),
    [categories, loading, error, refresh, saveCategories],
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

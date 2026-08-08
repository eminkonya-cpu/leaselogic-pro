"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  newCatalogItemId,
  type CatalogCategory,
  type CatalogCategoryId,
  type CatalogItem,
} from "@/lib/catalogPrices";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

function cloneCategories(cats: CatalogCategory[]): CatalogCategory[] {
  return cats.map((c) => ({
    ...c,
    items: c.items.map((i) => ({ ...i })),
  }));
}

function CatalogAdminEditorForm(props: {
  initialCategories: CatalogCategory[];
  userEmail: string;
  onBack: () => void;
}) {
  const { saveCategories, refresh } = useCatalogCategories();
  const [draft, setDraft] = useState(() =>
    cloneCategories(props.initialCategories),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateItem = useCallback(
    (
      categoryId: CatalogCategoryId,
      itemId: string,
      patch: Partial<Pick<CatalogItem, "label" | "priceEuro">>,
    ) => {
      setDraft((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : {
                ...cat,
                items: cat.items.map((item) =>
                  item.id !== itemId ? item : { ...item, ...patch },
                ),
              },
        ),
      );
    },
    [],
  );

  const addItem = useCallback((categoryId: CatalogCategoryId) => {
    setDraft((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: [
                ...cat.items,
                {
                  id: newCatalogItemId("yeni-kalem"),
                  label: "Yeni kalem",
                  priceEuro: 0,
                },
              ],
            },
      ),
    );
  }, []);

  const removeItem = useCallback(
    (categoryId: CatalogCategoryId, itemId: string) => {
      if (itemId === "none") {
        return;
      }
      setDraft((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : {
                ...cat,
                items: cat.items.filter((i) => i.id !== itemId),
              },
        ),
      );
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveCategories(draft, props.userEmail);
    setSaving(false);
    if (result.ok) {
      setMessage("Kaydedildi. Tum kullanicilar guncel listeyi gorur.");
      await refresh();
    } else {
      setMessage(result.message);
    }
  };

  const handleResetDraft = () => {
    setDraft(cloneCategories(props.initialCategories));
    setMessage(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">
            Opsiyon fiyat listesi yönetimi
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Ataşman, bakım paketi, donanım ve diğer gider — kayıt Supabase&apos;de
            tutulur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={props.onBack}>
            Hesaplayıcıya dön
          </Button>
          <Button type="button" variant="outline" onClick={handleResetDraft}>
            Değişiklikleri geri al
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Save aria-hidden />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm font-bold ${
            message.startsWith("Kaydedildi")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {draft.map((category) => (
          <section
            key={category.id}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <Label className="text-sm font-extrabold text-[#114a72]">
                {category.title}
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold"
                onClick={() => addItem(category.id)}
              >
                <Plus className="h-3.5 w-3.5" />
                Kalem ekle
              </Button>
            </div>
            <div className="space-y-2">
              {category.items
                .filter((item) => item.id !== "none")
                .map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_7rem_auto] items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2"
                  >
                    <Input
                      value={item.label}
                      onChange={(e) =>
                        updateItem(category.id, item.id, {
                          label: e.target.value,
                        })
                      }
                      className="h-9 text-xs font-semibold"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={item.priceEuro}
                      onChange={(e) =>
                        updateItem(category.id, item.id, {
                          priceEuro: Number(e.target.value) || 0,
                        })
                      }
                      className="h-9 text-xs font-semibold tabular-nums"
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => removeItem(category.id, item.id)}
                      title="Kalemi sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Orta sütun: KDV hariç € fiyat
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function CatalogAdminEditor(props: {
  userEmail: string;
  onBack: () => void;
}) {
  const { categories, loading } = useCatalogCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Liste yukleniyor…
      </div>
    );
  }

  const formKey = categories
    .map((c) => `${c.id}:${c.items.map((i) => `${i.id}-${i.priceEuro}`).join(",")}`)
    .join("|");

  return (
    <CatalogAdminEditorForm
      key={formKey}
      initialCategories={categories}
      userEmail={props.userEmail}
      onBack={props.onBack}
    />
  );
}

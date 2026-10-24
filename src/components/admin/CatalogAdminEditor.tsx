"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import type { CatalogServiceFees } from "@/lib/catalogServiceFees";
import {
  newCatalogItemId,
  type CatalogCategory,
  type CatalogCategoryId,
  type CatalogItem,
} from "@/lib/catalogPrices";
import { LoaderCircle, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useState, type DragEvent } from "react";

function cloneCategories(cats: CatalogCategory[]): CatalogCategory[] {
  return cats.map((c) => ({
    ...c,
    items: c.items.map((i) => ({ ...i })),
  }));
}

function reorderCategoryItems(
  items: CatalogItem[],
  fromVisibleIndex: number,
  toVisibleIndex: number,
): CatalogItem[] {
  const noneItem = items.find((item) => item.id === "none");
  const visible = items.filter((item) => item.id !== "none");
  if (
    fromVisibleIndex < 0 ||
    toVisibleIndex < 0 ||
    fromVisibleIndex >= visible.length ||
    toVisibleIndex >= visible.length ||
    fromVisibleIndex === toVisibleIndex
  ) {
    return items;
  }

  const nextVisible = [...visible];
  const [moved] = nextVisible.splice(fromVisibleIndex, 1);
  nextVisible.splice(toVisibleIndex, 0, moved);

  return noneItem ? [noneItem, ...nextVisible] : nextVisible;
}

function CatalogItemRow(props: {
  categoryId: CatalogCategoryId;
  item: CatalogItem;
  index: number;
  dragIndex: number | null;
  dropIndex: number | null;
  onDragIndexChange: (index: number | null) => void;
  onDropIndexChange: (index: number | null) => void;
  onReorder: (
    categoryId: CatalogCategoryId,
    fromVisibleIndex: number,
    toVisibleIndex: number,
  ) => void;
  onUpdate: (
    categoryId: CatalogCategoryId,
    itemId: string,
    patch: Partial<Pick<CatalogItem, "label" | "priceEuro">>,
  ) => void;
  onRemove: (categoryId: CatalogCategoryId, itemId: string) => void;
}) {
  const {
    categoryId,
    item,
    index,
    dragIndex,
    dropIndex,
    onDragIndexChange,
    onDropIndexChange,
    onReorder,
    onUpdate,
    onRemove,
  } = props;

  const isDragging = dragIndex === index;
  const isDropTarget =
    dropIndex === index && dragIndex !== null && dragIndex !== index;

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    onDragIndexChange(index);

    const row = event.currentTarget.closest("[data-catalog-row]");
    if (row instanceof HTMLElement) {
      event.dataTransfer.setDragImage(row, 24, row.offsetHeight / 2);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && dragIndex !== index) {
      onDropIndexChange(index);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isFinite(fromIndex) && fromIndex !== index) {
      onReorder(categoryId, fromIndex, index);
    }
    onDragIndexChange(null);
    onDropIndexChange(null);
  };

  return (
    <div
      data-catalog-row
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`grid grid-cols-[auto_1fr_7rem_auto] items-center gap-2 rounded-lg border p-2 transition-colors ${
        isDragging
          ? "border-[#f59e0b]/50 bg-[#fffbeb]/90 opacity-60"
          : isDropTarget
            ? "border-[#f59e0b] bg-[#fef3c7]/80 ring-2 ring-[#f59e0b]/25"
            : "border-slate-100 bg-slate-50/80"
      }`}
    >
      <button
        type="button"
        draggable
        aria-label={`${item.label} sırasını değiştir`}
        title="Sürükleyerek sırayı değiştir"
        onDragStart={handleDragStart}
        onDragEnd={() => {
          onDragIndexChange(null);
          onDropIndexChange(null);
        }}
        className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-[#f59e0b]/40 hover:bg-[#fffbeb] hover:text-[#b45309] active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <Input
        value={item.label}
        onChange={(e) =>
          onUpdate(categoryId, item.id, {
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
          onUpdate(categoryId, item.id, {
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
        onClick={() => onRemove(categoryId, item.id)}
        title="Kalemi sil"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CatalogAdminEditorForm(props: {
  initialCategories: CatalogCategory[];
  initialServiceFees: CatalogServiceFees;
  userEmail: string;
  onBack: () => void;
}) {
  const { saveCategories, refresh } = useCatalogCategories();
  const [draft, setDraft] = useState(() =>
    cloneCategories(props.initialCategories),
  );
  const [draftFees, setDraftFees] = useState<CatalogServiceFees>(() => ({
    ...props.initialServiceFees,
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragState, setDragState] = useState<{
    categoryId: CatalogCategoryId;
    index: number;
  } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

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

  const reorderItem = useCallback(
    (
      categoryId: CatalogCategoryId,
      fromVisibleIndex: number,
      toVisibleIndex: number,
    ) => {
      setDraft((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : {
                ...cat,
                items: reorderCategoryItems(
                  cat.items,
                  fromVisibleIndex,
                  toVisibleIndex,
                ),
              },
        ),
      );
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveCategories(draft, props.userEmail, draftFees);
    setSaving(false);
    if (result.ok) {
      setMessage(
        "Kaydedildi. Opsiyon listesi ve otomatik maliyet ayarlari tum kullanicilara yansir.",
      );
      await refresh();
    } else {
      setMessage(result.message);
    }
  };

  const handleResetDraft = () => {
    setDraft(cloneCategories(props.initialCategories));
    setDraftFees({ ...props.initialServiceFees });
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

      <section className="rounded-2xl border border-[#c3c6d7] bg-white/90 p-4 shadow-md">
        <h2 className="text-sm font-extrabold text-[#114a72]">
          Otomatik maliyet kalemleri
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">
              Kasko maliyeti (% makine bedeli)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={draftFees.kaskoPercentOfMachine}
              onChange={(e) =>
                setDraftFees((prev) => ({
                  ...prev,
                  kaskoPercentOfMachine: Math.max(
                    0,
                    Number(e.target.value.replace(",", ".")) || 0,
                  ),
                }))
              }
              className="h-9 text-sm font-semibold tabular-nums"
              placeholder="1.3"
            />
            <p className="text-[10px] text-slate-500">Örnek: 1,3 = %1,3</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">
              Dosya masrafı (€, KDV hariç)
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={draftFees.fileFeeEuro}
              onChange={(e) =>
                setDraftFees((prev) => ({
                  ...prev,
                  fileFeeEuro: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="h-9 text-sm font-semibold tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">
              İthalat maliyeti (€, KDV hariç)
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={draftFees.importCostEuro}
              onChange={(e) =>
                setDraftFees((prev) => ({
                  ...prev,
                  importCostEuro: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="h-9 text-sm font-semibold tabular-nums"
            />
          </div>
        </div>
      </section>

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
                .map((item, index) => (
                  <CatalogItemRow
                    key={item.id}
                    categoryId={category.id}
                    item={item}
                    index={index}
                    dragIndex={
                      dragState?.categoryId === category.id
                        ? dragState.index
                        : null
                    }
                    dropIndex={
                      dragState?.categoryId === category.id ? dropIndex : null
                    }
                    onDragIndexChange={(nextIndex) => {
                      if (nextIndex === null) {
                        setDragState(null);
                        return;
                      }
                      setDragState({ categoryId: category.id, index: nextIndex });
                    }}
                    onDropIndexChange={setDropIndex}
                    onReorder={reorderItem}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Sol tutamaktan sürükleyerek sıralayın · Orta sütun: KDV hariç € fiyat
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
  const { categories, serviceFees, loading } = useCatalogCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Liste yukleniyor…
      </div>
    );
  }

  const formKey = [
    categories
      .map((c) => `${c.id}:${c.items.map((i) => `${i.id}-${i.priceEuro}`).join(",")}`)
      .join("|"),
    serviceFees.kaskoPercentOfMachine,
    serviceFees.fileFeeEuro,
    serviceFees.importCostEuro,
  ].join(";");

  return (
    <CatalogAdminEditorForm
      key={formKey}
      initialCategories={categories}
      initialServiceFees={serviceFees}
      userEmail={props.userEmail}
      onBack={props.onBack}
    />
  );
}

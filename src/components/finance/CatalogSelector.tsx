"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  isCatalogItemSelected,
  isCatalogSingleSelectCategory,
  normalizeCatalogSelection,
  resolveCatalogSelection,
  type CatalogCategoryId,
  type CatalogSelection,
} from "@/lib/catalogPrices";
import { ListChecks } from "lucide-react";

export default function CatalogSelector(props: {
  selection: CatalogSelection;
  onToggle: (categoryId: CatalogCategoryId, itemId: string) => void;
  onClearCategory?: (categoryId: CatalogCategoryId) => void;
  onClearAll?: () => void;
  appearance?: "legacy" | "clean";
  /** Tam genişlik: iki sütun (dar ana kolonda) veya sayfa genişliği dört sütun */
  layout?: "inline" | "full" | "page";
  /** Stitch / dashboard: daha büyük yazı ve sabit liste yüksekliği */
  density?: "compact" | "comfortable";
  /** Sade makine: kısa kolonlar, ekrana sığan liste */
  profile?: "default" | "plain";
  className?: string;
}) {
  const { categories } = useCatalogCategories();
  const selection = normalizeCatalogSelection(props.selection, categories);
  const resolved = resolveCatalogSelection(selection, categories);
  const attachmentSum = resolved.lines
    .filter((l) => l.categoryId === "attachment")
    .reduce((s, l) => s + l.priceEuro, 0);
  const maintenanceSum = resolved.lines
    .filter((l) => l.categoryId === "maintenance")
    .reduce((s, l) => s + l.priceEuro, 0);
  const otherCatalogSum = resolved.lines
    .filter((l) => l.categoryId === "other")
    .reduce((s, l) => s + l.priceEuro, 0);
  const equipmentSum = resolved.lines
    .filter((l) => l.categoryId === "equipment")
    .reduce((s, l) => s + l.priceEuro, 0);

  const clean = props.appearance === "clean";
  const pageWidth = props.layout === "page";
  const fullWidth = props.layout === "full" || props.layout === "page" || clean;
  const comfortable = props.density !== "compact";
  const plainProfile = props.profile === "plain";
  const grid = categories.map((category) => {
    const selectableItems = category.items.filter((item) => item.id !== "none");
    const selectedCount = selection[category.id].length;
    const isSingleSelect = isCatalogSingleSelectCategory(category.id);

    return (
      <div
        key={category.id}
        className={cn(
          "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white",
          clean
            ? cn(
                "border-[#E2E8F0]",
                plainProfile
                  ? "min-h-0"
                  : comfortable &&
                    "min-h-[240px] sm:min-h-[260px] max-lg:min-h-0",
              )
            : "max-h-[220px] rounded-lg border-slate-200/90 bg-white/90 shadow-sm",
        )}
      >
        <div
          className={cn(
            "border-b border-slate-100",
            clean
              ? "border-[#E2E8F0] bg-white px-3 py-2"
              : "px-2 py-1.5",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              className={cn(
                "font-bold text-slate-800",
                clean
                  ? "text-[13px] font-medium text-[#334155]"
                  : "text-[11px] lg:text-xs",
              )}
            >
              {category.title}
              {selectedCount > 0 ? (
                <span className="ml-1.5 font-semibold text-[#64748B]">
                  ({selectedCount})
                </span>
              ) : null}
            </Label>
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={() =>
                  props.onClearCategory?.(category.id) ??
                  props.onToggle(category.id, "none")
                }
                className={cn(
                  "shrink-0 font-semibold text-[#64748B] hover:text-[#0F172A] hover:underline",
                  comfortable ? "text-xs" : "text-[10px] sm:text-[11px]",
                )}
              >
                Temizle
              </button>
            ) : null}
          </div>
          {!clean && !isSingleSelect ? (
            <p className="text-[9px] font-semibold text-slate-500 lg:text-[10px]">
              Birden fazla seçilebilir
            </p>
          ) : null}
        </div>
        <ul
          className={cn(
            "min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain",
            clean
              ? cn(
                  "flex-1 px-2 py-2 sm:px-3",
                  plainProfile
                    ? "max-h-[min(168px,22vh)]"
                    : comfortable
                      ? "max-h-[min(280px,48vh)] max-lg:max-h-[min(200px,34vh)]"
                      : "max-h-[min(260px,44vh)] max-lg:max-h-[min(180px,32vh)]",
                )
              : "px-1.5 py-1.5",
          )}
        >
          {selectableItems.map((item) => {
            const checked = isCatalogItemSelected(
              selection,
              category.id,
              item.id,
              categories,
            );
            const priceLabel =
              item.priceEuro > 0
                ? `${item.priceEuro.toLocaleString("tr-TR")} €`
                : "—";

            return (
              <li key={item.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors",
                    clean
                      ? "py-1.5 text-[13px] leading-snug"
                      : "items-start py-1 text-[11px] lg:text-xs",
                    checked
                      ? clean
                        ? "bg-[#F8FAFC] font-medium text-[#020617]"
                        : "bg-[#d9ecf7]/90 font-bold text-[#0f2f49]"
                      : clean
                        ? "text-[#020617] hover:bg-[#F8FAFC]"
                        : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <input
                    type={isSingleSelect ? "radio" : "checkbox"}
                    data-promo-catalog={`${category.id}:${item.id}`}
                    name={
                      isSingleSelect ? `catalog-${category.id}` : undefined
                    }
                    className={cn(
                      "shrink-0 border-slate-300 accent-[#0F172A]",
                      clean ? "h-4 w-4" : "h-4 w-4",
                      !clean && "mt-0.5 h-3.5 w-3.5 accent-[#114a72]",
                      isSingleSelect ? "rounded-full" : "rounded-[3px]",
                    )}
                    checked={checked}
                    onChange={() => props.onToggle(category.id, item.id)}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 leading-snug",
                      checked && clean && "font-semibold text-slate-900",
                      !clean && "flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between",
                    )}
                  >
                    <span className={clean ? "break-words" : undefined}>
                      {item.label}
                    </span>
                    {!clean ? (
                      <span
                        className={cn(
                          "shrink-0 tabular-nums text-[10px] lg:text-[11px]",
                          checked ? "text-[#114a72]" : "text-slate-500",
                        )}
                      >
                        {priceLabel}
                      </span>
                    ) : null}
                  </span>
                  {clean ? (
                    <span
                      className={cn(
                        "shrink-0 text-[13px] tabular-nums font-medium",
                        checked ? "text-[#0F172A]" : "text-[#64748B]",
                      )}
                    >
                      {priceLabel}
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  });

  if (clean) {
    const clearButton = (
      <button
        type="button"
        onClick={() => props.onClearAll?.()}
        className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
      >
        Tümünü Temizle
      </button>
    );

    return (
      <section
        className={cn(
          plainProfile
            ? "min-w-0"
            : "rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:p-4",
          props.className,
        )}
      >
        {plainProfile ? (
          <div className="mb-3 flex justify-end">{clearButton}</div>
        ) : (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Opsiyonlar ve Diğer Giderler
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Ataşman ve donanım çoklu; bakım paketi tek seçim
              </p>
            </div>
            {clearButton}
          </div>
        )}
        <div
          className={cn(
            "grid gap-3 max-lg:gap-2.5",
            plainProfile
              ? "grid-cols-1 gap-3 sm:grid-cols-2"
              : fullWidth
                ? pageWidth && comfortable
                  ? "grid-cols-1 max-lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  : comfortable
                    ? "grid-cols-1 max-lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {grid}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] px-4 py-2.5 sm:grid-cols-4">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              Opsiyon
            </span>
            <span className="tabular-nums text-[13px] font-semibold text-[#0F172A]">
              {attachmentSum.toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              Bakım
            </span>
            <span className="tabular-nums text-[13px] font-semibold text-[#0F172A]">
              {maintenanceSum.toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              Diğer
            </span>
            <span className="tabular-nums text-[13px] font-semibold text-[#0F172A]">
              {(equipmentSum + otherCatalogSum).toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0 sm:text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              Toplam
            </span>
            <span className="tabular-nums text-sm font-semibold text-[#0F172A] md:text-base">
              {resolved.totalEuro.toLocaleString("tr-TR")} €
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur",
        props.className,
      )}
    >
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white lg:px-3 lg:pb-3.5 lg:pt-4">
        <CardTitle className="flex w-full items-center justify-start gap-2 text-left text-[13px] font-extrabold tracking-tight text-white lg:flex-col lg:justify-center lg:gap-2 lg:text-center lg:text-[15px]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm lg:h-9 lg:w-9">
            <ListChecks className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
          </span>
          <span className="max-w-[16rem] leading-snug">Opsiyon Fiyat Listesi</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 px-2.5 pt-2.5 sm:grid-cols-2 lg:gap-4 lg:px-6 lg:pt-4 xl:grid-cols-4">
        {grid}
      </CardContent>
    </Card>
  );
}

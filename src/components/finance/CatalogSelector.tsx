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
  const highlightPage = clean && pageWidth && !plainProfile;

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
                "border-[#c3c6d7] shadow-sm",
                highlightPage && "border-[#fcd34d]/70",
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
              ? cn(
                  highlightPage
                    ? "border-[#fcd34d]/60 bg-[#fef3c7] px-3 py-2"
                    : "bg-[#eff4ff] px-3 py-2",
                  plainProfile && "px-3 py-2",
                  comfortable &&
                    !plainProfile &&
                    !highlightPage &&
                    "border-[#c3c6d7] max-lg:px-3 max-lg:py-2",
                )
              : "px-2 py-1.5",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              className={cn(
                "font-bold text-slate-800",
                clean
                  ? comfortable && !plainProfile
                    ? "text-xs font-semibold text-[#0b1c30] md:text-[13px]"
                    : "text-xs font-semibold text-[#0b1c30] sm:text-sm"
                  : "text-[11px] lg:text-xs",
              )}
            >
              {category.title}
              {selectedCount > 0 ? (
                <span className="ml-1.5 font-semibold text-[#2563eb]">
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
                  "shrink-0 font-semibold text-[#004ac6] hover:underline",
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
                      ? comfortable
                        ? "py-2 text-[13px] leading-snug max-lg:gap-2 max-lg:px-2 max-lg:py-1.5 max-lg:text-[13px]"
                        : plainProfile
                          ? "py-2 text-sm sm:text-[15px]"
                          : "py-2 text-xs sm:text-[13px]"
                      : "items-start py-1 text-[11px] lg:text-xs",
                    checked
                      ? clean
                        ? comfortable
                          ? "border border-[#2563eb]/30 bg-[#eff4ff] font-medium"
                          : "bg-sky-50 ring-1 ring-sky-100"
                        : "bg-[#d9ecf7]/90 font-bold text-[#0f2f49]"
                      : clean
                        ? "border border-transparent text-[#0b1c30] hover:bg-[#eff4ff]/60"
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
                      "shrink-0 border-slate-300 accent-[#004ac6]",
                      clean && comfortable
                        ? "h-5 w-5"
                        : "h-4 w-4",
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
                        "shrink-0 tabular-nums font-semibold",
                        comfortable
                          ? "text-sm md:text-[15px] max-lg:text-sm"
                          : plainProfile
                            ? "text-sm sm:text-[15px]"
                            : "text-xs sm:text-[13px]",
                        checked ? "font-bold text-[#004ac6]" : "text-[#565e74]",
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
    return (
      <section
        className={cn(
          highlightPage
            ? "relative overflow-hidden rounded-xl border border-[#fbbf24]/45 bg-[#fffbeb] pl-2 shadow-sm ring-1 ring-[#f59e0b]/10"
            : "rounded-xl border border-[#c3c6d7] bg-white shadow-sm",
          plainProfile ? "p-4" : "p-4 sm:p-5 max-lg:p-3",
          props.className,
        )}
      >
        {highlightPage ? (
          <div
            className="absolute bottom-0 left-0 top-0 w-1 bg-[#f59e0b]"
            aria-hidden
          />
        ) : null}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-b",
            highlightPage ? "border-[#fcd34d]/60" : "border-[#c3c6d7]",
            plainProfile ? "mb-3 pb-2" : "mb-3 pb-2 max-lg:mb-2 max-lg:pb-1.5",
          )}
        >
          <div>
            <h2
              className={cn(
                "font-semibold text-[#0b1c30]",
                highlightPage && "text-[#92400e]",
                plainProfile ? "text-base sm:text-lg" : "text-base md:text-[17px] max-lg:text-lg",
              )}
            >
              Opsiyonlar ve Diğer Giderler
            </h2>
            {plainProfile ? (
              <p className="mt-0.5 text-sm text-[#434655] md:text-[15px]">
                Finansmana dahil — ataşman / bakım / donanım
              </p>
            ) : comfortable ? (
              <p className="mt-1 text-sm text-[#434655] md:text-[15px]">
                Ataşman ve donanım çoklu; bakım paketi tek seçim
              </p>
            ) : (
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Ataşman ve donanım çoklu; bakım paketi tek seçim
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => props.onClearAll?.()}
            className={cn(
              "font-semibold hover:underline",
              highlightPage ? "text-[#b45309]" : "text-[#004ac6]",
              comfortable ? "text-sm md:text-[15px]" : "text-xs",
            )}
          >
            Tümünü Temizle
          </button>
        </div>
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
        <div
          className={cn(
            "grid grid-cols-2 gap-3 rounded-xl px-4 sm:grid-cols-4 max-lg:gap-2 max-lg:px-3",
            highlightPage ? "bg-[#fde68a]/35" : "bg-[#eff4ff]",
            plainProfile
              ? "mt-3 py-2.5 text-xs sm:text-sm"
              : cn(
                  "mt-3 py-3 max-lg:mt-2 max-lg:py-2",
                  comfortable
                    ? "text-sm max-lg:text-sm"
                    : "text-xs font-semibold text-slate-600 sm:text-sm",
                ),
          )}
        >
          <div className="min-w-0">
            <span
              className={cn(
                "block font-medium uppercase tracking-wide text-[#565e74]",
                comfortable ? "text-xs" : "text-[10px] sm:text-[11px]",
              )}
            >
              Opsiyon
            </span>
            <span className="tabular-nums text-slate-800">
              {attachmentSum.toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0">
            <span
              className={cn(
                "block font-medium uppercase tracking-wide text-[#565e74]",
                comfortable ? "text-xs" : "text-[10px] sm:text-[11px]",
              )}
            >
              Bakım
            </span>
            <span className="tabular-nums text-slate-800">
              {maintenanceSum.toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0">
            <span
              className={cn(
                "block font-medium uppercase tracking-wide text-[#565e74]",
                comfortable ? "text-xs" : "text-[10px] sm:text-[11px]",
              )}
            >
              Diğer
            </span>
            <span className="tabular-nums text-slate-800">
              {(equipmentSum + otherCatalogSum).toLocaleString("tr-TR")} €
            </span>
          </div>
          <div className="min-w-0 sm:text-right">
            <span
              className={cn(
                "block font-medium uppercase tracking-wide text-[#565e74]",
                comfortable ? "text-xs" : "text-[10px] sm:text-[11px]",
              )}
            >
              Toplam
            </span>
            <span className="tabular-nums text-base font-bold text-[#004ac6] md:text-lg">
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

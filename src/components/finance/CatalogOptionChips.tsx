"use client";

import {
  CALC_CHIP_BASE_CLS,
  CALC_CHIP_GROUP_CLS,
  CALC_FOCUS_RING,
  calcChipStateCls,
} from "@/components/finance/ui/CalcFormChrome";
import { formatNumber } from "@/components/finance/format";
import { useCatalogCategories } from "@/contexts/CatalogContext";
import {
  isCatalogItemSelected,
  isCatalogSingleSelectCategory,
  type CatalogCategoryId,
  type CatalogItem,
  type CatalogSelection,
} from "@/lib/catalogPrices";
import {
  graceBalloonOptionGroups,
  graceBalloonOptionLabel,
  type GraceBalloonOptionGroup,
} from "@/lib/graceBalloonCatalogOptions";
import { cn } from "@/lib/utils";
import { Fragment, type ReactNode } from "react";

const INLINE_GROUP_IDS: CatalogCategoryId[] = ["equipment", "other"];

function GroupLabel(props: { title: string; hint?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#BAE6FD] bg-[#F0F9FF] px-2.5 text-[12px] font-bold text-[#0C4A6E]",
        props.className,
      )}
    >
      {props.title}
      {props.hint ? (
        <span className="text-[10px] font-semibold text-[#0284C7]">{props.hint}</span>
      ) : null}
    </span>
  );
}

export default function CatalogOptionChips(props: {
  selection: CatalogSelection;
  onToggle: (categoryId: CatalogCategoryId, itemId: string) => void;
  onClearAll?: () => void;
  heading?: string;
  description?: string;
  headerRight?: ReactNode;
  className?: string;
  /** Promo kaydı için chip data attribute. */
  promoAttr?: boolean;
}) {
  const { categories } = useCatalogCategories();
  const groups = graceBalloonOptionGroups(categories);
  if (groups.length === 0) {
    return null;
  }

  const stacked = groups.filter((group) => !INLINE_GROUP_IDS.includes(group.id));
  const inline = groups.filter((group) => INLINE_GROUP_IDS.includes(group.id));
  const heading = props.heading ?? "Opsiyonlar";
  const showHeading = heading.length > 0;

  const renderChip = (
    group: GraceBalloonOptionGroup,
    item: CatalogItem,
    fitRow = false,
  ) => {
    const selected = isCatalogItemSelected(
      props.selection,
      group.id,
      item.id,
      categories,
    );
    const label = graceBalloonOptionLabel(item, { compact: true });
    return (
      <button
        key={`${group.id}:${item.id}`}
        type="button"
        aria-pressed={selected}
        data-promo-catalog={
          props.promoAttr ? `${group.id}:${item.id}` : undefined
        }
        title={`${label} · ${formatNumber(item.priceEuro, { decimals: 0 })} €`}
        onClick={() => props.onToggle(group.id, item.id)}
        className={cn(
          CALC_CHIP_BASE_CLS,
          CALC_FOCUS_RING,
          "inline-flex h-8 items-center gap-1.5 whitespace-nowrap text-[11px]",
          fitRow
            ? "min-w-0 flex-1 justify-center px-2"
            : "max-w-full px-2.5",
          calcChipStateCls(selected),
        )}
      >
        <span className="truncate">{label}</span>
        <span className="tabular-nums opacity-80">
          {formatNumber(item.priceEuro, { decimals: 0 })} €
        </span>
      </button>
    );
  };

  return (
    <div className={cn("space-y-2.5", props.className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {showHeading ? (
          <div>
            <p className="text-[13px] font-semibold text-[#0F172A]">{heading}</p>
            {props.description ? (
              <p className="text-[11px] text-[#64748B]">{props.description}</p>
            ) : null}
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {props.headerRight}
          {props.onClearAll ? (
            <button
              type="button"
              onClick={props.onClearAll}
              className="inline-flex h-8 cursor-pointer items-center rounded-md border border-[#CBD5E1] bg-white px-3 text-[11px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              Tümünü temizle
            </button>
          ) : null}
        </div>
      </div>

      {stacked.map((group) => {
        const single = isCatalogSingleSelectCategory(group.id);
        return (
          <div key={group.id} className="min-w-0 space-y-1.5">
            <GroupLabel
              title={group.title}
              hint={single ? "tek seçim" : undefined}
            />
            <div
              className={cn(
                CALC_CHIP_GROUP_CLS,
                single && "flex-nowrap gap-1.5",
              )}
              role="group"
              aria-label={group.title}
            >
              {group.items.map((item) => renderChip(group, item, single))}
            </div>
          </div>
        );
      })}

      {inline.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Donanım ve diğer giderler"
        >
          {inline.map((group, index) => (
            <Fragment key={group.id}>
              <GroupLabel
                title={group.title}
                className={index > 0 ? "ml-1.5" : undefined}
              />
              {group.items.map((item) => renderChip(group, item))}
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

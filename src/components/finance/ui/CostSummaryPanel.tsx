"use client";

import { formatNumber } from "@/components/finance/format";
import { cn } from "@/lib/utils";

export type CostSummarySubRow = {
  label: string;
  value: number;
};

export type CostSummaryRow = {
  label: string;
  value: number;
  tone?: "default" | "subtotal" | "negative" | "emphasis" | "positive";
  /** Seçili opsiyon / masraf kalemleri (stitch özet). */
  subRows?: CostSummarySubRow[];
};

function rowClass(tone: CostSummaryRow["tone"]) {
  switch (tone) {
    case "subtotal":
      return "bg-blue-50/90 font-bold text-slate-900";
    case "negative":
      return "font-semibold text-red-600";
    case "emphasis":
      return "font-bold text-[#2563eb]";
    default:
      return "text-slate-700";
  }
}

function formatMoney(value: number, amountDecimals?: number) {
  return amountDecimals != null
    ? formatNumber(value, { decimals: amountDecimals })
    : formatNumber(value, { noDecimals: true });
}

function formatStitchAmount(
  value: number,
  tone: CostSummaryRow["tone"],
  amountDecimals?: number,
) {
  const abs = formatMoney(Math.abs(value), amountDecimals);
  if (value < 0 || tone === "negative") {
    return `−${abs}`;
  }
  if (tone === "positive" && value > 0) {
    return `+${abs}`;
  }
  return abs;
}

export function CostDistributionChart(props: {
  segments: { label: string; value: number; color: string }[];
  totalLabel?: string;
  totalValue?: number;
  currencySymbol: "€" | "₺" | "$";
  large?: boolean;
  /** Verilirse tutarlarda bu kadar ondalık (ör. geri hesaplama: 2). */
  amountDecimals?: number;
}) {
  const large = props.large ?? false;
  const segTotal =
    props.segments.reduce((s, x) => s + Math.max(0, x.value), 0) ?? 0;
  const activeSegments = props.segments.filter((s) => s.value > 0);

  let gradient = "conic-gradient(#e2e8f0 0deg 360deg)";
  if (segTotal > 0 && activeSegments.length) {
    let acc = 0;
    const parts = activeSegments.map((seg) => {
      const pct = (Math.max(0, seg.value) / segTotal) * 360;
      const start = acc;
      acc += pct;
      return `${seg.color} ${start}deg ${acc}deg`;
    });
    gradient = `conic-gradient(${parts.join(", ")})`;
  }

  if (activeSegments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <h3
        className={cn(
          "mb-4 w-full text-left font-semibold uppercase tracking-wider text-[#434655]",
          large ? "text-xs md:text-[13px]" : "text-[10px]",
        )}
      >
        Maliyet Dağılımı
      </h3>
      <div className={cn("relative mb-4 max-lg:mb-3", large ? "h-40 w-40 max-lg:h-32 max-lg:w-32" : "h-36 w-36 max-lg:h-32 max-lg:w-32")}>
        <div
          className="relative h-full w-full rounded-full shadow-md ring-4 ring-[#eff4ff]"
          style={{ background: gradient }}
          aria-hidden
        >
          {props.totalValue != null ? (
            <div
              className={cn(
                "absolute flex flex-col items-center justify-center rounded-full bg-white px-2 text-center shadow-inner",
                large ? "inset-[20%]" : "inset-[22%]",
              )}
            >
              <span
                className={cn(
                  "max-w-full font-semibold uppercase leading-tight text-[#565e74]",
                  large ? "text-[11px] tracking-wide" : "text-[10px]",
                )}
              >
                {props.totalLabel ?? "Toplam Ödeme"}
              </span>
              <span
                className={cn(
                  "mt-1 max-w-full font-bold leading-tight tabular-nums text-[#0b1c30]",
                  large ? "text-base sm:text-lg" : "text-base",
                )}
              >
                {formatMoney(props.totalValue, props.amountDecimals)}
              </span>
              <span className={cn("leading-none text-[#565e74]", large ? "text-sm" : "text-xs")}>
                {props.currencySymbol}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "grid w-full grid-cols-1 gap-2 font-semibold text-[#0b1c30] sm:grid-cols-2 sm:gap-3",
          large ? "text-xs leading-snug md:text-sm" : "text-xs",
        )}
      >
        {activeSegments.map((s) => {
          const pct =
            segTotal > 0
              ? Math.round((Math.max(0, s.value) / segTotal) * 100)
              : 0;
          const short =
            s.label.length > 12 ? s.label.replace(/\s*\(.*\)/, "") : s.label;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="truncate">
                {short} (%{pct})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CostSummaryPanel(props: {
  rows: CostSummaryRow[];
  currencySymbol: "€" | "₺" | "$";
  totalLabel?: string;
  totalValue?: number;
  segments?: { label: string; value: number; color: string }[];
  layout?: "side" | "stacked" | "detailed" | "split" | "stitch";
  totalEuro?: number;
  totalTl?: number;
  monthlyInstallment?: number;
  installmentLabel?: string;
  /** Stitch mavi kutu başlığı (geri hesaplama vb.) */
  stitchPrimaryTotalLabel?: string;
  amountDecimals?: number;
  /** Finansman desteği: desteksiz tutar ve fark (sadece stitch). */
  stitchCompare?: {
    baselineLabel: string;
    baselineValue: number;
    deltaLabel: string;
    deltaValue: number;
  };
}) {
  const stitch = props.layout === "stitch";
  const split = props.layout === "split";
  const detailed = props.layout === "detailed";
  const lineRows = stitch
    ? props.rows.filter((r) => r.tone !== "subtotal")
    : props.rows;

  if (stitch) {
    return (
      <div className="llp-cost-panel flex flex-col gap-2 text-[13px] text-[#0b1c30] md:text-sm">
        {lineRows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className={cn(
              "border-[#c3c6d7]/50 pb-1.5",
              index < lineRows.length - 1 ? "border-b" : "",
            )}
          >
            <div className="flex items-end justify-between gap-2">
              <span className="min-w-0 text-xs text-[#434655] md:text-[13px]">
                {row.label}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold tabular-nums md:text-[13px]",
                  row.tone === "negative" || row.value < 0
                    ? "text-red-600"
                    : row.tone === "positive"
                      ? "text-emerald-700"
                      : "",
                )}
              >
                {formatStitchAmount(row.value, row.tone, props.amountDecimals)}{" "}
                {props.currencySymbol}
              </span>
            </div>
            {row.subRows?.map((sub, subIndex) => (
              <div
                key={`${sub.label}-${subIndex}`}
                className="mt-1 flex items-end justify-between gap-2 pl-3"
              >
                <span className="min-w-0 text-[11px] font-medium leading-snug text-[#565e74] md:text-xs">
                  {sub.label}
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#434655] md:text-xs">
                  {formatMoney(sub.value, props.amountDecimals)}{" "}
                  {props.currencySymbol}
                </span>
              </div>
            ))}
          </div>
        ))}
        <div className="llp-cost-total-box mt-1 rounded-lg border border-[#2563eb]/20 bg-[#eff4ff] p-3 max-lg:p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#0b1c30] max-lg:text-xs">
              {props.stitchPrimaryTotalLabel ?? "Toplam (EUR)"}
            </span>
            <span className="text-xl font-bold leading-7 tabular-nums text-[#004ac6] md:text-[22px] max-lg:text-lg max-lg:leading-6">
              {formatMoney(props.totalEuro ?? 0, props.amountDecimals)}{" "}
              {props.currencySymbol}
            </span>
          </div>
          {props.stitchCompare ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#2563eb]/15 pt-2.5 text-xs md:text-[13px]">
              <div className="rounded-md bg-white/70 px-2 py-1.5">
                <p className="font-semibold text-[#565e74]">
                  {props.stitchCompare.baselineLabel}
                </p>
                <p className="mt-0.5 font-bold tabular-nums text-[#434655] line-through decoration-[#8b93a7]/80">
                  {formatMoney(props.stitchCompare.baselineValue, props.amountDecimals)}{" "}
                  {props.currencySymbol}
                </p>
              </div>
              <div className="rounded-md bg-white/70 px-2 py-1.5">
                <p className="font-semibold text-[#565e74]">
                  {props.stitchCompare.deltaLabel}
                </p>
                <p
                  className={cn(
                    "mt-0.5 font-bold tabular-nums",
                    props.stitchCompare.deltaValue >= 0
                      ? "text-emerald-700"
                      : "text-emerald-700",
                  )}
                >
                  {props.stitchCompare.deltaValue >= 0 ? "+" : "−"}
                  {formatMoney(
                    Math.abs(props.stitchCompare.deltaValue),
                    props.amountDecimals,
                  )}{" "}
                  {props.currencySymbol}
                </p>
              </div>
            </div>
          ) : null}
          {props.monthlyInstallment != null ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#565e74] md:text-[13px]">
                {props.installmentLabel ?? "Aylık Taksit:"}
              </span>
              <span className="text-base font-semibold tabular-nums text-[#0b1c30] md:text-lg">
                {formatMoney(props.monthlyInstallment, props.amountDecimals)}{" "}
                {props.currencySymbol}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const segTotal =
    props.segments?.reduce((s, x) => s + Math.max(0, x.value), 0) ?? 0;
  const activeSegments =
    props.segments?.filter((s) => s.value > 0) ?? [];

  let gradient = "conic-gradient(#e2e8f0 0deg 360deg)";
  if (segTotal > 0 && activeSegments.length) {
    let acc = 0;
    const parts = activeSegments.map((seg) => {
      const pct = (Math.max(0, seg.value) / segTotal) * 360;
      const start = acc;
      acc += pct;
      return `${seg.color} ${start}deg ${acc}deg`;
    });
    gradient = `conic-gradient(${parts.join(", ")})`;
  }

  const rowText = split || detailed ? "text-sm" : "text-[11px] sm:text-xs";

  const rowsBlock = (
    <div className={cn("space-y-0.5", split && "min-w-0")}>
      {props.rows.map((row) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg px-2 py-2.5",
            rowText,
            rowClass(row.tone),
            row.tone === "subtotal" && "px-3",
          )}
        >
          <span className="min-w-0 leading-snug">{row.label}</span>
          <span className="shrink-0 tabular-nums font-semibold">
            {row.tone === "negative" ? "−" : ""}
            {formatMoney(Math.abs(row.value), props.amountDecimals)}{" "}
            {props.currencySymbol}
          </span>
        </div>
      ))}
    </div>
  );

  const chart = (
    <CostDistributionChart
      segments={activeSegments}
      totalLabel={props.totalLabel}
      totalValue={props.totalValue}
      currencySymbol={props.currencySymbol}
      amountDecimals={props.amountDecimals}
    />
  );

  if (split) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_min(240px,38%)] lg:items-start">
        {rowsBlock}
        {chart}
      </div>
    );
  }

  if (detailed) {
    return (
      <div className="flex flex-col gap-6">
        {rowsBlock}
        {activeSegments.length > 0 ? (
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-6">
            {chart}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_min(112px,26%)]">
      {rowsBlock}
      {chart}
    </div>
  );
}

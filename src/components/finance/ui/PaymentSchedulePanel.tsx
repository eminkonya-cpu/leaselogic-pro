"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/components/finance/format";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PaymentSchedulePanel(props: {
  schedule: AmortizationRow[];
  currencySymbol: "€" | "₺";
  downPayment?: number;
  interestRatePct?: number;
  periodUnit?: "month" | "year";
  /** Kapalı başlasın; tıklayınca tablo açılır */
  defaultExpanded?: boolean;
  comfortable?: boolean;
  /** Peşinat + taksitler toplamı (Hesaplama özeti ile aynı) */
  totalPayment?: number;
  /** Verilirse tutarlarda bu kadar ondalık (geri hesaplama: 2). */
  amountDecimals?: number;
}) {
  const roomy = props.comfortable ?? false;
  const fmt = (value: number) =>
    props.amountDecimals != null
      ? formatNumber(value, { decimals: props.amountDecimals })
      : formatNumber(value, { noDecimals: true });
  const [expanded, setExpanded] = useState(props.defaultExpanded ?? false);
  const periodLabel = props.periodUnit === "year" ? "Yıl" : "Ay";
  const periodShort = props.periodUnit === "year" ? "yıl" : "ay";
  const hasDown = (props.downPayment ?? 0) > 0;
  const rowCount = props.schedule.length + (hasDown ? 1 : 0);
  const typicalPayment = props.schedule[0]?.payment;

  const totalPayment = useMemo(() => {
    if (props.totalPayment != null && Number.isFinite(props.totalPayment)) {
      return props.totalPayment;
    }
    const installments = props.schedule.reduce((sum, r) => sum + r.payment, 0);
    return installments + (props.downPayment ?? 0);
  }, [props.downPayment, props.schedule, props.totalPayment]);

  const cell = roomy ? "text-[15px] sm:text-base" : "text-[10px] sm:text-[11px]";
  const head = roomy ? "text-sm font-bold sm:text-base" : "text-[10px] font-bold";

  return (
    <div className="overflow-hidden rounded-xl border border-[#c3c6d7] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-3 text-left transition-colors hover:bg-[#eff4ff]/60",
          roomy ? "px-4 py-4 sm:px-5" : "px-3 py-2.5 sm:px-4 sm:py-3",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3
              className={cn(
                "font-bold text-[#0b1c30]",
                roomy ? "text-base" : "text-sm",
              )}
            >
              Ödeme Planı
            </h3>
            {!expanded ? (
              <span
                className={cn(
                  "font-semibold text-[#565e74]",
                  roomy ? "text-sm" : "text-[10px] text-slate-400",
                )}
              >
                · Detayı göster
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-1 font-medium leading-snug text-[#434655]",
              roomy ? "text-sm" : "mt-0.5 text-[10px] text-slate-500 sm:text-[11px]",
            )}
          >
            {rowCount} satır · %{formatNumber(props.interestRatePct ?? 0, { decimals: 1 })}{" "}
            faiz
            {!expanded && typicalPayment != null && props.schedule.length > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums font-semibold text-[#0b1c30]">
                  {fmt(typicalPayment)}{" "}
                  {props.currencySymbol}/{periodShort}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border border-[#c3c6d7] bg-[#eff4ff] text-[#565e74]",
            roomy ? "h-10 w-10" : "h-8 w-8 bg-slate-50 text-slate-600",
            expanded && "border-blue-200 bg-blue-50 text-[#004ac6]",
          )}
          aria-hidden
        >
          {expanded ? (
            <ChevronUp className={roomy ? "h-5 w-5" : "h-4 w-4"} />
          ) : (
            <ChevronDown className={roomy ? "h-5 w-5" : "h-4 w-4"} />
          )}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[#c3c6d7]/60">
          <div className="max-h-[min(280px,45vh)] overflow-auto overscroll-contain">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#eff4ff]/95 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn("h-9 px-3", head)}>{periodLabel}</TableHead>
                  <TableHead className={cn("h-9 px-3 text-right", head)}>
                    Taksit
                  </TableHead>
                  <TableHead className={cn("hidden h-9 px-3 text-right sm:table-cell", head)}>
                    Anapara
                  </TableHead>
                  <TableHead className={cn("hidden h-9 px-3 text-right md:table-cell", head)}>
                    Faiz
                  </TableHead>
                  <TableHead className={cn("h-9 px-3 text-right", head)}>
                    Kalan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasDown ? (
                  <TableRow className="hover:bg-blue-50/40">
                    <TableCell className={cn("px-3 py-2 font-semibold", cell)}>0</TableCell>
                    <TableCell className={cn("px-3 py-2 text-right tabular-nums", cell)}>
                      {fmt(props.downPayment ?? 0)}{" "}
                      {props.currencySymbol}
                    </TableCell>
                    <TableCell className={cn("hidden px-3 py-2 text-right sm:table-cell", cell)}>
                      0
                    </TableCell>
                    <TableCell className={cn("hidden px-3 py-2 text-right md:table-cell", cell)}>
                      0
                    </TableCell>
                    <TableCell className={cn("px-3 py-2 text-right", cell)}>—</TableCell>
                  </TableRow>
                ) : null}
                {props.schedule.map((r) => (
                  <TableRow key={r.month} className="hover:bg-blue-50/40">
                    <TableCell className={cn("px-3 py-2 font-medium", cell)}>
                      {r.month}
                    </TableCell>
                    <TableCell className={cn("px-3 py-2 text-right tabular-nums", cell)}>
                      {fmt(r.payment)}{" "}
                      {props.currencySymbol}
                    </TableCell>
                    <TableCell className={cn("hidden px-3 py-2 text-right tabular-nums sm:table-cell", cell)}>
                      {fmt(r.principal)}
                    </TableCell>
                    <TableCell className={cn("hidden px-3 py-2 text-right tabular-nums md:table-cell", cell)}>
                      {fmt(r.interest)}
                    </TableCell>
                    <TableCell className={cn("px-3 py-2 text-right tabular-nums", cell)}>
                      {fmt(r.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-[#c3c6d7] bg-[#eff4ff]/80 hover:bg-[#eff4ff]/80">
                  <TableCell
                    colSpan={2}
                    className={cn(
                      "px-3 py-2.5 font-extrabold text-[#0b1c30]",
                      cell,
                    )}
                  >
                    Toplam tutar
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums font-extrabold text-[#004ac6]",
                      cell,
                    )}
                  >
                    {fmt(totalPayment)}{" "}
                    {props.currencySymbol}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

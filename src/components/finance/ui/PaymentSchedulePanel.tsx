"use client";

import { useMemo } from "react";
import { formatInterestRate, formatNumber } from "@/components/finance/format";
import type { AmortizationRow } from "@/lib/financeCalculations";

export default function PaymentSchedulePanel(props: {
  schedule: AmortizationRow[];
  currencySymbol: "€" | "₺";
  downPayment?: number;
  interestRatePct?: number;
  periodUnit?: "month" | "year";
  /** Eski API; plan her zaman açık gösterilir. */
  defaultExpanded?: boolean;
  comfortable?: boolean;
  /** Peşinat + taksitler toplamı (Hesaplama özeti ile aynı) */
  totalPayment?: number;
  /** Verilirse tutarlarda bu kadar ondalık (geri hesaplama: 2). */
  amountDecimals?: number;
}) {
  const fmt = (value: number) =>
    props.amountDecimals != null
      ? formatNumber(value, { decimals: props.amountDecimals })
      : formatNumber(value, { noDecimals: true });
  const periodLabel = props.periodUnit === "year" ? "Yıl" : "Ay";
  const periodShort = props.periodUnit === "year" ? "yıl" : "ay";
  const hasDown = (props.downPayment ?? 0) > 0;
  const rowCount = props.schedule.length + (hasDown ? 1 : 0);
  const lastBalance = props.schedule.at(-1)?.balance ?? 0;
  const columnTotals = useMemo(
    () =>
      props.schedule.reduce(
        (acc, r) => ({
          payment: acc.payment + r.payment,
        }),
        { payment: 0 },
      ),
    [props.schedule],
  );
  const totalPayment = useMemo(() => {
    if (props.totalPayment != null && Number.isFinite(props.totalPayment)) {
      return props.totalPayment;
    }
    return columnTotals.payment + (props.downPayment ?? 0);
  }, [columnTotals.payment, props.downPayment, props.totalPayment]);

  return (
    <section className="no-print rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E2E8F0] px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">Ödeme planı</h3>
          <p className="mt-0.5 text-xs text-[#64748B]">
            {rowCount} {periodShort} · %
            {formatInterestRate(props.interestRatePct ?? 0)} faiz
            {hasDown
              ? ` · Peşinat ${fmt(props.downPayment ?? 0)} ${props.currencySymbol}`
              : null}
          </p>
        </div>
      </div>

      <div className="max-h-[min(560px,65vh)] overflow-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            <tr>
              <th scope="col" className="px-3 py-2 md:px-4">
                {periodLabel}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Taksit
              </th>
              <th scope="col" className="px-3 py-2 text-right md:px-4">
                Kalan borç
              </th>
            </tr>
          </thead>
          <tbody>
            {hasDown ? (
              <tr className="border-t border-[#F1F5F9] bg-[#F8FAFC]">
                <td className="px-3 py-1.5 font-semibold tabular-nums text-[#020617] md:px-4">
                  0
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#0F172A]">
                  {fmt(props.downPayment ?? 0)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-[#475569] md:px-4">
                  —
                </td>
              </tr>
            ) : null}
            {props.schedule.map((r) => (
              <tr
                key={r.month}
                className="border-t border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] motion-reduce:transition-none"
              >
                <td className="px-3 py-1.5 font-semibold tabular-nums text-[#020617] md:px-4">
                  {r.month}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#0F172A]">
                  {fmt(r.payment)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-[#475569] md:px-4">
                  {fmt(r.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-white text-sm font-semibold text-[#0F172A] shadow-[0_-1px_0_#E2E8F0]">
            <tr>
              <th scope="row" className="px-3 py-2 text-left md:px-4">
                Toplam
              </th>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {fmt(totalPayment)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums md:px-4">
                {fmt(lastBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="border-t border-[#E2E8F0] px-3 py-2.5 text-xs text-[#64748B] md:px-4">
        Tutarlar {props.currencySymbol} cinsindendir. KDV hariçtir.
      </p>
    </section>
  );
}

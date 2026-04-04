"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AmortizationRow } from "@/lib/financeCalculations";
import { formatNumber } from "./format";

export default function AmortizationTable(props: {
  schedule: AmortizationRow[];
  currency: string;
  downPayment?: number;
  interestRatePct?: number;
  /** Yıllık taksit planında ilk sütun "Yıl" ve satır sayısı yıl adedidir. */
  periodUnit?: "month" | "year";
}) {
  const periodUnit = props.periodUnit ?? "month";
  const periodLabel = periodUnit === "year" ? "Yıl" : "Ay";
  const periodSuffix =
    periodUnit === "year" ? "yıllık taksit" : "taksit";
  return (
    <Card className="overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur">
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white lg:px-3 lg:pb-3.5 lg:pt-4">
        <CardTitle className="w-full text-center text-[11px] font-extrabold leading-snug tracking-tight text-white lg:text-sm">
          Ödeme Planı ({props.currency}) — %
          {formatNumber(props.interestRatePct ?? 0, { decimals: 1 })} Faiz —{" "}
          {props.schedule.length} {periodSuffix}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2.5 lg:pt-4">
        <div className="max-h-[340px] overflow-auto rounded-md border border-slate-200">
          <Table className="text-[11px] lg:text-sm">
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[52px] px-2 py-2 font-bold lg:w-[60px]">{periodLabel}</TableHead>
                <TableHead className="px-2 py-2 text-right font-bold">Taksit</TableHead>
                <TableHead className="px-2 py-2 text-right font-bold">Faiz</TableHead>
                <TableHead className="px-2 py-2 text-right font-bold">Anapara</TableHead>
                <TableHead className="px-2 py-2 text-right font-bold">Kalan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(props.downPayment ?? 0) > 0 && (
                <TableRow>
                  <TableCell className="px-2 py-2 font-bold">0</TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums font-bold">
                    {formatNumber(props.downPayment ?? 0)} {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    0 {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    0 {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">-</TableCell>
                </TableRow>
              )}
              {props.schedule.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="px-2 py-2 font-bold">{r.month}</TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {formatNumber(r.payment)} {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {formatNumber(r.interest)} {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {formatNumber(r.principal)} {props.currency}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {formatNumber(r.balance)} {props.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-600 lg:text-[11px]">
          Bu ödeme planı ön bilgilendirme amaçlıdır, bağlayıcı değildir. Kasko ve diğer
          masraf kalemlerine vade farkı yansıyabileceğinden küçük ilave tutarlar
          oluşabilir.
        </div>
      </CardContent>
    </Card>
  );
}

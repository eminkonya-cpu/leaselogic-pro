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
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-3 pb-3.5 pt-4 text-white">
        <CardTitle className="w-full text-center text-[13px] font-extrabold leading-snug tracking-tight text-white sm:text-sm">
          Ödeme Planı ({props.currency}) — %
          {formatNumber(props.interestRatePct ?? 0, { decimals: 1 })} Faiz —{" "}
          {props.schedule.length} {periodSuffix}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="max-h-[340px] overflow-auto rounded-md border border-slate-200">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[60px] font-bold">{periodLabel}</TableHead>
                <TableHead className="text-right font-bold">Taksit</TableHead>
                <TableHead className="text-right font-bold">Faiz</TableHead>
                <TableHead className="text-right font-bold">Anapara</TableHead>
                <TableHead className="text-right font-bold">Kalan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(props.downPayment ?? 0) > 0 && (
                <TableRow>
                  <TableCell className="font-bold">0</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">
                    {formatNumber(props.downPayment ?? 0)} {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    0 {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    0 {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">-</TableCell>
                </TableRow>
              )}
              {props.schedule.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-bold">{r.month}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.payment)} {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.interest)} {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.principal)} {props.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.balance)} {props.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-600">
          Bu ödeme planı ön bilgilendirme amaçlıdır, bağlayıcı değildir. Kasko ve diğer
          masraf kalemlerine vade farkı yansıyabileceğinden küçük ilave tutarlar
          oluşabilir.
        </div>
      </CardContent>
    </Card>
  );
}

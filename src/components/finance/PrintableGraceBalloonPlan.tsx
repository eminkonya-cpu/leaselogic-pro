"use client";

import { formatNumber } from "@/components/finance/format";
const DOCUMENT_TITLE = "3 Ay Ödemesiz & Balon Hesaplama";
import PreviewDocumentActions from "@/components/finance/PreviewDocumentActions";
import type {
  LeasingPlanRow,
  LeasingPlanSummary,
  PaymentMonthMode,
} from "@/lib/leasingPaymentPlan";
import { financePdfFileName } from "@/lib/saveFinanceDocumentPdf";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

export type PrintableGraceBalloonProps = {
  direction: "forward" | "reverse";
  firma?: string;
  makine?: string;
  currency: string;
  symbol: string;
  machinePrice: number;
  downPayment: number;
  financingSupport: number;
  annualRatePct: number;
  termMonths: number;
  startDate: string;
  summary: LeasingPlanSummary;
  rows: LeasingPlanRow[];
  extraLines: { label: string; amount: number; modeLabel: string }[];
};

function modeLabel(mode: PaymentMonthMode) {
  return mode === "grace" ? "Ödemesiz" : "Ödemeli";
}

function fmt(v: number) {
  return formatNumber(v, { decimals: 2 });
}

export function PrintableGraceBalloonContent(
  props: PrintableGraceBalloonProps & { className?: string },
) {
  const { summary, rows, symbol } = props;
  return (
    <div
      id="pdf-print-area"
      className={cn(
        "text-[#0b1c30] print:text-[12px]",
        props.className,
      )}
    >
      <div className="border-b-2 border-[#004ac6] pb-2 print:pb-1.5">
        <h1 className="text-lg font-extrabold tracking-tight print:text-[17px]">
          {DOCUMENT_TITLE}
        </h1>
        <p className="mt-0.5 text-xs text-slate-600 print:text-[10px]">
          Ödeme planı · {props.direction === "reverse" ? "Geri hesaplama" : "İleri hesaplama"} ·{" "}
          {new Date().toLocaleDateString("tr-TR")}
        </p>
      </div>

      {props.firma || props.makine ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 print:mt-2 print:py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">
            Müşteri
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[10px]">
            {props.firma ? (
              <>
                <div className="text-slate-600">Firma</div>
                <div className="text-right font-bold">{props.firma}</div>
              </>
            ) : null}
            {props.makine ? (
              <>
                <div className="text-slate-600">Makine modeli</div>
                <div className="text-right font-bold">{props.makine}</div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:mt-2 print:gap-y-0.5 print:text-[10px]">
        <div className="text-slate-600">Makine bedeli</div>
        <div className="text-right font-bold tabular-nums">
          {fmt(props.machinePrice)} {symbol}
        </div>
        <div className="text-slate-600">Peşinat</div>
        <div className="text-right tabular-nums">{fmt(props.downPayment)} {symbol}</div>
        {props.financingSupport > 0 ? (
          <>
            <div className="text-slate-600">Finansman desteği</div>
            <div className="text-right tabular-nums">
              {fmt(props.financingSupport)} {symbol}
            </div>
          </>
        ) : null}
        <div className="text-slate-600">Yıllık nominal faiz</div>
        <div className="text-right tabular-nums">%{fmt(props.annualRatePct)}</div>
        <div className="text-slate-600">Vade</div>
        <div className="text-right font-bold">{props.termMonths} ay</div>
        <div className="text-slate-600">Finansman başlangıcı</div>
        <div className="text-right">{props.startDate}</div>
        <div className="text-slate-600">Para birimi</div>
        <div className="text-right font-bold">{props.currency}</div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2.5 print:mt-2 print:p-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs print:text-[10px]">
          <div className="text-slate-600">Eşit taksit</div>
          <div className="text-right font-bold tabular-nums">
            {fmt(summary.equalNormalInstallment)} {symbol}
          </div>
          {summary.totalBalloon > 0 ? (
            <>
              <div className="text-slate-600">Toplam balon</div>
              <div className="text-right font-bold tabular-nums">
                {fmt(summary.totalBalloon)} {symbol}
              </div>
            </>
          ) : null}
          <div className="col-span-2 mt-1 border-t border-slate-300 pt-2 font-extrabold print:text-[11px]">
            <div className="flex justify-between gap-3">
              <span>Müşterinin toplam ödemesi</span>
              <span className="tabular-nums">
                {fmt(summary.customerTotalPayment)} {symbol}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-300 print:mt-2">
        <div className="border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-sm font-extrabold print:py-1 print:text-[11px]">
          Ödeme planı
        </div>
        <table className="w-full text-xs print:text-[11px]">
          <thead className="bg-slate-50">
            <tr className="border-b font-bold">
              <th className="px-1.5 py-1 text-left">Ay</th>
              <th className="px-1.5 py-1 text-left">Tarih</th>
              <th className="px-1.5 py-1 text-left">Durum</th>
              <th className="px-1.5 py-1 text-right">Taksit</th>
              <th className="px-1.5 py-1 text-right">Balon</th>
              <th className="px-1.5 py-1 text-right">Kalan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-b border-slate-100">
                <td className="px-1.5 py-0.5 font-medium">{r.month}</td>
                <td className="px-1.5 py-0.5 tabular-nums">{r.paymentDate ?? "—"}</td>
                <td className="px-1.5 py-0.5">{modeLabel(r.mode)}</td>
                <td className="px-1.5 py-0.5 text-right tabular-nums">
                  {fmt(r.normalInstallment)}
                </td>
                <td className="px-1.5 py-0.5 text-right tabular-nums">
                  {fmt(r.balloonPayment)}
                </td>
                <td className="px-1.5 py-0.5 text-right tabular-nums">
                  {fmt(r.closingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-0.5 text-[10px] text-slate-600 print:mt-2">
        <p>Tüm tutarlar KDV ve devir bedeli hariçtir.</p>
        <p>Bu plan bilgilendirme amaçlıdır; leasing şirketi onayı ile değişebilir.</p>
        <p>İlk üç ay varsayılan ödemesizdir; tabloda değiştirilen aylar geçerlidir.</p>
      </div>
    </div>
  );
}

export function PrintableGraceBalloonPreviewModal(
  props: PrintableGraceBalloonProps & {
    open: boolean;
    onClose: () => void;
    onPrint?: () => void;
  },
) {
  if (!props.open || typeof document === "undefined") return null;

  return createPortal(
    <div className="finance-print-portal fixed inset-0 z-[9999] overflow-auto bg-[#5b616a] p-3 sm:p-4">
      <PreviewDocumentActions
        fileName={financePdfFileName(props.firma)}
        onClose={props.onClose}
      />
      <div className="finance-print-portal-sheet mx-auto w-full max-w-[210mm]">
        <div className="min-h-[calc(100vh-6rem)] bg-white shadow-lg print:min-h-0 print:h-auto print:shadow-none">
          <PrintableGraceBalloonContent
            {...props}
            className="w-full p-4 md:p-[10mm]"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function PrintableGraceBalloonPlan(props: PrintableGraceBalloonProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <PrintableGraceBalloonContent
      {...props}
      className="llp-print-sheet hidden print:bg-white print:px-3 print:pb-2 print:pt-0"
    />,
    document.body,
  );
}

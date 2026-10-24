"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type ReportTone = "default" | "positive" | "negative" | "muted";

const toneText: Record<ReportTone, string> = {
  default: "text-[#0f172a]",
  positive: "text-[#0f766e]",
  negative: "text-[#b42318]",
  muted: "text-[#64748b]",
};

function formatReportDate(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ReportDocument(props: {
  title: string;
  kind: string;
  tags: string[];
  className?: string;
  children: ReactNode;
  footnote?: string;
}) {
  const today = formatReportDate(new Date());

  return (
    <div
      id="pdf-print-area"
      className={cn(
        "pdf-print-root llp-report bg-white text-[#0f172a]",
        props.className,
      )}
    >
      <header className="flex items-stretch justify-between gap-4 border-b-2 border-[#0f172a] pb-3 print:pb-2">
        <div className="flex min-w-0 gap-3">
          <div className="w-1.5 shrink-0 rounded-full bg-[#0f766e]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f766e] print:text-[8px]">
              {props.kind}
            </p>
            <h1 className="mt-0.5 font-serif text-xl font-bold leading-tight tracking-tight text-[#0f172a] print:text-[16px]">
              {props.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {props.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[#cbd5e1] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569] print:text-[8px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right text-[11px] font-medium leading-relaxed text-[#475569] print:text-[9px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] print:text-[8px]">
            Rapor tarihi
          </p>
          <p className="font-semibold text-[#0f172a]">{today}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] print:text-[8px]">
            Gizlilik
          </p>
          <p className="font-semibold text-[#0f172a]">Yönetim / iç kullanım</p>
        </div>
      </header>

      <div className="mt-4 space-y-4 print:mt-2.5 print:space-y-2.5">
        {props.children}
      </div>

      <footer className="mt-6 break-inside-avoid print:mt-4">
        <div className="grid grid-cols-3 gap-4 print:gap-3">
          {["Hazırlayan", "Kontrol eden", "Onaylayan"].map((role) => (
            <div key={role} className="border-t border-[#94a3b8] pt-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b] print:text-[8px]">
                {role}
              </p>
              <div className="h-8 print:h-6" />
            </div>
          ))}
        </div>
        {props.footnote ? (
          <p className="mt-3 text-[11px] font-medium leading-snug text-[#64748b] print:mt-2 print:text-[8.5px]">
            {props.footnote}
          </p>
        ) : null}
      </footer>
    </div>
  );
}

export type ReportMetric = {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
};

export function ReportMetricStrip(props: { items: ReportMetric[] }) {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-lg border border-[#cbd5e1] bg-[#cbd5e1] break-inside-avoid"
      style={{ gridTemplateColumns: `repeat(${props.items.length}, minmax(0, 1fr))` }}
    >
      {props.items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "px-3 py-2.5 print:px-2 print:py-1.5",
            item.emphasis ? "bg-[#0f172a] text-white" : "bg-white",
          )}
        >
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.1em] print:text-[7.5px]",
              item.emphasis ? "text-[#99f6e4]" : "text-[#64748b]",
            )}
          >
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 text-[15px] font-bold tabular-nums leading-tight tracking-tight print:text-[11.5px]",
              item.emphasis ? "text-white" : "text-[#0f172a]",
            )}
          >
            {item.value}
          </p>
          {item.sub ? (
            <p
              className={cn(
                "mt-0.5 text-[10px] font-medium leading-snug print:text-[7.5px]",
                item.emphasis ? "text-[#cbd5e1]" : "text-[#64748b]",
              )}
            >
              {item.sub}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ReportSection(props: {
  index: number;
  title: string;
  aside?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("break-inside-avoid", props.className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 border-b border-[#e2e8f0] pb-1">
        <h2 className="flex items-baseline gap-2 text-[13px] font-bold text-[#0f172a] print:text-[10.5px]">
          <span className="tabular-nums text-[11px] font-bold text-[#0f766e] print:text-[9px]">
            {String(props.index).padStart(2, "0")}
          </span>
          {props.title}
        </h2>
        {props.aside ? (
          <span className="text-[10px] font-semibold text-[#94a3b8] print:text-[8px]">
            {props.aside}
          </span>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

export type ReportKeyValue = { label: string; value: string };

export function ReportKeyValues(props: { items: ReportKeyValue[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 text-[12.5px] print:gap-x-6 print:text-[9.5px]">
      {props.items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-3 border-b border-dotted border-[#e2e8f0] py-1.5 print:py-1"
        >
          <dt className="min-w-0 font-medium text-[#64748b]">{item.label}</dt>
          <dd className="shrink-0 text-right font-semibold tabular-nums text-[#0f172a]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type ReportLine = {
  label: string;
  value: string;
  tone?: ReportTone;
  strong?: boolean;
  indent?: boolean;
  note?: string;
};

export function ReportLineTable(props: {
  head?: [string, string];
  lines: ReportLine[];
  emptyText?: string;
  totals?: ReportLine[];
}) {
  return (
    <table className="w-full border-collapse text-[12.5px] print:text-[9.5px]">
      {props.head ? (
        <thead>
          <tr className="bg-[#f1f5f9] text-left">
            <th className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748b] print:py-1 print:text-[7.5px]">
              {props.head[0]}
            </th>
            <th className="px-2.5 py-1.5 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748b] print:py-1 print:text-[7.5px]">
              {props.head[1]}
            </th>
          </tr>
        </thead>
      ) : null}
      <tbody>
        {props.lines.length === 0 ? (
          <tr>
            <td colSpan={2} className="px-2.5 py-2 text-[#94a3b8]">
              {props.emptyText ?? "Kalem yok."}
            </td>
          </tr>
        ) : (
          props.lines.map((line, i) => (
            <tr
              key={`${line.label}-${i}`}
              className="border-b border-[#f1f5f9] last:border-b-0"
            >
              <td
                className={cn(
                  "px-2.5 py-1.5 align-top print:py-1",
                  line.indent && "pl-6",
                  line.strong ? "font-bold text-[#0f172a]" : "font-medium text-[#334155]",
                )}
              >
                {line.label}
                {line.note ? (
                  <span className="ml-1 font-medium text-[#94a3b8]">{line.note}</span>
                ) : null}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-2.5 py-1.5 text-right align-top tabular-nums print:py-1",
                  line.strong ? "font-bold" : "font-semibold",
                  toneText[line.tone ?? "default"],
                )}
              >
                {line.value}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {props.totals?.length ? (
        <tfoot>
          {props.totals.map((line, i) => (
            <tr
              key={`${line.label}-${i}`}
              className={cn(
                i === 0 ? "border-t-2 border-[#0f172a]" : "border-t border-dashed border-[#cbd5e1]",
              )}
            >
              <td
                className={cn(
                  "px-2.5 py-1.5 print:py-1",
                  line.strong ? "font-bold text-[#0f172a]" : "font-semibold text-[#334155]",
                )}
              >
                {line.label}
                {line.note ? (
                  <span className="ml-1 font-medium text-[#94a3b8]">{line.note}</span>
                ) : null}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-2.5 py-1.5 text-right font-bold tabular-nums print:py-1",
                  toneText[line.tone ?? "default"],
                )}
              >
                {line.value}
              </td>
            </tr>
          ))}
        </tfoot>
      ) : null}
    </table>
  );
}

export function ReportResult(props: {
  label: string;
  value: string;
  lines?: ReportLine[];
  note?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#0f172a] break-inside-avoid">
      {props.lines?.length ? (
        <div className="space-y-1 bg-[#f8fafc] px-3.5 py-2.5 text-[12.5px] print:px-2.5 print:py-1.5 print:text-[9.5px]">
          {props.lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-[#475569]">{line.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  toneText[line.tone ?? "default"],
                )}
              >
                {line.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4 bg-[#0f172a] px-3.5 py-3 text-white print:px-2.5 print:py-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#99f6e4] print:text-[9px]">
          {props.label}
        </span>
        <span className="text-2xl font-bold tabular-nums tracking-tight print:text-[17px]">
          {props.value}
        </span>
      </div>
      {props.note ? (
        <p className="bg-[#f8fafc] px-3.5 py-1.5 text-[11px] font-medium text-[#64748b] print:px-2.5 print:text-[8.5px]">
          {props.note}
        </p>
      ) : null}
    </div>
  );
}

export function ReportSupportCompare(props: {
  baselineLabel: string;
  baselineValue: number;
  supportedLabel: string;
  supportedValue: number;
  deltaLabel: string;
  deltaText: string;
  format: (v: number) => string;
}) {
  const max = Math.max(props.baselineValue, props.supportedValue, 1);
  const bars = [
    {
      label: props.baselineLabel,
      value: props.baselineValue,
      color: "bg-[#94a3b8]",
      text: "text-[#475569]",
    },
    {
      label: props.supportedLabel,
      value: props.supportedValue,
      color: "bg-[#0f766e]",
      text: "text-[#0f172a]",
    },
  ];

  return (
    <div className="rounded-lg border border-[#cbd5e1] p-3 break-inside-avoid print:p-2">
      <div className="space-y-2 print:space-y-1.5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-baseline justify-between gap-3 text-[12px] print:text-[9.5px]">
              <span className="font-medium text-[#475569]">{bar.label}</span>
              <span className={cn("font-bold tabular-nums", bar.text)}>
                {props.format(bar.value)}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#f1f5f9] print:h-1.5">
              <div
                className={cn("h-full rounded-full", bar.color)}
                style={{ width: `${Math.max(2, (bar.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-md bg-[#f0fdfa] px-2.5 py-1.5 text-[12px] print:mt-1.5 print:text-[9.5px]">
        <span className="font-semibold text-[#115e59]">{props.deltaLabel}</span>
        <span className="font-bold tabular-nums text-[#0f766e]">{props.deltaText}</span>
      </div>
    </div>
  );
}

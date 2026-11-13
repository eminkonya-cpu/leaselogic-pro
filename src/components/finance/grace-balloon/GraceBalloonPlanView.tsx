"use client";

import DecimalTextInput from "@/components/finance/DecimalTextInput";
import { FinanceDocumentPreviewModal } from "@/components/finance/FinanceDocumentPreviewModal";
import PlanExtraCostPanel from "@/components/finance/PlanExtraCostPanel";
import GraceBalloonOptionChips from "@/components/finance/grace-balloon/GraceBalloonOptionChips";
import PrintableGraceBalloonPlan, {
  PrintableGraceBalloonPreviewModal,
} from "@/components/finance/PrintableGraceBalloonPlan";
import { formatNumber } from "@/components/finance/format";
import CostSummaryPanel from "@/components/finance/ui/CostSummaryPanel";
import { Input } from "@/components/ui/input";
import type { PaymentMonthMode } from "@/lib/leasingPaymentPlan";
import { cn } from "@/lib/utils";
import CalcPageHeader from "@/components/finance/ui/CalcPageHeader";
import {
  CALC_CHIP_BASE_CLS,
  CALC_CHIP_GROUP_CLS,
  CALC_FOCUS_RING,
  CALC_INPUT_CLS,
  CALC_PANEL_CLS,
  calcChipStateCls,
  FormField,
  FormStep,
  ResultKpiBand,
  type ResultKpiItem,
} from "@/components/finance/ui/CalcFormChrome";
import {
  AlertTriangle,
  Calculator,
  Eraser,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { IBM_Plex_Sans } from "next/font/google";
import { useMemo, type ReactNode } from "react";

const plex = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
import {
  DEFAULT_GRACE_MONTHS,
  useGraceBalloonPlan,
  type GraceBalloonPlan,
} from "./useGraceBalloonPlan";

const focusRing = CALC_FOCUS_RING;
const inputCls = CALC_INPUT_CLS;

export const GRACE_BALLOON_MODULE_TITLE = "3 Ay Ödemesiz & Balon Hesaplama";

export default function GraceBalloonPlanView() {
  const plan = useGraceBalloonPlan();
  const fmt = (v: number) => formatNumber(v, { decimals: 2 });

  return (
    <div
      className={cn(
        plex.className,
        "mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-3 rounded-2xl bg-[#F8FAFC] p-3 text-[#020617] ring-1 ring-[#E2E8F0] md:p-4 [&>*]:min-w-0",
      )}
    >
      <PageHeader plan={plan} />
      <ResultBand plan={plan} fmt={fmt} />

      <div className="grid gap-3 lg:grid-cols-12 lg:items-start [&>*]:min-w-0">
        <InputsCard plan={plan} />
        <SummaryCard plan={plan} />
      </div>

      {plan.ok ? <ScheduleCard plan={plan} fmt={fmt} /> : null}

      {plan.printProps && !plan.summaryReportOpen && !plan.printPreviewOpen ? (
        <PrintableGraceBalloonPlan {...plan.printProps} />
      ) : null}
      {plan.printProps ? (
        <PrintableGraceBalloonPreviewModal
          {...plan.printProps}
          open={plan.printPreviewOpen}
          onClose={() => plan.setPrintPreviewOpen(false)}
        />
      ) : null}
      <FinanceDocumentPreviewModal
        open={plan.summaryReportOpen}
        onClose={() => plan.setSummaryReportOpen(false)}
        variant="grace-balloon-summary"
        graceBalloonSummary={plan.graceBalloonSummary ?? undefined}
      />
    </div>
  );
}

/* ——— Üst başlık ——— */

function PageHeader({ plan }: { plan: GraceBalloonPlan }) {
  return (
    <CalcPageHeader
      kicker="Leasing · Ödeme planı"
      title={GRACE_BALLOON_MODULE_TITLE}
      description={`İlk ${DEFAULT_GRACE_MONTHS} ay varsayılan ödemesiz. Ay bazında ödemesiz ay ve balon seçebilir, ek maliyetleri peşin ya da plana dahil ödetebilirsiniz.`}
      extra={
        <div
          className={CALC_CHIP_GROUP_CLS}
          role="group"
          aria-label="Hesaplama yönü"
        >
          <DirectionButton
            active={plan.direction === "forward"}
            onClick={() => plan.setDirection("forward")}
            icon={<Calculator className="h-4 w-4" aria-hidden />}
          >
            İleri hesaplama
          </DirectionButton>
          <DirectionButton
            active={plan.direction === "reverse"}
            onClick={() => plan.setDirection("reverse")}
            icon={<Undo2 className="h-4 w-4" aria-hidden />}
          >
            Geri hesaplama
          </DirectionButton>
        </div>
      }
      onSummary={() => plan.setSummaryReportOpen(true)}
      onPaymentPlan={plan.handleCreatePaymentPlan}
      summaryDisabled={!plan.ok}
      planDisabled={!plan.ok}
      summaryActionAttr="open-summary"
    />
  );
}

function DirectionButton(props: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={cn(
        CALC_CHIP_BASE_CLS,
        "inline-flex h-8 items-center gap-2 px-2.5 text-[13px]",
        focusRing,
        calcChipStateCls(props.active),
      )}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

/* ——— Sonuç bandı ——— */

function ResultBand({ plan, fmt }: { plan: GraceBalloonPlan; fmt: (v: number) => string }) {
  if (!plan.ok) {
    return (
      <section
        aria-live="polite"
        className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-amber-900">Hesap henüz tamamlanmadı</p>
          <p className="mt-0.5 text-sm text-amber-900/90">{plan.summary.message}</p>
        </div>
      </section>
    );
  }

  const { summary, sym } = plan;
  const machineLabel = plan.direction === "reverse" ? "Bulunan makine bedeli" : "Makine bedeli";
  const machineValue =
    plan.direction === "reverse" ? (plan.solvedMachine ?? 0) : plan.state.machinePrice;

  const stats: ResultKpiItem[] = [
    { label: "Vade farkı", value: `${fmt(plan.displayFinanceInterest)} ${sym}` },
    { label: "Aylık taksit", value: `${fmt(summary.equalNormalInstallment)} ${sym}` },
    {
      label: plan.direction === "reverse" ? "Müşteri toplam ödemesi" : machineLabel,
      value: `${fmt(plan.direction === "reverse" ? summary.customerTotalPayment : machineValue)} ${sym}`,
    },
    {
      label: "Plan",
      value: `${plan.state.termMonths} ay`,
      sub: `${plan.graceMonthCount} ödemesiz · ${summary.payingMonthCount} ödemeli`,
    },
  ];

  const balloonBadge =
    summary.totalBalloon > 0.005
      ? {
          label:
            plan.balloonMonthCount > 1
              ? `${plan.balloonMonthCount} balon`
              : "Balon",
          value: `${fmt(summary.totalBalloon)} ${sym}`,
        }
      : undefined;

  const kpis: ResultKpiItem[] = [
    {
      label: plan.stitchPrimaryTotalLabel,
      value: `${fmt(plan.stitchPrimaryTotal)} ${sym}`,
      sub:
        plan.state.firma.trim() || plan.state.makine.trim()
          ? [plan.state.firma.trim(), plan.state.makine.trim()].filter(Boolean).join(" · ")
          : plan.supportCompare
            ? `${plan.supportCompare.deltaLabel}: ${plan.supportCompare.deltaValue >= 0 ? "+" : "−"}${fmt(Math.abs(plan.supportCompare.deltaValue))} ${sym}`
            : undefined,
      hero: true,
      badge: balloonBadge,
    },
    ...stats,
  ];

  return <ResultKpiBand items={kpis} />;
}

/* ——— Girişler ——— */

function InputsCard({ plan }: { plan: GraceBalloonPlan }) {
  const { state, setField } = plan;

  return (
    <section className={cn(CALC_PANEL_CLS, "lg:col-span-7")}>
      <h3 className="sr-only">Girişler</h3>

      <FormStep index={1} title="Müşteri">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Firma">
            {(id) => (
              <Input
                id={id}
                data-promo-field="grace-firma"
                className={cn(inputCls, "font-normal")}
                value={state.firma}
                placeholder="Örn: ABC İnşaat Ltd. Şti."
                onChange={(e) => setField("firma", e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Makine / model">
            {(id) => (
              <Input
                id={id}
                className={cn(inputCls, "font-normal")}
                value={state.makine}
                placeholder="Örn: MT 1840-100"
                onChange={(e) => setField("makine", e.target.value)}
              />
            )}
          </FormField>
        </div>
      </FormStep>

      <FormStep index={2} title="Finansman koşulları">
        <div className="grid gap-3 sm:grid-cols-2">
          {plan.direction === "forward" ? (
            <FormField label="Makine bedeli" required suffix={plan.sym}>
              {(id) => (
                <DecimalTextInput
                  id={id}
                  data-promo-field="grace-machinePrice"
                  className={inputCls}
                  value={state.machinePrice}
                  onValueChange={(n) => setField("machinePrice", n)}
                />
              )}
            </FormField>
          ) : (
            <FormField label="Hedef müşteri toplam ödemesi" required suffix={plan.sym}>
              {(id) => (
                <DecimalTextInput
                  id={id}
                  className={inputCls}
                  value={state.targetCustomerTotal}
                  onValueChange={(n) => setField("targetCustomerTotal", n)}
                />
              )}
            </FormField>
          )}
          <FormField label="Peşinat" suffix={plan.sym}>
            {(id) => (
              <DecimalTextInput
                id={id}
                data-promo-field="grace-downPayment"
                className={inputCls}
                value={state.downPayment}
                onValueChange={(n) => setField("downPayment", n)}
              />
            )}
          </FormField>
          <FormField label="Yıllık nominal faiz" suffix="%">
            {(id) => (
              <DecimalTextInput
                id={id}
                className={inputCls}
                value={state.annualRate}
                onValueChange={(n) => setField("annualRate", n)}
              />
            )}
          </FormField>
          <FormField label="Toplam vade" required suffix="ay">
            {(id) => (
              <Input
                id={id}
                className={inputCls}
                inputMode="numeric"
                value={plan.termDraft ?? String(state.termMonths)}
                onFocus={() => plan.setTermDraft(String(state.termMonths))}
                onChange={(e) => plan.setTermDraft(e.target.value.replace(/\D/g, ""))}
                onBlur={plan.commitTermDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            )}
          </FormField>
          <FormField label="Finansman başlangıcı" required>
            {(id) => (
              <Input
                id={id}
                className={inputCls}
                type="date"
                value={state.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Para birimi">
            {(id) => (
              <select
                id={id}
                className={cn(inputCls, "w-full cursor-pointer rounded-lg border px-3", focusRing)}
                value={state.currency}
                onChange={(e) => setField("currency", e.target.value)}
              >
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
              </select>
            )}
          </FormField>
          <FormField
            label="Finansman desteği"
            hint="İsteğe bağlı"
            suffix={plan.sym}
            className="sm:col-span-2"
          >
            {(id) => (
              <DecimalTextInput
                id={id}
                className={inputCls}
                placeholder="0"
                value={state.financingSupport}
                onValueChange={(n) => setField("financingSupport", n)}
              />
            )}
          </FormField>
        </div>
      </FormStep>

      <FormStep index={3} title="Ek maliyetler" last>
        <PlanExtraCostPanel
          machinePriceEuro={plan.machinePriceForKasko}
          fees={plan.serviceFees}
          modes={plan.feeModes}
          kaskoAutoTotal={plan.kaskoAutoTotal}
          kaskoTermHint={
            plan.serviceFees.kaskoPercentOfMachine > 0 && state.termMonths > 0
              ? `${state.termMonths} ay × (${plan.direction === "reverse" ? "hedef toplamın" : "makine bedelinin"} %${plan.serviceFees.kaskoPercentOfMachine} / 12)`
              : undefined
          }
          amounts={{
            totalInsurance: state.totalInsurance,
            fileFee: state.fileFee,
            importCost: state.importCost,
            attachmentCost: state.attachmentCost,
          }}
          extraCostModes={state.extraCostModes}
          reverseExtras={plan.direction === "reverse"}
          hideAttachment
          inputClassName={inputCls}
          onSetMode={plan.handleSetFeeMode}
          onAmountChange={(key, value) => setField(key, value)}
          onPaymentModeChange={(key, mode) =>
            plan.setState((prev) => ({
              ...prev,
              extraCostModes: { ...prev.extraCostModes, [key]: mode },
            }))
          }
        />
        <GraceBalloonOptionChips
          selection={plan.catalogSelection}
          onToggle={plan.toggleCatalog}
          paymentMode={state.extraCostModes.attachmentCost}
          onPaymentModeChange={plan.setOptionPaymentMode}
          reverseExtras={plan.direction === "reverse"}
        />
      </FormStep>
    </section>
  );
}

/* ——— Maliyet özeti ——— */

function SummaryCard({ plan }: { plan: GraceBalloonPlan }) {
  return (
    <aside className={cn(CALC_PANEL_CLS, "lg:sticky lg:top-[4.75rem] lg:col-span-5")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0F172A]">Maliyet özeti</h3>
        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
          KDV hariç
        </span>
      </div>

      {plan.ok ? (
        <CostSummaryPanel
          rows={plan.stitchSummaryRows}
          currencySymbol={plan.kpiSymbol}
          layout="stitch"
          amountDecimals={2}
          totalEuro={plan.stitchPrimaryTotal}
          stitchPrimaryTotalLabel={plan.stitchPrimaryTotalLabel}
          stitchCompare={plan.supportCompare ?? undefined}
        />
      ) : (
        <p className="rounded-lg bg-[#F8FAFC] px-3 py-4 text-sm text-[#475569]">
          Zorunlu alanlar doldurulduğunda kalemler burada listelenir.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[#64748B]">
        {plan.direction === "reverse"
          ? "Müşteri taksiti yazılan hedefe göredir. Kasko ve masraf aşağıdan seçilir; müşteri toplamına eklenmez, vade farkına yansır. Devir bedeli hariç."
          : "Müşteri toplamı: peşinat + taksitler + balonlar + peşin ek maliyetler. Plana dahil ekler vade farkıyla taksitlere yansır. Devir bedeli hariç."}
      </p>
    </aside>
  );
}

/* ——— Ödeme planı tablosu ——— */

function ScheduleCard({ plan, fmt }: { plan: GraceBalloonPlan; fmt: (v: number) => string }) {
  const totals = useMemo(
    () =>
      plan.rows.reduce(
        (acc, r) => ({
          installment: acc.installment + r.normalInstallment,
          balloon: acc.balloon + r.balloonPayment,
        }),
        { installment: 0, balloon: 0 },
      ),
    [plan.rows],
  );
  const lastBalance = plan.rows.at(-1)?.closingBalance ?? 0;

  return (
    <section className="no-print rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E2E8F0] px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">Ödeme planı</h3>
          <p className="mt-0.5 text-xs text-[#64748B]">
            {plan.graceMonthCount} ödemesiz ay · {plan.balloonMonthCount} balon · İlk ödeme,
            finansman başlangıcından bir ay sonra
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton onClick={plan.resetGraceToDefault} icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
            İlk {DEFAULT_GRACE_MONTHS} ay ödemesiz
          </ToolbarButton>
          <ToolbarButton
            onClick={plan.clearBalloons}
            disabled={plan.balloonMonthCount === 0}
            icon={<Eraser className="h-3.5 w-3.5" aria-hidden />}
          >
            Balonları temizle
          </ToolbarButton>
        </div>
      </div>

      <div className="max-h-[min(560px,65vh)] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            <tr>
              <th scope="col" className="px-3 py-2 md:px-4">Ay</th>
              <th scope="col" className="px-3 py-2">Ödeme tarihi</th>
              <th scope="col" className="px-3 py-2">Durum</th>
              <th scope="col" className="px-3 py-2 text-right">Taksit</th>
              <th scope="col" className="px-3 py-2 text-right">Balon</th>
              <th scope="col" className="px-3 py-2 text-right md:px-4">Kalan borç</th>
            </tr>
          </thead>
          <tbody>
            {plan.rows.map((row, idx) => {
              const isGrace = row.mode === "grace";
              const balloon = plan.state.balloons[idx] ?? 0;
              return (
                <tr
                  key={row.month}
                  className={cn(
                    "border-t border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] motion-reduce:transition-none",
                    isGrace && "bg-[#F8FAFC]",
                  )}
                >
                  <td className="px-3 py-1.5 font-semibold tabular-nums text-[#020617] md:px-4">
                    {row.month}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums text-[#475569]">{row.paymentDate ?? "—"}</td>
                  <td className="px-3 py-1.5">
                    <MonthModeToggle
                      month={row.month}
                      value={row.mode}
                      onChange={(mode) => plan.setMonthMode(idx, mode)}
                    />
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 text-right tabular-nums",
                      isGrace ? "text-[#94A3B8]" : "font-medium text-[#0F172A]",
                    )}
                  >
                    {fmt(row.normalInstallment)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <DecimalTextInput
                      aria-label={`${row.month}. ay balon tutarı`}
                      className={cn(
                        "ml-auto h-7 w-28 rounded-md px-2 text-right text-[13px] tabular-nums",
                        balloon > 0
                          ? "border-[#A16207]/60 bg-[#FFFBEB] font-semibold text-[#713F12]"
                          : "border-[#E2E8F0] text-[#475569]",
                      )}
                      value={balloon}
                      onValueChange={(v) => plan.setBalloon(idx, v)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#475569] md:px-4">
                    {fmt(row.closingBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-white text-sm font-semibold text-[#0F172A] shadow-[0_-1px_0_#E2E8F0]">
            <tr>
              <th scope="row" colSpan={3} className="px-3 py-2 text-left md:px-4">
                Toplam
              </th>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totals.installment)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-[#A16207]">
                {fmt(totals.balloon)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums md:px-6">{fmt(lastBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="border-t border-[#E2E8F0] px-3 py-2.5 text-xs text-[#64748B] md:px-4">
        Ödemesiz aylarda taksit sıfırdır; faiz kalan borca eklenir. Balonu istediğiniz aya
        yazabilirsiniz. Tutarlar {plan.sym} cinsindendir.
      </p>
    </section>
  );
}

function MonthModeToggle(props: {
  month: number;
  value: PaymentMonthMode;
  onChange: (mode: PaymentMonthMode) => void;
}) {
  const options: { mode: PaymentMonthMode; label: string }[] = [
    { mode: "paying", label: "Ödemeli" },
    { mode: "grace", label: "Ödemesiz" },
  ];
  return (
    <div
      role="group"
      aria-label={`${props.month}. ay ödeme durumu`}
      className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5"
    >
      {options.map((o) => {
        const active = props.value === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            aria-pressed={active}
            onClick={() => props.onChange(o.mode)}
            className={cn(
              "h-7 cursor-pointer rounded-md px-2.5 text-xs font-semibold transition-colors motion-reduce:transition-none",
              focusRing,
              active
                ? o.mode === "grace"
                  ? "bg-[#475569] text-white"
                  : "bg-[#0369A1] text-white"
                : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ToolbarButton(props: {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        focusRing,
      )}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

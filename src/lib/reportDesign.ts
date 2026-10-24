/**
 * Özet rapor tasarımı.
 * "executive" = yönetim raporu şeması, "classic" = önceki görünüm
 * (`src/components/finance/reports/classic/`).
 * `.env.local`: NEXT_PUBLIC_REPORT_DESIGN=classic → eski görünüme döner.
 */
export type ReportDesign = "executive" | "classic";

export const REPORT_DESIGN: ReportDesign =
  process.env.NEXT_PUBLIC_REPORT_DESIGN === "classic" ? "classic" : "executive";

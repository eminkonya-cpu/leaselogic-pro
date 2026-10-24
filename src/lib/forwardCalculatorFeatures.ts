import type { ForwardTabId } from "@/lib/forwardDisplayMetrics";

/**
 * İleri hesaplama — Kampanyalı Fiyat sekmesi.
 * Geri açmak: `.env.local` içine `NEXT_PUBLIC_FORWARD_CAMPAIGN_TAB=true` ekleyip dev/build yenile.
 */
export const FORWARD_CAMPAIGN_TAB_ENABLED =
  process.env.NEXT_PUBLIC_FORWARD_CAMPAIGN_TAB === "true";

export const FORWARD_DEFAULT_ACTIVE_TAB: ForwardTabId =
  FORWARD_CAMPAIGN_TAB_ENABLED ? "campaign" : "plain";

const TAB_LABELS: Record<ForwardTabId, string> = {
  plain: "Sade Makine",
  allin: "Her Şey Dahil",
  campaign: "Kampanyalı Fiyat",
  advantage: "Kur Avantajı",
};

/** UI sırası: Sade → Her Şey Dahil → (opsiyonel Kampanya) → Kur Avantajı */
export function getForwardTabOptions(): { value: ForwardTabId; label: string }[] {
  const order: ForwardTabId[] = FORWARD_CAMPAIGN_TAB_ENABLED
    ? ["plain", "allin", "campaign", "advantage"]
    : ["plain", "allin", "advantage"];
  return order.map((value) => ({ value, label: TAB_LABELS[value] }));
}

export function normalizeForwardActiveTab(tab: ForwardTabId): ForwardTabId {
  if (tab === "campaign" && !FORWARD_CAMPAIGN_TAB_ENABLED) return "plain";
  return tab;
}

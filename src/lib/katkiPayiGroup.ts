import { KATKI_PAYI_LABEL } from "@/lib/kalemlerToplam";

export { KATKI_PAYI_LABEL };

export type KatkiPayiRow = {
  label: string;
  value: number;
  role: "katki" | "araToplam" | "ithalat";
};

/**
 * Leasing katkı payı e-postası: kasko + masraf + vade farkı.
 * İthalat ve opsiyonlar bu ara toplama girmez.
 */
export function buildKatkiPayiRows(args: {
  kasko: number;
  masraflar: number;
  vadeFarki: number;
  vadeFarkiLabel?: string;
  ithalat: number;
  sign?: 1 | -1;
  hasFollowingItems?: boolean;
}): KatkiPayiRow[] {
  const sign = args.sign ?? 1;
  const vadeLabel = args.vadeFarkiLabel ?? "Vade farkı";
  const kasko = Math.max(0, args.kasko);
  const masraflar = Math.max(0, args.masraflar);
  const vade = Math.max(0, args.vadeFarki);
  const ithalat = Math.max(0, args.ithalat);

  const katki: KatkiPayiRow[] = [];
  if (kasko > 0.005) {
    katki.push({ label: "Kasko", value: sign * kasko, role: "katki" });
  }
  if (masraflar > 0.005) {
    katki.push({ label: "Masraflar", value: sign * masraflar, role: "katki" });
  }
  if (vade > 0.005) {
    katki.push({ label: vadeLabel, value: sign * vade, role: "katki" });
  }

  const araAbs = kasko + masraflar + vade;
  const showAra =
    katki.length >= 2 ||
    (katki.length >= 1 && (ithalat > 0.005 || Boolean(args.hasFollowingItems)));

  const rows = [...katki];
  if (showAra && araAbs > 0.005) {
    rows.push({
      label: KATKI_PAYI_LABEL,
      value: sign * araAbs,
      role: "araToplam",
    });
  }
  if (ithalat > 0.005) {
    rows.push({ label: "İthalat", value: sign * ithalat, role: "ithalat" });
  }
  return rows;
}

export function katkiPayiStitchTone(
  role: KatkiPayiRow["role"],
  itemTone: "positive" | "negative",
): "positive" | "negative" | "midtotal" {
  return role === "araToplam" ? "midtotal" : itemTone;
}

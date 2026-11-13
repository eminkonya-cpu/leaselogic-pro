/** Özet “Hazırlayan” satırı: metadata adı, yoksa e-posta yerel kısmı. */
export function formatReportPreparedByName(args: {
  email?: string | null;
  fullName?: string | null;
  name?: string | null;
}): string {
  const named = (args.fullName ?? args.name ?? "").trim();
  if (named) return named;

  const email = (args.email ?? "").trim();
  if (!email) return "";

  const local = email.split("@")[0]?.replace(/[._+-]+/g, " ").trim() ?? "";
  if (!local) return email;

  return local
    .split(/\s+/)
    .map((part) => {
      if (!part) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join(" ");
}

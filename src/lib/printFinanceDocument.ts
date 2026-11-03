export type FinancePrintTarget = "preview" | "plan";

function keepNodes(target: FinancePrintTarget): HTMLElement[] {
  if (target === "preview") {
    return Array.from(
      document.querySelectorAll<HTMLElement>("body > .finance-print-portal"),
    );
  }

  const sheets = Array.from(
    document.querySelectorAll<HTMLElement>("body > .llp-print-sheet"),
  );
  if (sheets.length > 0) return sheets;

  return Array.from(
    document.querySelectorAll<HTMLElement>("body > [id='pdf-print-area']"),
  ).filter((el) => !el.closest(".finance-print-portal"));
}

function hideForPrint(keep: HTMLElement[]): Array<() => void> {
  const restore: Array<() => void> = [];
  const hide = (el: HTMLElement) => {
    if (keep.some((k) => k === el || k.contains(el))) return;
    const prev = el.getAttribute("style");
    el.style.setProperty("display", "none", "important");
    restore.push(() => {
      if (prev === null) el.removeAttribute("style");
      else el.setAttribute("style", prev);
    });
  };

  for (const child of Array.from(document.body.children)) {
    if (child instanceof HTMLElement) hide(child);
  }

  document
    .querySelectorAll<HTMLElement>(".llp-print-sheet, [id='pdf-print-area']")
    .forEach(hide);

  return restore;
}

/**
 * Önizlemedeki şablonu basar. Gizli ödeme planı belgesi yazdırılmaz;
 * stiller iframe kopyasına taşınmadığı için asıl DOM kullanılır.
 */
export function printFinanceDocument(target: FinancePrintTarget) {
  if (typeof window === "undefined") return;

  const keep = keepNodes(target);
  if (keep.length === 0) return;

  const html = document.documentElement;
  html.setAttribute("data-llp-print", target);
  const restore = hideForPrint(keep);
  void html.offsetHeight;

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    restore.forEach((fn) => fn());
    html.removeAttribute("data-llp-print");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}

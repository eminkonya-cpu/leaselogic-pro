export type FinancePrintTarget = "preview" | "plan";

function getPrintSource(target: FinancePrintTarget): HTMLElement | null {
  if (target === "preview") {
    return document.querySelector<HTMLElement>(
      ".finance-print-portal .finance-print-portal-sheet",
    );
  }

  const sheet = document.querySelector<HTMLElement>("body > .llp-print-sheet");
  if (sheet) return sheet;

  for (const el of document.querySelectorAll<HTMLElement>(
    "body > [id='pdf-print-area']",
  )) {
    if (!el.closest(".finance-print-portal")) return el;
  }
  return null;
}

function copyStyles(into: Document) {
  for (const node of document.querySelectorAll("style, link[rel='stylesheet']")) {
    into.head.appendChild(node.cloneNode(true));
  }
  const extra = into.createElement("style");
  extra.textContent = `
    @page { margin: 4mm 8mm 6mm 8mm; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      height: auto !important;
    }
    .no-print { display: none !important; }
    .finance-print-portal-sheet,
    .finance-print-portal-sheet > div {
      min-height: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
  `;
  into.head.appendChild(extra);
}

/**
 * Chrome yazdır önizlemesi `window.print()` ile sayfadaki tüm
 * `#pdf-print-area` belgelerini basar. Özet ve plan ayrı kalsın diye
 * yalnızca seçilen belgeyi iframe içinde basıyoruz.
 */
export function printFinanceDocument(target: FinancePrintTarget) {
  if (typeof window === "undefined") return;

  const source = getPrintSource(target);
  if (!source) return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Yazdır");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const idoc = iframe.contentDocument;
  if (!win || !idoc) {
    iframe.remove();
    window.print();
    return;
  }

  idoc.open();
  idoc.write(
    "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body></body></html>",
  );
  idoc.close();

  idoc.documentElement.lang = "tr";
  idoc.documentElement.className = document.documentElement.className;
  const ui = document.documentElement.getAttribute("data-llp-ui");
  if (ui) idoc.documentElement.setAttribute("data-llp-ui", ui);
  const pro = document.documentElement.getAttribute("data-llp-pro");
  if (pro) idoc.documentElement.setAttribute("data-llp-pro", pro);

  copyStyles(idoc);

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());
  idoc.body.appendChild(clone);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };
  win.addEventListener("afterprint", cleanup);

  const run = () => {
    win.focus();
    win.print();
  };

  const ready = idoc.fonts?.ready ?? Promise.resolve();
  void Promise.race([
    ready,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 400);
    }),
  ]).then(run);
}

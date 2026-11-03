import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

function printSource(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      ".finance-print-portal #pdf-print-area",
    ) ??
    document.querySelector<HTMLElement>(
      ".finance-print-portal .finance-print-portal-sheet",
    )
  );
}

export function financePdfFileName(parts: Array<string | undefined | null>) {
  const day = new Date().toISOString().slice(0, 10);
  const tokens = [...parts.map((p) => (p ?? "").trim()), day]
    .filter(Boolean)
    .map((p) =>
      p
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, "-")
        .slice(0, 48),
    );
  return tokens.join("_") || `rapor-${day}`;
}

/** Önizlemedeki belgeyi yazıcı diyaloğu olmadan PDF olarak indirir. */
export async function saveFinanceDocumentPdf(fileName: string) {
  const source = printSource();
  if (!source) return;

  const canvas = await html2canvas(source, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: source.scrollWidth,
    windowHeight: source.scrollHeight,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.93);

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, "JPEG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0.8) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(img, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(`${fileName.replace(/\.pdf$/i, "")}.pdf`);
}

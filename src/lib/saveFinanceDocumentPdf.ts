import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/** A4 genişliği — kaydetmede mobil kırılım uygulanmasın, yazdırma düzeni çıksın. */
const PDF_CAPTURE_WIDTH_PX = 1200;
const PDF_CAPTURE_HEIGHT_PX = Math.round(PDF_CAPTURE_WIDTH_PX * (297 / 210));

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

export function financePdfFileName(customer?: string | null) {
  const day = new Date().toISOString().slice(0, 10);
  const name = (customer ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return name ? `${name}_${day}` : day;
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
    windowWidth: PDF_CAPTURE_WIDTH_PX,
    width: PDF_CAPTURE_WIDTH_PX,
    windowHeight: Math.max(source.scrollHeight, PDF_CAPTURE_HEIGHT_PX),
    onclone: (clonedDoc, el) => {
      clonedDoc.documentElement.classList.add("llp-pdf-capture");
      clonedDoc.body?.classList.add("llp-pdf-capture");
      el.classList.add("llp-pdf-capture");
      let node: HTMLElement | null = el;
      while (node) {
        node.style.maxWidth = "none";
        node.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
        node.style.minHeight = "0";
        node.style.height = "auto";
        if (node.classList.contains("finance-print-portal")) break;
        node = node.parentElement;
      }
      el.style.boxSizing = "border-box";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
      el.style.minHeight = `${PDF_CAPTURE_HEIGHT_PX}px`;
      el.style.height = "auto";
      el.style.padding = "16px 24px";
      const footer = el.querySelector("footer");
      if (footer instanceof HTMLElement) {
        footer.style.marginTop = "auto";
      }
    },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.97);

  // Önizleme / yazdırma gibi: tam A4 genişliği, doğal yükseklik.
  // Küçülterek tek sayfaya sıkıştırma — yazı kalitesi bozulmasın.
  if (imgH <= pageH + 0.6) {
    pdf.addImage(img, "JPEG", 0, 0, imgW, imgH);
  } else {
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
  }

  pdf.save(`${fileName.replace(/\.pdf$/i, "")}.pdf`);
}

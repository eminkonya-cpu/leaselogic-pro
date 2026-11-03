"use client";

import { Button } from "@/components/ui/button";
import { printFinanceDocument } from "@/lib/printFinanceDocument";
import { saveFinanceDocumentPdf } from "@/lib/saveFinanceDocumentPdf";
import { Download, Printer, X } from "lucide-react";
import { useState } from "react";

export default function PreviewDocumentActions(props: {
  fileName: string;
  onClose: () => void;
  closeActionAttr?: string;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveFinanceDocumentPdf(props.fileName);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="no-print sticky top-3 z-10 mb-3 flex justify-end gap-2 sm:top-4 sm:mb-4">
      <Button
        type="button"
        className="h-9 gap-1.5 bg-[#0F172A] px-3 text-xs font-bold text-white hover:bg-[#1e293b]"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        <Download className="h-4 w-4" aria-hidden />
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-9 gap-1.5 border-slate-300 bg-white/95 px-3 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
        onClick={() => printFinanceDocument("preview")}
      >
        <Printer className="h-4 w-4" aria-hidden />
        Yazdır
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-9 gap-1.5 border-slate-300 bg-white/95 px-3 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
        data-promo-action={props.closeActionAttr}
        onClick={props.onClose}
      >
        <X className="h-4 w-4" aria-hidden />
        Kapat
      </Button>
    </div>
  );
}

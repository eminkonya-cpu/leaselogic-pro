# Checkpoint: Kompakt Stitch yoğunluk (31 Ağustos 2026)

**Geri dönmek için:** “buraya dön” veya “31 Ağustos kompakt checkpoint” deyin.

## Ne değişti
- Stitch hesaplayıcı arayüzünde yazı boyutları, kart padding’leri ve dikey boşluklar küçültüldü.
- Amaç: %100 zoom’da daha profesyonel, daha az kaydırmalı masaüstü görünüm.
- Layout (8+4 grid, sticky özet, opsiyonlar altta) ve hesaplama formülleri **değişmedi**.

## Etkilenen alanlar
- `globals.css` — `.finance-main` taban tipografi
- `SectionCard`, `FinanceFieldGrid`, `CostSummaryPanel`, `CatalogSelector`
- `PaymentFrequencySelector`, `PaymentSchedulePanel`, `SegmentedControl`
- `ForwardCalculatorLayout`, `ReverseCalculatorLayout`, `HomeClient`

## Önceki yoğunluk
- Daha geniş kart padding (`p-6`), `text-[15px]` gövde, `gap-6` / `space-y-8`
- Opsiyon listeleri daha yüksek (`min-h-[320px]`), özet toplamları daha büyük

## Not
Bu checkpoint yalnızca **görsel yoğunluk** içindir. Siemens karşılaştırması ve mobil sıra düzeni ayrı commit’lerde kalır.

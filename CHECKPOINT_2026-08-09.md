# Checkpoint — 9 Ağustos 2026 (Stitch stabil)

Bu dosya, **“buraya dön”** denildiğinde hedeflenen bilinen iyi sürümü tanımlar.

## Git

| | |
|---|---|
| **Tag** | `checkpoint/stitch-stable-2026-08-09` |
| **Ana commit (Stitch deploy)** | `fd326eb` — *Stitch arayüz, geri hesaplama ve güncel finansman raporları.* |
| **Branch** | `main` |
| **GitHub** | `https://github.com/eminkonya-cpu/leaselogic-pro` |

### Bu sürüme geri dönmek

```bash
cd leaselogic-pro
git fetch origin --tags
git checkout checkpoint/stitch-stable-2026-08-09
# veya main’i bu tag’e sabitlemek (dikkat: sonraki commit’ler kaybolur):
# git reset --hard checkpoint/stitch-stable-2026-08-09
# git push origin main --force   # yalnızca bilinçli onayla
```

Yerelde temiz build:

```bash
rm -rf .next
npm run build
npm run dev   # http://127.0.0.1:3010
```

## Ortamlar

| Ortam | URL |
|--------|-----|
| **Yerel dev** | `http://127.0.0.1:3010/` (`npm run dev`, port `package.json`’da 3010) |
| **Production (Vercel)** | `https://leaselogic-pro.vercel.app/` |

Vercel, GitHub `main` push ile deploy olur. `.env.local` git’e **gitmez**; Vercel’de `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tanımlı olmalı.

## Bu checkpoint’te çalışan özellikler

### İleri hesaplama (Stitch layout)

- `ForwardCalculatorLayout.tsx` + aylık/yıllık sarmalayıcılar
- **Hesaplama yöntemi sırası (soldan sağa):** Sade Makine → Her Şey Dahil → Kampanyalı Fiyat → Kur Avantajı
- **EUR / TL:** TL seçilince leasing **TL faiz** (`tlInterest`) ile ayrı schedule; kalemler kur ile TL
- Kampanyalı / Her Şey Dahil: opsiyonlar sayfa **altında**; Sade Makine: opsiyonlar sol sütunda
- **`CatalogScrollRail`:** Tüm yöntemlerde opsiyonlar görünmüyorken sol rail (lg+) / alt şerit (mobil); anchor `#opsiyonlar`
- Özet rapor, PDF, ödeme planı toplam satırı, stitch özet (Toplam TL satırı kaldırılmış)

### Geri hesaplama

- `ReverseCalculatorLayout.tsx`, dual leg `calc.euro` / `calc.tl`
- TL mod: TL faiz ile solve; opsiyon/masraf kur ile
- Özet rapor: leasing bloğu, “Peşinat dahil, vade farkı düşülmüş tutar”, net makine
- Tutarlar **2 ondalık** (`amountDecimals` / `formatAmount`)

### Paylaşılan

- Katalog + admin editor, Supabase auth gate (`HomeClient.tsx`)
- Terminoloji: **Makine fiyatı** (anahtar teslim kaldırıldı)

### UI ince ayar (checkpoint sonrası commit)

- Maliyet dağılımı donut: **ince halka**, ortadaki “Toplam Ödeme” metni okunaklı

## Kritik dosyalar (hata sonrası diff’e bak)

- Layout: `ForwardCalculatorLayout.tsx`, `ReverseCalculatorLayout.tsx`
- Metrik: `forwardDisplayMetrics.ts`, `reverseFinanceCalc.ts`, `reverseSummaryReport.ts`
- UI: `CostSummaryPanel.tsx`, `CatalogScrollRail.tsx`, `PaymentSchedulePanel.tsx`
- Rapor: `PrintableReverseSummary.tsx`, `PrintableCalculationSummary.tsx`

## Bilinçli kısıtlar

- Forward **Kampanyalı** davranışı (faizsiz eşit taksit) korunmalı
- `127.0.0.1` dev sunucusu dış ağdan doğrudan açılmaz (SSH tüneli veya Vercel)

## Cursor / agent

Gelecek oturumlarda: **“CHECKPOINT_2026-08-09’a dön”** veya tag **`checkpoint/stitch-stable-2026-08-09`** denildiğinde bu dosyayı ve tag’i referans al.

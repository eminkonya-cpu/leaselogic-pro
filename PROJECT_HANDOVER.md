# Leasing Calculator Handover

## Canli Uygulama

- Vercel URL: `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`

## Yerelde Calistirma

Projeyi yerelde tekrar acmak icin terminalde:

```bash
cd "/Users/eminkonya/Desktop/CURSOR LEASING DENEME/leaselogic-pro"
npm run dev
```

Tarayicida:

```txt
http://localhost:3010
```

Gerekiyorsa temiz baslatma:

```bash
cd "/Users/eminkonya/Desktop/CURSOR LEASING DENEME/leaselogic-pro"
rm -rf .next
npm run dev
```

Dev server'i kapatmak icin:

```bash
Ctrl + C
```

## Kullanici Girisi ve Yetki Mantigi

Uygulama `Supabase Auth` ile calisir.

Bir kullanicinin siteye girebilmesi icin iki sey gerekir:

1. `Authentication > Users` icinde kullanici olusturulmus olmali
2. `Table Editor > authorized_users` tablosunda ayni e-posta yer almali ve `is_active = true` olmali

## Yeni Kullanici Ekleme

1. Supabase > `Authentication > Users`
2. `Create new user`
3. E-posta ve sifre ver
4. Supabase > `Table Editor > authorized_users`
5. Ayni e-posta ile yeni satir ekle
6. `is_active = true`

## Kullanici Kapatma

Supabase > `Table Editor > authorized_users`

- ilgili kullaniciyi bul
- `is_active` degerini `false` yap

## Vercel ve Supabase Baglantisi

Supabase > `Authentication > URL Configuration`

- `Site URL`: `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`
- `Redirect URLs` icinde:
  - `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`
  - `http://localhost:3010`

## Ortam Degiskenleri

Yerel dosya:

- `.env.local`

Vercel'de eklenen degiskenler:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Not:

- `service_role`
- `secret`
- veritabani sifreleri

bu dosyaya yazilmadi.

## Supabase Sifresi Unutulursa

Eger Supabase hesabina giris sifresi unutulduysa:

1. Supabase giris ekranina git
2. `Forgot password` / `Reset password` sec
3. E-postana gelen baglanti ile yeni sifre olustur

Eger unutulan sey proje olustururken verilen `database password` ise:

1. Supabase proje ayarlarina git
2. `Database` veya `Project Settings` altinda sifre yenileme alanini kullan
3. Gerekirse yeni sifre belirle

## Not

Bu dosya, proje kurulumu ve yonetim akisini hizli hatirlamak icin hazirlandi.

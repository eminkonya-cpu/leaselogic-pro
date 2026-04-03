## Supabase Kurulumu

Bu proje `Supabase Auth` ile e-posta + sifre girisi kullanir. Kullanici uygulamaya girdikten sonra `authorized_users` tablosunda aktif olup olmadigi kontrol edilir.

### 1. SQL Editor'de tabloyu olustur

Supabase panelinde `SQL Editor` ac ve asagidaki sorguyu calistir:

```sql
create table if not exists public.authorized_users (
  email text primary key,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.authorized_users enable row level security;

drop policy if exists "users can read own access row" on public.authorized_users;

create policy "users can read own access row"
on public.authorized_users
for select
to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')));
```

### 2. Acik kayit olmayi kapat

`Authentication > Providers > Email` altinda genel kayit olma ozelligini kapat. Boylece sadece senin actigin kullanicilar giris yapabilir.

### 3. Kullanici ekle

1. `Authentication > Users` ekranina git.
2. `Add user` ile kullanicinin e-posta ve sifresini olustur.
3. `Table Editor > authorized_users` tablosuna ayni e-posta ile bir satir ekle.
4. `is_active = true` olarak birak.

### 4. Yetkiyi kapat

Kisinin erisimini kapatmak icin `authorized_users` tablosunda:

- `is_active` alanini `false` yap
- veya satiri tamamen sil

Bir sonraki oturum kontrolunde uygulamaya giremez.

-- Opsiyon fiyat listesi (Supabase) + yonetici yetkisi
-- Supabase SQL Editor'de bir kez calistirin.

alter table public.authorized_users
  add column if not exists can_edit_catalog boolean not null default false;

create table if not exists public.catalog_config (
  id smallint primary key default 1 check (id = 1),
  categories jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.catalog_config enable row level security;

drop policy if exists "authenticated can read catalog config" on public.catalog_config;
create policy "authenticated can read catalog config"
on public.catalog_config
for select
to authenticated
using (true);

drop policy if exists "catalog editors can insert catalog config" on public.catalog_config;
create policy "catalog editors can insert catalog config"
on public.catalog_config
for insert
to authenticated
with check (
  exists (
    select 1
    from public.authorized_users au
    where lower(au.email) = lower((auth.jwt() ->> 'email'))
      and au.is_active = true
      and au.can_edit_catalog = true
  )
);

drop policy if exists "catalog editors can update catalog config" on public.catalog_config;
create policy "catalog editors can update catalog config"
on public.catalog_config
for update
to authenticated
using (
  exists (
    select 1
    from public.authorized_users au
    where lower(au.email) = lower((auth.jwt() ->> 'email'))
      and au.is_active = true
      and au.can_edit_catalog = true
  )
)
with check (
  exists (
    select 1
    from public.authorized_users au
    where lower(au.email) = lower((auth.jwt() ->> 'email'))
      and au.is_active = true
      and au.can_edit_catalog = true
  )
);

-- Kendi e-postaniz icin duzenleme acin:
-- update public.authorized_users
-- set can_edit_catalog = true
-- where lower(email) = lower('sizin@eposta.com');

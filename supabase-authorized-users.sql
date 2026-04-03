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

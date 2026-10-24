-- Otomatik maliyet kalemleri (kasko %, dosya, ithalat) — catalog_config
alter table public.catalog_config
  add column if not exists service_fees jsonb not null default '{
    "kaskoPercentOfMachine": 0,
    "fileFeeEuro": 0,
    "importCostEuro": 0
  }'::jsonb;

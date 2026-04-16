-- Integrare ANAF e-Factura/SPV: conexiune, mapări client, jurnal sincronizare, deduplicare mesaje

create table if not exists public.anaf_connections (
  accountant_id uuid primary key references public.accountants (id) on delete cascade,
  enabled boolean not null default false,
  company_cif text not null,
  api_base_url text not null default 'https://api.anaf.ro/prod/FCTEL/rest',
  oauth_token_url text not null,
  oauth_client_id text not null,
  oauth_client_secret text not null,
  oauth_refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  consecutive_failures integer not null default 0,
  circuit_open_until timestamptz,
  last_synced_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.anaf_connections is 'Config integrare ANAF/SPV per contabil (OAuth + stare circuit breaker).';

create table if not exists public.anaf_client_tax_mappings (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  tax_code text not null,
  created_at timestamptz not null default now(),
  unique (accountant_id, tax_code),
  unique (accountant_id, client_id)
);

comment on table public.anaf_client_tax_mappings is 'Mapare CUI/CIF partener ANAF -> client Vello.';

create table if not exists public.anaf_sync_log (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  status text not null check (status in ('success', 'partial', 'skipped', 'error')),
  detail text,
  error_message text,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists anaf_sync_log_accountant_created_idx
  on public.anaf_sync_log (accountant_id, created_at desc);

create table if not exists public.anaf_message_receipts (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  company_cif text not null,
  message_id text not null,
  partner_tax_code text,
  client_id uuid references public.clients (id) on delete set null,
  upload_id uuid references public.uploads (id) on delete set null,
  file_path text,
  file_name text,
  status text not null check (status in ('imported', 'unmapped', 'download_error', 'parse_error')),
  detail text,
  created_at timestamptz not null default now(),
  unique (accountant_id, company_cif, message_id)
);

create index if not exists anaf_message_receipts_accountant_created_idx
  on public.anaf_message_receipts (accountant_id, created_at desc);

alter table public.anaf_connections enable row level security;
alter table public.anaf_client_tax_mappings enable row level security;
alter table public.anaf_sync_log enable row level security;
alter table public.anaf_message_receipts enable row level security;

create policy "anaf_connections_select_own" on public.anaf_connections
  for select using (accountant_id = auth.uid());

create policy "anaf_connections_upsert_own" on public.anaf_connections
  for all using (accountant_id = auth.uid()) with check (accountant_id = auth.uid());

create policy "anaf_client_tax_mappings_select_own" on public.anaf_client_tax_mappings
  for select using (accountant_id = auth.uid());

create policy "anaf_client_tax_mappings_upsert_own" on public.anaf_client_tax_mappings
  for all using (accountant_id = auth.uid()) with check (accountant_id = auth.uid());

create policy "anaf_sync_log_select_own" on public.anaf_sync_log
  for select using (accountant_id = auth.uid());

create policy "anaf_message_receipts_select_own" on public.anaf_message_receipts
  for select using (accountant_id = auth.uid());

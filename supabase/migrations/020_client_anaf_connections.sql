-- Conexiune ANAF/SPV per client Vello (OAuth de pe linkul unic de upload)

create table if not exists public.client_anaf_connections (
  client_id uuid primary key references public.clients (id) on delete cascade,
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  enabled boolean not null default true,
  company_cif text,
  api_base_url text not null default 'https://api.anaf.ro/prod/FCTEL/rest',
  oauth_token_url text not null,
  oauth_client_id text not null,
  oauth_client_secret text not null,
  oauth_refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  connected_at timestamptz,
  consent_at timestamptz,
  consecutive_failures integer not null default 0,
  circuit_open_until timestamptz,
  last_synced_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_anaf_connections_accountant_idx
  on public.client_anaf_connections (accountant_id);

comment on table public.client_anaf_connections is 'OAuth ANAF/SPV per client (conectare de pe linkul unic).';

alter table public.client_anaf_connections enable row level security;

create policy "client_anaf_connections_select_own" on public.client_anaf_connections
  for select using (accountant_id = auth.uid());

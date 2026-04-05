-- Date de facturare pentru clienți (emitere facturi SmartBill / e-Factura)
alter table public.accountants
  add column if not exists billing_legal_name text,
  add column if not exists billing_vat_code text,
  add column if not exists billing_address text,
  add column if not exists billing_city text,
  add column if not exists billing_county text,
  add column if not exists billing_country text default 'România',
  add column if not exists billing_email text,
  add column if not exists billing_is_company boolean default true;

comment on column public.accountants.billing_legal_name is 'Denumire PJ sau nume complet PF (facturare)';
comment on column public.accountants.billing_vat_code is 'CIF (PJ) sau CNP / conform SmartBill pentru PF';
comment on column public.accountants.billing_is_company is 'true = persoană juridică (CIF), false = persoană fizică';

-- Istoric facturi emise prin SmartBill (idempotență webhook Stripe)
create table if not exists public.smartbill_invoices (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants (id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_invoice_id text,
  smartbill_series text not null,
  smartbill_number text not null,
  amount_cents integer not null,
  currency text not null default 'EUR',
  plan text,
  billing_interval text,
  created_at timestamptz not null default now()
);

create unique index if not exists smartbill_invoices_stripe_checkout_session_id_key
  on public.smartbill_invoices (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists smartbill_invoices_stripe_invoice_id_key
  on public.smartbill_invoices (stripe_invoice_id)
  where stripe_invoice_id is not null;

create index if not exists smartbill_invoices_accountant_id_idx
  on public.smartbill_invoices (accountant_id);

comment on table public.smartbill_invoices is 'Facturi emise în SmartBill la plăți Stripe; unicitate pe sesiune/factură Stripe';

alter table public.smartbill_invoices enable row level security;

create policy "smartbill_invoices_select_own" on public.smartbill_invoices
  for select using (accountant_id = auth.uid());

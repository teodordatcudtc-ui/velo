-- Cereri de documente trimise către clienți (pentru status "în așteptare")
create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  accountant_id uuid not null references public.accountants(id) on delete cascade,
  month int not null,
  year int not null,
  sent_at timestamptz not null default now(),
  channel text not null,
  doc_type_names text[] not null default '{}',
  message text,
  reminder_after_3_days boolean not null default true
);

create index document_requests_client_month_year
  on public.document_requests(client_id, year, month);
create index document_requests_accountant
  on public.document_requests(accountant_id);

alter table public.document_requests enable row level security;

create policy "document_requests_own"
  on public.document_requests for all
  using (accountant_id = auth.uid());

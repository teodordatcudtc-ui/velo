-- Soft delete: arhivare clienți în loc de ștergere
alter table public.clients
  add column if not exists archived boolean not null default false;

create index if not exists clients_accountant_archived
  on public.clients(accountant_id, archived);

comment on column public.clients.archived is 'Client arhivat (ascuns din listă principală)';

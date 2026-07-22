-- Marcare documente ca lucrate de contabil (export doar nelucrate / selectate)
alter table public.uploads
  add column if not exists processed_at timestamptz;

create index if not exists uploads_client_processed_at
  on public.uploads (client_id, processed_at);

comment on column public.uploads.processed_at is
  'Data marcării ca lucrat de contabil; null = nelucrat.';

create policy "uploads_update_via_clients" on public.uploads
  for update using (
    exists (
      select 1 from public.clients c
      where c.id = uploads.client_id and c.accountant_id = auth.uid()
    )
  );

-- Allow accountants to manually close a request for current month,
-- even if not all documents are uploaded.
alter table public.document_requests
  add column if not exists request_closed boolean not null default false;

create index if not exists document_requests_request_closed_idx
  on public.document_requests(request_closed, year, month, client_id);

comment on column public.document_requests.request_closed is
  'Closed manually by accountant for this period (skip late status and 3-day reminder).';


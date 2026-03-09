-- Track one-time reminder emails for scheduled document requests
alter table public.document_requests
  add column if not exists reminder_sent_at timestamptz;

create index if not exists document_requests_reminder_pending_idx
  on public.document_requests(reminder_after_3_days, reminder_sent_at, sent_at);

comment on column public.document_requests.reminder_sent_at is
  'Timestamp when the 3-day reminder email was sent (null = not sent yet)';

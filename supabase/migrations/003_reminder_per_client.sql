-- Programare mesaj lunar per client (nu per contabil)
alter table public.clients
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_day_of_month smallint check (reminder_day_of_month is null or (reminder_day_of_month >= 1 and reminder_day_of_month <= 31));

comment on column public.clients.reminder_enabled is 'Trimite email de reminder lunar acestui client';
comment on column public.clients.reminder_day_of_month is 'Ziua lunii (1-31) în care se trimite; folosit doar dacă reminder_enabled = true';

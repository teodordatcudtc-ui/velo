-- Programare mesaj lunar către clienți (doar email)
alter table public.accountants
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_day_of_month smallint check (reminder_day_of_month >= 1 and reminder_day_of_month <= 31);

comment on column public.accountants.reminder_enabled is 'Dacă contabilul dorește trimitere automată lunară de email cu link upload';
comment on column public.accountants.reminder_day_of_month is 'Ziua lunii (1-31) în care se trimite mesajul';

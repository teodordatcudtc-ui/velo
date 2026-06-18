-- Marchează trimiterea emailului de onboarding (o singură dată per contabil).
alter table public.accountants
  add column if not exists onboarding_email_sent_at timestamptz;

comment on column public.accountants.onboarding_email_sent_at is
  'Când a fost trimis emailul automat de bun venit la înregistrare';

-- Conturi existente: nu trimitem retroactiv email de onboarding.
update public.accountants
set onboarding_email_sent_at = coalesce(created_at, now())
where onboarding_email_sent_at is null;

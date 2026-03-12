-- Stripe subscription tracking columns
alter table public.accountants
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text; -- active, past_due, canceled, etc.

comment on column public.accountants.stripe_customer_id is 'Stripe Customer ID (cus_xxx)';
comment on column public.accountants.stripe_subscription_id is 'Stripe Subscription ID (sub_xxx)';
comment on column public.accountants.stripe_subscription_status is 'Status curent al abonamentului Stripe';

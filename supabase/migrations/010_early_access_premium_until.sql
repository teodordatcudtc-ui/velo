-- Early access: premium_until în viitor = acces premium (indiferent de subscription_plan).

create or replace function public.accountant_has_premium_access(p_accountant_id uuid)
returns boolean
language sql
stable
as $$
  select (a.premium_until is not null and a.premium_until > now())
  from public.accountants a
  where a.id = p_accountant_id
$$;

comment on function public.accountant_has_premium_access(uuid) is 'True dacă premium_until e în viitor (abonament plătit sau cod early access).';

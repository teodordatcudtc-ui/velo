-- Plan "none" (fără abonament): maxim 5 clienți gratis. Standard: 40, Premium: nelimitat.

-- Allow subscription_plan 'none' in addition to 'standard' and 'premium'
alter table public.accountants
  drop constraint if exists accountants_subscription_plan_check;

alter table public.accountants
  add constraint accountants_subscription_plan_check
  check (subscription_plan in ('none', 'standard', 'premium'));

comment on column public.accountants.subscription_plan is 'Plan: none (5 clienți gratis), standard (40), or premium (unlimited)';

-- Premium access: only premium plan with valid premium_until (exclude none)
create or replace function public.accountant_has_premium_access(p_accountant_id uuid)
returns boolean
language sql
stable
as $$
  select
    a.subscription_plan = 'premium'
    and (a.premium_until is not null and a.premium_until > now())
  from public.accountants a
  where a.id = p_accountant_id
$$;

-- Client limit: none=5, standard=40, premium=unlimited
create or replace function public.enforce_standard_client_limit()
returns trigger
language plpgsql
as $$
declare
  v_plan text;
  v_limit integer;
  v_active_clients integer;
begin
  if new.archived is distinct from false then
    return new;
  end if;

  if public.accountant_has_premium_access(new.accountant_id) then
    return new;
  end if;

  select a.subscription_plan into v_plan
  from public.accountants a
  where a.id = new.accountant_id;

  v_limit := case when v_plan = 'none' then 5 else 40 end;

  if tg_op = 'INSERT' then
    select count(*)
      into v_active_clients
    from public.clients c
    where c.accountant_id = new.accountant_id
      and c.archived = false;
  else
    if old.archived = false then
      return new;
    end if;

    select count(*)
      into v_active_clients
    from public.clients c
    where c.accountant_id = new.accountant_id
      and c.archived = false;
  end if;

  if v_active_clients >= v_limit then
    if v_limit = 5 then
      raise exception 'Planul gratuit permite maxim 5 clienți. Alege Standard sau Premium pentru mai mulți.';
    else
      raise exception 'Ai atins limita de 40 clienți pentru planul Standard. Upgrade la Premium pentru clienți nelimitați.';
    end if;
  end if;

  return new;
end;
$$;

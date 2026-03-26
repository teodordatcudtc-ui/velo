-- Standard plan limit increase: 40 -> 50 clients
-- Keeps free plan at 5 and premium unlimited.

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

  v_limit := case when v_plan = 'none' then 5 else 50 end;

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
      raise exception 'Ai atins limita de 50 clienți pentru planul Standard. Upgrade la Premium pentru clienți nelimitați.';
    end if;
  end if;

  return new;
end;
$$;


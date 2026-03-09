-- Subscription model: standard / premium (+ temporary premium access windows)
alter table public.accountants
  add column if not exists subscription_plan text not null default 'standard'
    check (subscription_plan in ('standard', 'premium')),
  add column if not exists premium_until timestamptz;

create index if not exists accountants_subscription_plan_idx
  on public.accountants(subscription_plan);
create index if not exists accountants_premium_until_idx
  on public.accountants(premium_until);

comment on column public.accountants.subscription_plan is 'Base plan: standard or premium';
comment on column public.accountants.premium_until is 'Temporary premium access expiry (used for early-access/trials)';

-- Codes that grant temporary full premium access
create table if not exists public.early_access_codes (
  code text primary key check (char_length(code) >= 6),
  active boolean not null default true,
  valid_days integer not null default 45 check (valid_days > 0 and valid_days <= 365),
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  created_by uuid references public.accountants(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.early_access_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.early_access_codes(code) on delete restrict,
  accountant_id uuid not null unique references public.accountants(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  premium_until timestamptz not null
);

create index if not exists early_access_redemptions_code_idx
  on public.early_access_redemptions(code);

alter table public.early_access_codes enable row level security;
alter table public.early_access_redemptions enable row level security;

-- End users are not allowed to browse codes; only own redemptions are visible.
create policy "early_access_redemptions_select_own"
  on public.early_access_redemptions for select
  using (accountant_id = auth.uid());

create or replace function public.accountant_has_premium_access(p_accountant_id uuid)
returns boolean
language sql
stable
as $$
  select
    coalesce(a.subscription_plan = 'premium', false)
    or (a.premium_until is not null and a.premium_until > now())
  from public.accountants a
  where a.id = p_accountant_id
$$;

create or replace function public.redeem_early_access_code(
  p_code text,
  p_accountant_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.early_access_codes%rowtype;
  v_new_premium_until timestamptz;
begin
  select *
  into v_code
  from public.early_access_codes
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Cod invalid';
  end if;

  if not v_code.active then
    raise exception 'Cod inactiv';
  end if;

  if v_code.expires_at is not null and v_code.expires_at <= now() then
    raise exception 'Cod expirat';
  end if;

  if v_code.used_count >= v_code.max_uses then
    raise exception 'Cod deja utilizat';
  end if;

  if exists (
    select 1
    from public.early_access_redemptions r
    where r.accountant_id = p_accountant_id
  ) then
    raise exception 'Ai folosit deja un cod de early access';
  end if;

  v_new_premium_until := now() + make_interval(days => v_code.valid_days);

  insert into public.early_access_redemptions (code, accountant_id, premium_until)
  values (v_code.code, p_accountant_id, v_new_premium_until);

  update public.early_access_codes
  set used_count = used_count + 1
  where code = v_code.code;

  update public.accountants
  set premium_until = greatest(coalesce(premium_until, now()), v_new_premium_until)
  where id = p_accountant_id;

  return v_new_premium_until;
end;
$$;

create or replace function public.enforce_standard_client_limit()
returns trigger
language plpgsql
as $$
declare
  v_active_clients integer;
begin
  if new.archived is distinct from false then
    return new;
  end if;

  if public.accountant_has_premium_access(new.accountant_id) then
    return new;
  end if;

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

  if v_active_clients >= 40 then
    raise exception 'Ai atins limita de 40 clienți pentru planul Standard. Upgrade la Premium pentru clienți nelimitați.';
  end if;

  return new;
end;
$$;

drop trigger if exists clients_enforce_standard_limit on public.clients;
create trigger clients_enforce_standard_limit
  before insert or update of archived, accountant_id
  on public.clients
  for each row
  execute function public.enforce_standard_client_limit();

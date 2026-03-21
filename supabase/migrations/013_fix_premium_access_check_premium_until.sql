-- Fix mismatch:
-- Frontend considers Premium access when `premium_until` is in the future.
-- Some DB migrations had `accountant_has_premium_access()` also require
-- `subscription_plan = 'premium'`, which breaks early-access/redeem behavior
-- when subscription_plan stays as "none".
--
-- This function must return TRUE whenever `premium_until` is in the future,
-- regardless of `subscription_plan`, so triggers (client limits) behave correctly.

create or replace function public.accountant_has_premium_access(p_accountant_id uuid)
returns boolean
language sql
stable
as $$
  select (a.premium_until is not null and a.premium_until > now())
  from public.accountants a
  where a.id = p_accountant_id;
$$;


-- La înregistrare cu Google (sau alt OAuth), Supabase pune în raw_user_meta_data
-- câmpuri ca full_name, name etc. Actualizăm trigger-ul ca să folosească și full_name.
create or replace function public.handle_new_accountant()
returns trigger as $$
begin
  insert into public.accountants (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

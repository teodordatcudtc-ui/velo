-- Vello: accountants (profile linked to auth.users)
create table public.accountants (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- clients: one per accountant, unique token for upload link
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references public.accountants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  unique_token text not null unique,
  created_at timestamptz default now()
);

create index clients_accountant_id on public.clients(accountant_id);
create index clients_unique_token on public.clients(unique_token);

-- document types: what documents the accountant expects from each client (e.g. "Facturi furnizori")
create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create index document_types_client_id on public.document_types(client_id);

-- uploads: files sent by clients
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  month int not null,
  year int not null,
  created_at timestamptz default now()
);

create index uploads_client_id on public.uploads(client_id);
create index uploads_client_month_year on public.uploads(client_id, year, month);

-- RLS
alter table public.accountants enable row level security;
alter table public.clients enable row level security;
alter table public.document_types enable row level security;
alter table public.uploads enable row level security;

-- accountants: only own row
create policy "accountants_select_own" on public.accountants
  for select using (auth.uid() = id);
create policy "accountants_update_own" on public.accountants
  for update using (auth.uid() = id);
create policy "accountants_insert_own" on public.accountants
  for insert with check (auth.uid() = id);

-- clients: only own accountant's clients
create policy "clients_all_own" on public.clients
  for all using (accountant_id = auth.uid());

-- document_types: via clients
create policy "document_types_all_via_clients" on public.document_types
  for all using (
    exists (
      select 1 from public.clients c
      where c.id = document_types.client_id and c.accountant_id = auth.uid()
    )
  );

-- uploads: accountant can read; insert allowed for anyone with valid client token (handled in app/API)
create policy "uploads_select_via_clients" on public.uploads
  for select using (
    exists (
      select 1 from public.clients c
      where c.id = uploads.client_id and c.accountant_id = auth.uid()
    )
  );

-- Allow anonymous insert for uploads (client upload page uses service role or a dedicated policy)
-- We'll use a different approach: client uploads go through Next.js API that uses service role,
-- or we add a policy that allows insert when... we can't check token in RLS easily.
-- So: uploads INSERT will be done via server-side with service role, or we create a bucket policy.
-- For MVP, uploads insert: allow if client_id exists (anyone can upload to a client - token is in URL and validated in app).
-- Actually the upload page will validate the token in Next.js and then call Supabase. So we need either:
-- 1) Service role in API route (secure, token checked in Next.js)
-- 2) Or a database function that inserts upload if a valid token is passed (complex)
-- We'll use 1: API route with service role, so RLS doesn't need to allow anon insert on uploads.
-- So no insert policy for anon on uploads. Only select for accountant.

-- Storage bucket: create via Supabase dashboard or here
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false);
-- We'll document that the user creates the bucket. Or use SQL if we have access.
-- Policy: allow authenticated (accountant) to read; allow anon to upload? No - we'll upload via API with service key.
-- So storage: allow public read for signed URLs only, and upload via backend.

-- Trigger: create accountant profile on sign up
create or replace function public.handle_new_accountant()
returns trigger as $$
begin
  insert into public.accountants (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_accountant();

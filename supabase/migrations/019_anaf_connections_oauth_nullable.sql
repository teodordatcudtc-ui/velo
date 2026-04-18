-- Permite salvare setări (CUI, activare) înainte de conectarea OAuth; token-ul vine după redirect ANAF.
alter table public.anaf_connections
  alter column oauth_refresh_token drop not null;

alter table public.anaf_connections
  alter column company_cif drop not null;

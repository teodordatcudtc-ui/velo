# Vello

SaaS pentru contabili români — colectare documente de la clienți. Contabilul are cont; clientul primește doar un link unic și uploadează fără cont.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Supabase**: Auth (doar contabil), PostgreSQL, Storage

## Setup

### 1. Variabile de mediu

Copiază `.env.example` în `.env.local` și completează:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

(Service role key e necesară pentru upload-urile clienților, care nu sunt autentificați.)

**Opțional – programare mesaj lunar (email):**

- `RESEND_API_KEY` – cheie API de la [Resend](https://resend.com) (trimite emailurile).
- `RESEND_FROM` – adresa expeditor (ex. `Vello <noreply@domeniul-tau.ro>`). Fără domeniu verificat poți folosi `onboarding@resend.dev` doar pentru teste.
- `CRON_SECRET` – secret pentru a apela `/api/cron/send-reminders` (cron extern sau [cron-job.org](https://cron-job.org)): `GET /api/cron/send-reminders?secret=CRON_SECRET`.
- `NEXT_PUBLIC_APP_URL` – URL-ul aplicației (ex. `https://vello.ro`) pentru linkurile din email.
- `EARLY_ACCESS_ADMIN_EMAIL` – un singur email admin care poate genera coduri early access din pagina Setări.

### 2. Baza de date

În **Supabase Dashboard** → SQL Editor rulează conținutul fișierului:

`supabase/migrations/001_initial.sql`  
apoi `supabase/migrations/002_reminder_settings.sql` (pentru programarea mesajului lunar).
apoi `supabase/migrations/003_reminder_per_client.sql`, `supabase/migrations/004_archived_clients.sql`,
`supabase/migrations/005_document_requests.sql`, `supabase/migrations/006_subscriptions_and_early_access.sql`
și `supabase/migrations/007_document_request_reminder_tracking.sql`.

Aceste scripturi creează tabelele principale, RLS, trigger-ul de contabil, reminder per client, arhivare clienți, cereri de documente, pachete Standard/Premium, coduri early access și limita de 40 clienți pe Standard.

### 3. Storage

În **Supabase Dashboard** → Storage:

1. Creează un bucket numit **`uploads`**.
2. Setări recomandate: **Private** (acces doar prin backend/service role).
3. Politici: nu e nevoie de politici pentru anon; upload-urile se fac din API cu service role.

### 4. Auth (Supabase)

În **Authentication** → URL Configuration:

- **Site URL**: `http://localhost:3000` (dev) sau domeniul tău.
- **Redirect URLs**: adaugă `http://localhost:3000/auth/callback` și, pentru producție, `https://domeniul-tau.ro/auth/callback`.

### 5. Instalare și rulare

```bash
npm install
npm run dev
```

Aplicația rulează la [http://localhost:3000](http://localhost:3000).

## Flux

- **Contabil**: se înregistrează → adaugă clienți (nume, email, telefon) → pentru fiecare client setează tipurile de documente lunare → copiază link-ul unic și îl trimite clientului.
- **Client**: deschide link-ul → vede lista de documente cerute → uploadează fișiere (fără cont).

Link upload: `https://domeniu.ro/upload/<token-unic>`.

## Ce nu e în MVP

- SMS / reminder automat  
- Integrare SAGA  
- Plăți / abonamente  
- Notificări email automate  
- Multi-utilizator / echipe  

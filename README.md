# Deen Tracker — Full MVP

A professional, realtime tracker for daily deen practices with multi-profile support.

## Features

- **Profiles (people) management** - Add and manage multiple people
- **Day-wise tracking** - Track Salah (Fajr, Dhuhr, Asr, Maghrib, Isha), Tahajjud, Morning/Evening Dhikr, Yaseen after Fajr, Mulk before sleep, Before-sleep Dhikr, and Istighfar count
- **Realtime sync** - Changes sync instantly across all open devices
- **Calendar view** - Per-day completion heat map
- **Streaks and weekly summary** - Track progress over time
- **Export CSV** - Download all data

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL from `supabase.sql` in your Supabase SQL editor
   - Enable Realtime for `profiles` and `entries` tables in Database > Replication > Publications
   - Copy your project URL and anon key

3. **Configure environment:**
   - Copy `env.example` to `.env.local`
   - Add your Supabase URL and anon key

4. **Run the project:**
   ```bash
   npm run dev
   ```

## Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Profiles (people)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#3b82f6',
  created_at timestamptz not null default now()
);

-- Daily Entries (one row per person per date)
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  fajr boolean not null default false,
  dhuhr boolean not null default false,
  asr boolean not null default false,
  maghrib boolean not null default false,
  isha boolean not null default false,
  tahajjud boolean not null default false,
  morning_dhikr boolean not null default false,
  evening_dhikr boolean not null default false,
  yaseen_after_fajr boolean not null default false,
  mulk_before_sleep boolean not null default false,
  before_sleep_dhikr boolean not null default false,
  istighfar_count integer not null default 0,
  morning_dhikr_at timestamptz,
  evening_dhikr_at timestamptz,
  sleep_dhikr_at timestamptz,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(profile_id, day)
);

-- Enable RLS
alter table profiles enable row level security;
alter table entries enable row level security;

-- Open policies for MVP (secure later with auth)
create policy "public read profiles" on profiles for select using (true);
create policy "public insert profiles" on profiles for insert with check (true);
create policy "public update profiles" on profiles for update using (true);
create policy "public delete profiles" on profiles for delete using (true);

create policy "public read entries" on entries for select using (true);
create policy "public upsert entries" on entries for insert with check (true);
create policy "public update entries" on entries for update using (true);
create policy "public delete entries" on entries for delete using (true);
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, React
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Styling:** Clean CSS (no framework dependencies)
- **Deployment:** Vercel (frontend) + Supabase (database)

## Usage

1. Add people using the "Add person" field
2. Select a date to track
3. Click checkboxes to mark completed practices
4. Use +/- buttons or direct input for Istighfar count
5. View calendar heatmap for monthly progress
6. Export data as CSV when needed

All changes sync in realtime across devices!

-- ================================================================
-- ADMIN MIGRATION - Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Add new columns to existing tables
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists is_shadowbanned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists ban_expires_at timestamptz;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists is_verified boolean not null default false;

alter table public.posts add column if not exists is_hidden boolean not null default false;
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists is_locked boolean not null default false;
alter table public.posts add column if not exists is_nsfw boolean not null default false;

alter table public.comments add column if not exists is_hidden boolean not null default false;

alter table public.communities add column if not exists is_locked boolean not null default false;
alter table public.communities add column if not exists is_nsfw boolean not null default false;
alter table public.communities add column if not exists is_featured boolean not null default false;

-- Categories table
create table if not exists public.categories (
  id text primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

-- Reports table
create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'pending',
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Admin audit log
create table if not exists public.admin_logs (
  id text primary key default gen_random_uuid()::text,
  admin_id uuid references auth.users(id) on delete set null,
  admin_username text not null,
  action text not null,
  target_type text,
  target_id text,
  details text,
  created_at timestamptz not null default now()
);

-- Site settings
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- IP bans
create table if not exists public.ip_bans (
  id text primary key default gen_random_uuid()::text,
  ip_address text not null unique,
  reason text,
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.categories enable row level security;
alter table public.reports enable row level security;
alter table public.admin_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.ip_bans enable row level security;

-- Categories policies
drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_write" on public.categories;
create policy "categories_select" on public.categories for select using (true);
create policy "categories_write" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Reports policies
drop policy if exists "reports_insert" on public.reports;
drop policy if exists "reports_select_admin" on public.reports;
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_insert" on public.reports for insert with check (auth.role() = 'authenticated');
create policy "reports_select_admin" on public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "reports_update_admin" on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Admin logs policies
drop policy if exists "admin_logs_select" on public.admin_logs;
drop policy if exists "admin_logs_insert" on public.admin_logs;
create policy "admin_logs_select" on public.admin_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_logs_insert" on public.admin_logs for insert with check (true);

-- Site settings policies
drop policy if exists "site_settings_select" on public.site_settings;
drop policy if exists "site_settings_write" on public.site_settings;
create policy "site_settings_select" on public.site_settings for select using (true);
create policy "site_settings_write" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- IP bans policies
drop policy if exists "ip_bans_all" on public.ip_bans;
create policy "ip_bans_all" on public.ip_bans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Seed default data
insert into public.site_settings (key, value) values
  ('site_name', 'RevengeNation'),
  ('maintenance_mode', 'false'),
  ('nsfw_enabled', 'true'),
  ('dms_enabled', 'true'),
  ('site_announcement', ''),
  ('max_posts_per_hour', '10')
on conflict (key) do nothing;

insert into public.categories (id, name) values
  ('betrayal', 'Betrayal'),
  ('revenge', 'Revenge'),
  ('karma', 'Karma'),
  ('toxic-love', 'Toxic Love'),
  ('workplace', 'Workplace'),
  ('family-drama', 'Family Drama'),
  ('friendships', 'Friendships'),
  ('trust-issues', 'Trust Issues')
on conflict (id) do nothing;

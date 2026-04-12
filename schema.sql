-- ================================================================
-- RevengeNation - Supabase Schema
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- Profiles (linked to Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  avatar_emoji text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- User-submitted posts
create table if not exists public.posts (
  id bigint primary key,
  title text not null,
  content text not null,
  full_story text not null,
  author text not null,
  category text not null,
  type text not null default 'post',
  votes int not null default 0,
  image_url text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

-- Comments
create table if not exists public.comments (
  id text primary key,
  post_id bigint not null,
  author text not null,
  body text not null,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

-- Communities
create table if not exists public.communities (
  id text primary key,
  name text unique not null,
  description text not null default '',
  emoji text not null,
  color text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

-- Per-user vote state
create table if not exists public.user_votes (
  user_id uuid references auth.users(id) on delete cascade,
  post_id bigint not null,
  direction text not null check (direction in ('up', 'down')),
  primary key (user_id, post_id)
);

-- Net vote adjustments per post
create table if not exists public.vote_adjustments (
  post_id bigint primary key,
  adjustment int not null default 0
);

-- Admin-deleted post IDs
create table if not exists public.deleted_posts (
  post_id bigint primary key
);

-- OTP codes for email verification (signup/login)
create table if not exists public.otp_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_expires_at_idx on public.otp_codes(expires_at);

-- ================================================================
-- Row Level Security
-- ================================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.communities enable row level security;
alter table public.user_votes enable row level security;
alter table public.vote_adjustments enable row level security;
alter table public.deleted_posts enable row level security;
alter table public.otp_codes enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Posts
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.role() = 'authenticated');
create policy "posts_delete" on public.posts for delete using (true);

-- Comments
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.role() = 'authenticated');
create policy "comments_delete" on public.comments for delete using (true);

-- Communities
create policy "communities_select" on public.communities for select using (true);
create policy "communities_insert" on public.communities for insert with check (auth.role() = 'authenticated');
create policy "communities_delete" on public.communities for delete using (auth.uid() = user_id);

-- User votes
create policy "user_votes_select" on public.user_votes for select using (true);
create policy "user_votes_insert" on public.user_votes for insert with check (auth.uid() = user_id);
create policy "user_votes_update" on public.user_votes for update using (auth.uid() = user_id);
create policy "user_votes_delete" on public.user_votes for delete using (auth.uid() = user_id);

-- Vote adjustments (public for read; authenticated for write)
create policy "vote_adj_select" on public.vote_adjustments for select using (true);
create policy "vote_adj_write" on public.vote_adjustments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Deleted posts (public for read; authenticated for write)
create policy "deleted_select" on public.deleted_posts for select using (true);
create policy "deleted_write" on public.deleted_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ================================================================
-- To make a user admin, run this AFTER they sign up:
-- UPDATE public.profiles SET is_admin = true WHERE username = 'admin';
-- ================================================================

-- ================================================================
-- ADMIN EXTENSION TABLES (run these after the base schema)
-- ================================================================

-- Extra profile columns for admin features
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists is_shadowbanned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists ban_expires_at timestamptz;
alter table public.profiles add column if not exists role text not null default 'user'; -- user | moderator | admin
alter table public.profiles add column if not exists is_verified boolean not null default false;

-- Extra columns for posts
alter table public.posts add column if not exists is_hidden boolean not null default false;
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists is_locked boolean not null default false;
alter table public.posts add column if not exists is_nsfw boolean not null default false;

-- Extra columns for comments
alter table public.comments add column if not exists is_hidden boolean not null default false;

-- Extra columns for communities
alter table public.communities add column if not exists is_locked boolean not null default false;
alter table public.communities add column if not exists is_nsfw boolean not null default false;
alter table public.communities add column if not exists is_featured boolean not null default false;

-- Categories table (admin can add/delete categories)
create table if not exists public.categories (
  id text primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

-- Reports table
create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'community')),
  target_id text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
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

-- Site settings (key-value store)
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Insert default site settings
insert into public.site_settings (key, value) values
  ('site_name', 'RevengeNation'),
  ('maintenance_mode', 'false'),
  ('nsfw_enabled', 'true'),
  ('dms_enabled', 'true'),
  ('site_announcement', ''),
  ('max_posts_per_hour', '10')
on conflict (key) do nothing;

-- IP bans
create table if not exists public.ip_bans (
  id text primary key default gen_random_uuid()::text,
  ip_address text not null unique,
  reason text,
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS for new tables
alter table public.categories enable row level security;
alter table public.reports enable row level security;
alter table public.admin_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.ip_bans enable row level security;

-- Categories: anyone can read
create policy "categories_select" on public.categories for select using (true);
create policy "categories_write" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Reports: authenticated users can insert; only admins can read all
create policy "reports_insert" on public.reports for insert with check (auth.role() = 'authenticated');
create policy "reports_select_admin" on public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "reports_update_admin" on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Admin logs: only admins
create policy "admin_logs_select" on public.admin_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_logs_insert" on public.admin_logs for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Site settings: public read, admin write
create policy "site_settings_select" on public.site_settings for select using (true);
create policy "site_settings_write" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- IP bans: admin only
create policy "ip_bans_all" on public.ip_bans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Default categories (seeded)
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

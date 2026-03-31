-- ================================================================
-- CLEAR ALL TEST DATA
-- WARNING: IRREVERSIBLE — Run in Supabase Dashboard > SQL Editor
-- ================================================================

delete from public.admin_logs;
delete from public.reports;
delete from public.ip_bans;
delete from public.user_votes;
delete from public.comments;
delete from public.communities;
delete from public.posts;
delete from public.profiles;

-- Reset site settings
delete from public.site_settings;
insert into public.site_settings (key, value) values
  ('site_name', 'RevengeNation'),
  ('maintenance_mode', 'false'),
  ('nsfw_enabled', 'true'),
  ('dms_enabled', 'true'),
  ('site_announcement', ''),
  ('max_posts_per_hour', '10'),
  ('featured_videos', '[]');

-- ================================================================
-- AFTER RUNNING THIS:
-- 1. Supabase Dashboard > Authentication > Users > select all > Delete
-- 2. Site par naya account banao (signup)
-- 3. Phir niche wali query run karo apna username daalke:
-- ================================================================

-- update public.profiles set is_admin = true where username = 'tumhara_username';

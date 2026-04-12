import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://revengenationstories.com"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/communities/new`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic story pages — visible (not hidden, not NSFW)
  const { data: posts } = await supabase
    .from("posts")
    .select("id, created_at")
    .eq("is_hidden", false)
    .eq("is_nsfw", false)
    .order("created_at", { ascending: false })
    .limit(5000);

  const storyRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/story/${post.id}`,
    lastModified: new Date(post.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic community pages — not locked, not NSFW
  const { data: communities } = await supabase
    .from("communities")
    .select("id, created_at")
    .eq("is_locked", false)
    .eq("is_nsfw", false)
    .order("created_at", { ascending: false })
    .limit(1000);

  const communityRoutes: MetadataRoute.Sitemap = (communities ?? []).map((community) => ({
    url: `${BASE_URL}/communities/${community.id}`,
    lastModified: new Date(community.created_at),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...storyRoutes, ...communityRoutes];
}

import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import StoryClient from "./StoryClient";
import { slugify } from "@/lib/utils";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://revengenationstories.com").replace(/\/$/, "");

// Server-side Supabase (uses public anon key  posts are public)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function fetchPostMeta(idOrSlug: string): Promise<{ title: string; content: string; metaDescription?: string; id: number; createdAt: string } | null> {
  const supabase = getSupabase();
  // Numeric legacy ID
  if (/^\d+$/.test(idOrSlug)) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, content, meta_description, created_at")
      .eq("id", Number(idOrSlug))
      .maybeSingle();
    if (!data) return null;
    return { id: data.id, title: data.title, content: data.content, metaDescription: data.meta_description ?? undefined, createdAt: data.created_at };
  }
  // Slug-based lookup: scan titles (limit 5000 same as storage.ts)
  const { data: rows } = await supabase
    .from("posts")
    .select("id, title, content, meta_description, created_at")
    .eq("is_hidden", false)
    .limit(5000);
  const match = (rows ?? []).find((p) => slugify(p.title) === idOrSlug);
  if (!match) return null;
  return { id: match.id, title: match.title, content: match.content, metaDescription: match.meta_description ?? undefined, createdAt: match.created_at };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: idOrSlug } = await params;
  const post = await fetchPostMeta(idOrSlug);

  if (!post) {
    return {
      title: "Story | RevengeNation",
      description: "Read real stories of revenge, betrayal, and karma on RevengeNation.",
    };
  }

  const slug = slugify(post.title);
  const canonical = BASE_URL + (slug ? `/story/${slug}` : `/story/${post.id}`);
  const description = post.metaDescription || post.content?.slice(0, 155) || "Read this story on RevengeNation.";

  return {
    title: `${post.title} | RevengeNation`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${post.title} | RevengeNation`,
      description,
      url: canonical,
      siteName: "RevengeNation",
      type: "article",
      publishedTime: post.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default function StoryPage() {
  return <StoryClient />;
}
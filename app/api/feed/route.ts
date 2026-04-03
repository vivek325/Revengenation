import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/redis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_KEY = "feed:v1";
const CACHE_TTL = 60; // 1 minute — so new posts appear quickly

export async function GET() {
  const redis = getRedis();

  // Try Redis cache first
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=60" },
        });
      }
    } catch {
      // Redis error — fall through to Supabase
    }
  }

  // Fetch all public data in parallel
  const [postsRes, votesRes, commentsRes, communitiesRes, deletedRes] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, content, full_story, author, category, type, votes, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("vote_adjustments")
        .select("post_id, adjustment")
        .limit(500),
      supabase.from("comments").select("post_id").limit(5000),
      supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("deleted_posts").select("post_id"),
    ]);

  const votes: Record<number, number> = {};
  (votesRes.data || []).forEach((r) => {
    votes[r.post_id] = r.adjustment;
  });

  const commentCounts: Record<number, number> = {};
  (commentsRes.data || []).forEach((r) => {
    commentCounts[r.post_id] = (commentCounts[r.post_id] || 0) + 1;
  });

  const posts = (postsRes.data || []).map((p) => {
    const excerpt = p.content?.trim()
      || p.full_story?.split("\n").find((l: string) => l.trim().length > 20)?.trim().substring(0, 200)
      || "";
    return {
      id: p.id,
      title: p.title,
      content: excerpt,
      fullStory: "",
      votes: p.votes,
      author: p.author,
      category: p.category,
      type: p.type as "post" | "story",
      imageUrl: p.image_url ?? undefined,
      createdAt: p.created_at,
    };
  });

  const communities = (communitiesRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    emoji: c.emoji,
    color: c.color,
    createdBy: c.created_by,
    createdAt: c.created_at,
    bannerUrl: c.banner_url || undefined,
  }));

  const deletedPostIds: number[] = (deletedRes.data || []).map(
    (r) => r.post_id
  );

  const payload = { posts, votes, commentCounts, communities, deletedPostIds };

  // Store in Redis
  if (redis) {
    try {
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL });
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json(payload, {
    headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=30" },
  });
}

// Call this after creating/deleting a post to bust the Redis cache
export async function DELETE() {
  const redis = getRedis();
  if (redis) {
    try { await redis.del(CACHE_KEY); } catch {}
  }
  return NextResponse.json({ ok: true });
}

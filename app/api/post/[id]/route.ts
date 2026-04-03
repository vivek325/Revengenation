import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/redis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_TTL = 300; // 5 minutes

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ post: null });

  const redis = getRedis();
  const cacheKey = `post:${id}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(
          { post: cached },
          { headers: { "X-Cache": "HIT" } }
        );
      }
    } catch {
      // Fall through
    }
  }

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return NextResponse.json({ post: null });

  const post = {
    id: data.id,
    title: data.title,
    content: data.content,
    fullStory: data.full_story,
    votes: data.votes,
    author: data.author,
    category: data.category,
    type: data.type as "post" | "story",
    imageUrl: data.image_url ?? undefined,
    createdAt: data.created_at,
  };

  if (redis) {
    try {
      await redis.set(cacheKey, post, { ex: CACHE_TTL });
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ post }, { headers: { "X-Cache": "MISS" } });
}

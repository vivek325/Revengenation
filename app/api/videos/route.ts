import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/redis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_KEY = "featured_videos";
const CACHE_TTL = 300; // 5 minutes

export interface FeaturedVideo {
  id: string;
  url: string;
  title: string;
}

export async function GET() {
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get<FeaturedVideo[]>(CACHE_KEY);
      if (cached) return NextResponse.json({ videos: cached });
    } catch {
      // Fall through
    }
  }

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "featured_videos")
    .maybeSingle();

  if (!data?.value) return NextResponse.json({ videos: [] });

  try {
    const videos: FeaturedVideo[] = JSON.parse(data.value);
    if (redis) {
      try {
        await redis.set(CACHE_KEY, videos, { ex: CACHE_TTL });
      } catch {
        // Non-fatal
      }
    }
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}

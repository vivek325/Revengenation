import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/redis";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await req.json();

  const { error } = await supabaseAdmin.from("posts").insert({
    id: post.id,
    title: post.title,
    content: post.content,
    full_story: post.fullStory,
    votes: post.votes ?? 1,
    author: post.author,
    category: post.category,
    type: post.type || "post",
    image_url: post.imageUrl || null,
    is_anonymous: post.author === "Anonymous",
    created_at: post.createdAt,
    user_id: user.id,
    meta_description: post.metaDescription || null,
    tags: post.tags || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bust feed cache so post appears immediately
  const redis = getRedis();
  if (redis) { try { await redis.del("feed:v1"); } catch {} }

  return NextResponse.json({ success: true });
}

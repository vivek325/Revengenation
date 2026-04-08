import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/redis";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAdminUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin, username").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return null;
  return { id: user.id, username: profile.username };
}

async function logAction(adminId: string, adminUsername: string, action: string, targetType?: string, targetId?: string, details?: string) {
  await supabaseAdmin.from("admin_logs").insert({ admin_id: adminId, admin_username: adminUsername, action, target_type: targetType, target_id: targetId, details });
}

// GET: list all communities or posts/comments
export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "communities"; // communities | posts | comments

  if (type === "communities") {
    const { data, error } = await supabaseAdmin.from("communities").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ communities: data });
  }

  if (type === "posts") {
    const { data, error } = await supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
  }

  if (type === "comments") {
    const { data, error } = await supabaseAdmin.from("comments").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comments: data });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, targetType, targetId, value } = body;

  // Community actions
  if (targetType === "community") {
    if (action === "delete") {
      const { error } = await supabaseAdmin.from("communities").delete().eq("id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAction(admin.id, admin.username, "delete_community", "community", targetId);
      return NextResponse.json({ success: true });
    }
    if (action === "toggle_lock") {
      const { data } = await supabaseAdmin.from("communities").select("is_locked").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_locked);
      const { error } = await supabaseAdmin.from("communities").update({ is_locked: newVal }).eq("id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAction(admin.id, admin.username, newVal ? "lock_community" : "unlock_community", "community", targetId);
      return NextResponse.json({ success: true, locked: newVal });
    }
    if (action === "toggle_nsfw") {
      const { data } = await supabaseAdmin.from("communities").select("is_nsfw").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_nsfw);
      const { error } = await supabaseAdmin.from("communities").update({ is_nsfw: newVal }).eq("id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAction(admin.id, admin.username, "toggle_nsfw_community", "community", targetId);
      return NextResponse.json({ success: true, nsfw: newVal });
    }
    if (action === "toggle_feature") {
      const { data } = await supabaseAdmin.from("communities").select("is_featured").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_featured);
      const { error } = await supabaseAdmin.from("communities").update({ is_featured: newVal }).eq("id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAction(admin.id, admin.username, "toggle_feature_community", "community", targetId);
      return NextResponse.json({ success: true, featured: newVal });
    }
  }

  // Post actions
  if (targetType === "post") {
    if (action === "delete") {
      await supabaseAdmin.from("posts").delete().eq("id", targetId);
      await supabaseAdmin.from("deleted_posts").upsert({ post_id: Number(targetId) }, { onConflict: "post_id" });
      await logAction(admin.id, admin.username, "delete_post", "post", targetId);
      const redis = getRedis();
      if (redis) { try { await redis.del("feed:v1"); } catch {} }
      return NextResponse.json({ success: true });
    }
    if (action === "toggle_pin") {
      const { data } = await supabaseAdmin.from("posts").select("is_pinned").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_pinned);
      await supabaseAdmin.from("posts").update({ is_pinned: newVal }).eq("id", targetId);
      await logAction(admin.id, admin.username, newVal ? "pin_post" : "unpin_post", "post", targetId);
      return NextResponse.json({ success: true, pinned: newVal });
    }
    if (action === "toggle_lock") {
      const { data } = await supabaseAdmin.from("posts").select("is_locked").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_locked);
      await supabaseAdmin.from("posts").update({ is_locked: newVal }).eq("id", targetId);
      await logAction(admin.id, admin.username, newVal ? "lock_post" : "unlock_post", "post", targetId);
      return NextResponse.json({ success: true, locked: newVal });
    }
    if (action === "toggle_nsfw") {
      const { data } = await supabaseAdmin.from("posts").select("is_nsfw").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_nsfw);
      await supabaseAdmin.from("posts").update({ is_nsfw: newVal }).eq("id", targetId);
      await logAction(admin.id, admin.username, "toggle_nsfw_post", "post", targetId);
      return NextResponse.json({ success: true, nsfw: newVal });
    }
    if (action === "toggle_hide") {
      const { data } = await supabaseAdmin.from("posts").select("is_hidden").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_hidden);
      await supabaseAdmin.from("posts").update({ is_hidden: newVal }).eq("id", targetId);
      await logAction(admin.id, admin.username, newVal ? "hide_post" : "unhide_post", "post", targetId);
      return NextResponse.json({ success: true, hidden: newVal });
    }
  }

  // Comment actions
  if (targetType === "comment") {
    if (action === "delete") {
      await supabaseAdmin.from("comments").delete().eq("id", targetId);
      await logAction(admin.id, admin.username, "delete_comment", "comment", targetId);
      return NextResponse.json({ success: true });
    }
    if (action === "toggle_hide") {
      const { data } = await supabaseAdmin.from("comments").select("is_hidden").eq("id", targetId).maybeSingle();
      const newVal = !(data?.is_hidden);
      await supabaseAdmin.from("comments").update({ is_hidden: newVal }).eq("id", targetId);
      await logAction(admin.id, admin.username, newVal ? "hide_comment" : "unhide_comment", "comment", targetId);
      return NextResponse.json({ success: true, hidden: newVal });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

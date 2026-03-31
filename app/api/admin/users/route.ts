import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all"; // all | banned | admin | verified

  let query = supabaseAdmin.from("profiles").select("id, username, display_name, avatar_emoji, is_admin, is_banned, is_shadowbanned, ban_reason, ban_expires_at, role, is_verified, created_at").order("created_at", { ascending: false });

  if (search) query = query.ilike("username", `%${search}%`);
  if (filter === "banned") query = query.eq("is_banned", true);
  if (filter === "admin") query = query.eq("is_admin", true);
  if (filter === "verified") query = query.eq("is_verified", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, userId, reason, duration, role } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (action === "ban") {
    const banExpiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null;
    const { error } = await supabaseAdmin.from("profiles").update({
      is_banned: true,
      ban_reason: reason || "Violated community rules",
      ban_expires_at: banExpiresAt,
    }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "ban_user", "user", userId, reason);
    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    const { error } = await supabaseAdmin.from("profiles").update({ is_banned: false, ban_reason: null, ban_expires_at: null }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "unban_user", "user", userId);
    return NextResponse.json({ success: true });
  }

  if (action === "shadowban") {
    const { error } = await supabaseAdmin.from("profiles").update({ is_shadowbanned: true }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "shadowban_user", "user", userId);
    return NextResponse.json({ success: true });
  }

  if (action === "unshadowban") {
    const { error } = await supabaseAdmin.from("profiles").update({ is_shadowbanned: false }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "unshadowban_user", "user", userId);
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "delete_user", "user", userId);
    return NextResponse.json({ success: true });
  }

  if (action === "set_role") {
    const updates: Record<string, unknown> = { role: role || "user" };
    if (role === "admin") updates.is_admin = true;
    if (role === "user") updates.is_admin = false;
    const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "set_role", "user", userId, role);
    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    const { error } = await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "verify_user", "user", userId);
    return NextResponse.json({ success: true });
  }

  if (action === "force_logout") {
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, "global");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "force_logout", "user", userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

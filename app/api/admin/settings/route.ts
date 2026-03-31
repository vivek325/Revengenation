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
  const type = searchParams.get("type") || "settings";

  if (type === "settings") {
    const { data, error } = await supabaseAdmin.from("site_settings").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const settings: Record<string, string> = {};
    (data || []).forEach((r) => { settings[r.key] = r.value; });
    return NextResponse.json({ settings });
  }

  if (type === "categories") {
    const { data, error } = await supabaseAdmin.from("categories").select("*").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ categories: data });
  }

  if (type === "logs") {
    const { data, error } = await supabaseAdmin.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ logs: data });
  }

  if (type === "reports") {
    const status = searchParams.get("status") || "pending";
    const { data, error } = await supabaseAdmin.from("reports").select("*").eq("status", status).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data });
  }

  if (type === "analytics") {
    const [usersRes, postsRes, commentsRes, communitiesRes, bannedRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, created_at", { count: "exact" }),
      supabaseAdmin.from("posts").select("id, created_at, votes", { count: "exact" }),
      supabaseAdmin.from("comments").select("id", { count: "exact" }),
      supabaseAdmin.from("communities").select("id", { count: "exact" }),
      supabaseAdmin.from("profiles").select("id", { count: "exact" }).eq("is_banned", true),
    ]);

    // Posts breakdown by category
    const { data: catData } = await supabaseAdmin.from("posts").select("category");
    const catBreakdown: Record<string, number> = {};
    (catData || []).forEach((p) => { catBreakdown[p.category] = (catBreakdown[p.category] || 0) + 1; });

    // New users last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsersWeek } = await supabaseAdmin.from("profiles").select("id", { count: "exact" }).gte("created_at", weekAgo);

    return NextResponse.json({
      totalUsers: usersRes.count || 0,
      totalPosts: postsRes.count || 0,
      totalComments: commentsRes.count || 0,
      totalCommunities: communitiesRes.count || 0,
      bannedUsers: bannedRes.count || 0,
      newUsersWeek: newUsersWeek || 0,
      categoryBreakdown: catBreakdown,
    });
  }

  if (type === "ip_bans") {
    const { data, error } = await supabaseAdmin.from("ip_bans").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ip_bans: data });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "update_settings") {
    const { settings } = body as { settings: Record<string, string> };
    for (const [key, value] of Object.entries(settings)) {
      await supabaseAdmin.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }
    // Build a clean human-readable summary instead of dumping raw JSON
    const summary = Object.entries(settings).map(([key, value]) => {
      if (key === "featured_videos") {
        try {
          const videos = JSON.parse(value) as { title: string }[];
          return `featured_videos → ${videos.length} video${videos.length !== 1 ? "s" : ""} (${videos.map((v) => v.title).join(", ")})`;
        } catch { return "featured_videos updated"; }
      }
      return `${key}: ${String(value).slice(0, 80)}`;
    }).join(" | ");
    await logAction(admin.id, admin.username, "update_settings", undefined, undefined, summary);
    return NextResponse.json({ success: true });
  }

  if (action === "add_category") {
    const { name } = body;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabaseAdmin.from("categories").insert({ id, name });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "add_category", "category", id, name);
    return NextResponse.json({ success: true, id });
  }

  if (action === "delete_category") {
    const { id } = body;
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "delete_category", "category", id);
    return NextResponse.json({ success: true });
  }

  if (action === "resolve_report") {
    const { reportId, resolution } = body;
    await supabaseAdmin.from("reports").update({
      status: resolution,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", reportId);
    await logAction(admin.id, admin.username, "resolve_report", "report", reportId, resolution);
    return NextResponse.json({ success: true });
  }

  if (action === "add_ip_ban") {
    const { ip, reason } = body;
    const { error } = await supabaseAdmin.from("ip_bans").insert({ ip_address: ip, reason, banned_by: admin.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(admin.id, admin.username, "add_ip_ban", "ip", ip, reason);
    return NextResponse.json({ success: true });
  }

  if (action === "remove_ip_ban") {
    const { id } = body;
    await supabaseAdmin.from("ip_bans").delete().eq("id", id);
    await logAction(admin.id, admin.username, "remove_ip_ban", "ip", id);
    return NextResponse.json({ success: true });
  }

  if (action === "send_announcement") {
    const { message } = body;
    await supabaseAdmin.from("site_settings").upsert({ key: "site_announcement", value: message, updated_at: new Date().toISOString() }, { onConflict: "key" });
    await logAction(admin.id, admin.username, "send_announcement", undefined, undefined, message);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

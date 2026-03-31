import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`complete-signup:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signup attempts. Please wait before trying again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { email, password, username, avatarUrl, avatarEmoji } = body;

  const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase().slice(0, 254);
  const trimmed = (typeof username === "string" ? username : "").trim().toLowerCase().slice(0, 30);
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanEmail || !cleanPassword || !trimmed) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (trimmed.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return NextResponse.json({ error: "Username can only contain letters, numbers and underscores." }, { status: 400 });
  }
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (cleanPassword.length > 128) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }

  // Check username availability
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Username already taken." }, { status: 400 });
  }

  const cleanAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.slice(0, 500) : null;
  const cleanAvatarEmoji = typeof avatarEmoji === "string" ? avatarEmoji.slice(0, 10) : null;
  const displayName = (typeof username === "string" ? username : "").trim().slice(0, 50);

  // Create user with email pre-confirmed (bypasses confirmation email)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: {
      username: trimmed,
      display_name: displayName,
      avatar_url: cleanAvatarUrl,
      avatar_emoji: cleanAvatarEmoji,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create profile manually (in case trigger doesn't fire)
  if (data.user) {
    await supabaseAdmin.from("profiles").upsert(
      {
        id: data.user.id,
        username: trimmed,
        display_name: displayName,
        bio: "",
        avatar_url: cleanAvatarUrl,
        avatar_emoji: cleanAvatarEmoji,
        is_admin: false,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    // Server-to-server auth: EC2 (Mumbai) → Supabase (Mumbai) — fast & reliable
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), password: String(password) }),
      signal: AbortSignal.timeout(30000),
    });

    const authData = await authRes.json();
    if (!authRes.ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userId = authData.user?.id;
    const expiresIn = authData.expires_in || 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Fetch profile in parallel — no extra round-trip from client
    let username = "";
    let isAdmin = false;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("username, is_admin")
        .eq("id", userId)
        .maybeSingle();
      username = profile?.username || "";
      isAdmin = profile?.is_admin || false;
    }

    return NextResponse.json({
      // Full Supabase session — client writes to localStorage directly, no setSession() call
      access_token: authData.access_token,
      token_type: "bearer",
      expires_in: expiresIn,
      expires_at: expiresAt,
      refresh_token: authData.refresh_token,
      user: authData.user,
      // Our app profile
      profile: { username, isAdmin },
    });
  } catch {
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

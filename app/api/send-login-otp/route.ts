import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`otp-send:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { email } = body;
  const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase().slice(0, 254);

  if (!cleanEmail || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Check user exists via profiles table (safe — no full user list exposure)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  // Always return same response to prevent email enumeration
  if (!profile) {
    return NextResponse.json({ success: true });
  }

  // Generate 8-digit OTP
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: dbErr } = await supabaseAdmin
    .from("otp_codes")
    .upsert({ email: `login:${cleanEmail}`, code, expires_at: expiresAt, attempts: 0 }, { onConflict: "email" });

  if (dbErr) {
    return NextResponse.json({ error: "Database error. Please try again." }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RevengeNation <noreply@revengenationstories.com>",
      to: [cleanEmail],
      subject: "Your RevengeNation login code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#08080E;color:#E2E8F0;padding:32px;border-radius:16px;">
          <h2 style="color:#E11D48;margin-bottom:8px;">Your login code</h2>
          <p style="color:#94A3B8;margin-bottom:24px;">Enter this code to sign in to RevengeNation:</p>
          <div style="background:#1A1A28;border:1px solid #2A2A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#E11D48;">${code}</span>
          </div>
          <p style="color:#64748B;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err?.message || "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","trashmail.com","trashmail.me","yopmail.com",
  "tempmail.com","temp-mail.org","throwam.com","discard.email","maildrop.cc",
  "fakeinbox.com","10minutemail.com","20minutemail.com","emailondeck.com",
  "spamgourmet.com","getairmail.com","filzmail.com","tempr.email","guerrillamail.net",
  "guerrillamail.org","guerrillamail.biz","guerrillamail.de","grr.la","sharklasers.com",
  "spam4.me","dispostable.com","spambox.us","mailnull.com","spamtrail.com",
]);

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

  const domain = cleanEmail.split("@")[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return NextResponse.json({ error: "Temporary/disposable emails are not allowed." }, { status: 400 });
  }

  // Check if email is already registered (via auth.users using admin API)
  const listRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(cleanEmail)}&per_page=1`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );
  if (listRes.ok) {
    const listJson = await listRes.json();
    const users: unknown[] = listJson?.users ?? [];
    if (users.length > 0) {
      return NextResponse.json({ error: "This email is already registered. Please log in instead." }, { status: 400 });
    }
  }

  // Generate 8-digit OTP
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store in DB
  const { error: dbErr } = await supabaseAdmin
    .from("otp_codes")
    .upsert({ email: cleanEmail, code, expires_at: expiresAt, attempts: 0 }, { onConflict: "email" });

  if (dbErr) {
    return NextResponse.json({ error: "Database error. Please try again." }, { status: 500 });
  }

  // Send via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RevengeNation <noreply@revengenationstories.com>",
      to: [cleanEmail],
      subject: "Your RevengeNation verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#08080E;color:#E2E8F0;padding:32px;border-radius:16px;">
          <h2 style="color:#E11D48;margin-bottom:8px;">Verify your email</h2>
          <p style="color:#94A3B8;margin-bottom:24px;">Enter this code to complete your signup:</p>
          <div style="background:#1A1A28;border:1px solid #2A2A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#E11D48;">${code}</span>
          </div>
          <p style="color:#64748B;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#64748B;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data.message || "Failed to send email. Check your RESEND_API_KEY." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

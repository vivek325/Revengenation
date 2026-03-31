import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`otp-verify:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { email, code } = body;
  const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase().slice(0, 254);
  const cleanCode = (typeof code === "string" ? code : "").trim().slice(0, 20);

  if (!cleanEmail || !cleanCode) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("otp_codes")
    .select("code, expires_at, attempts")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Code not found. Please request a new one." }, { status: 400 });
  }

  if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
    await supabaseAdmin.from("otp_codes").delete().eq("email", cleanEmail);
    return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 400 });
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from("otp_codes").delete().eq("email", cleanEmail);
    return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
  }

  if (data.code !== cleanCode) {
    await supabaseAdmin.from("otp_codes").update({ attempts: (data.attempts ?? 0) + 1 }).eq("email", cleanEmail);
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  // Delete used code
  await supabaseAdmin.from("otp_codes").delete().eq("email", cleanEmail);

  return NextResponse.json({ success: true });
}

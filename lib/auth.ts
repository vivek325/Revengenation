import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

// Common disposable / temp email domains — blocked on signup
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.info","grr.la","sharklasers.com",
  "guerrillamailblock.com","spam4.me","trashmail.com","trashmail.me","trashmail.net",
  "trashmail.at","trashmail.io","trashmail.org","trash-mail.at","dispostable.com",
  "yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf","nospam.ze.tc","nomail.xl.cx",
  "mega.zik.dj","speed.1s.fr","courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf",
  "monmail.fr.nf","tempmail.com","temp-mail.org","temp-mail.ru","tempmail.net",
  "tempinbox.com","throwam.com","throwam.net","mailnull.com","spamgourmet.com",
  "spamgourmet.net","spamgourmet.org","spamgourmet.com","getairmail.com","filzmail.com",
  "throwam.com","discard.email","spamfree24.org","maildrop.cc","mailnesia.com",
  "mailnull.com","spamheremerc.com","tempr.email","discard.email","fakeinbox.com",
  "mailnew.com","mailscrap.com","mailtemp.info","meltmail.com","momentics.ru",
  "moredates.com","nobulk.com","noclickemail.com","nogmailspam.info","nomail.pw",
  "nomail.xl.cx","nospamfor.us","nospamthanks.info","notmailinator.com","nowmymail.com",
  "objectmail.com","obobbo.com","odnorazovoe.ru","oneoffmail.com","onewaymail.com",
  "opentrash.com","owlpic.com","pookmail.com","proxymail.eu.org","putthisinyourspamdatabase.com",
  "qq.com","rcpt.at","reallymymail.com","reconmail.com","recyclemail.dk",
  "0-mail.com","0815.ru","0clickemail.com","0wnd.net","0wnd.org","10minutemail.com",
  "10minutemail.net","10minutemail.org","20minutemail.com","20minutemail.it",
  "disposableaddress.com","disposableemailaddresses.com","disposableinbox.com",
  "fakemailgenerator.com","fakemail.fr","throwablemail.com","throwam.com",
  "spambox.us","spamcannibal.org","spamcannon.com","spamcannon.net","spamdaemon.com",
  "spamex.com","spamfree.eu","spamgob.com","spamherelots.com","spamspot.com",
  "spamstack.net","spamthisplease.com","spamtrail.com","spamtroll.net","tempsky.com",
  "tmailinator.com","trbvm.com","treinamento.cf","trbvm.com","trbvn.com",
  "emailondeck.com","sneakemail.com","safetymail.info","sogetthis.com","spaml.de",
]);

function isValidEmailFormat(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

function isBlockedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && BLOCKED_DOMAINS.has(domain);
}

/** Register a new user. Returns error string on failure, null on success. */
export async function signUp(
  email: string,
  password: string,
  username: string,
  avatarUrl?: string,
  avatarEmoji?: string
): Promise<string | null> {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) return "Username must be at least 3 characters.";
  if (password.length < 6) return "Password must be at least 6 characters.";

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmailFormat(cleanEmail)) return "Please enter a valid email address.";
  if (isBlockedEmail(cleanEmail)) return "Temporary/disposable email addresses are not allowed.";

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", trimmed)
    .maybeSingle();

  if (existing) return "Username already taken.";

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        username: trimmed,
        display_name: username.trim(),
        avatar_url: avatarUrl || null,
        avatar_emoji: avatarEmoji || null,
      },
    },
  });
  if (error) return error.message;
  if (!data.user) return "Signup failed. Please try again.";
  // If email confirmation is enabled but we want to auto-login, sign in immediately
  if (data.session === null && data.user) {
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginErr) return null; // account created, just needs login
  }
  return null;
}

/** Step 1 of OTP signup: send verification code to email */
export async function sendSignupVerification(email: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmailFormat(cleanEmail)) return "Please enter a valid email address.";
  if (isBlockedEmail(cleanEmail)) return "Temporary/disposable email addresses are not allowed.";
  const res = await fetch("/api/send-signup-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json();
  if (!res.ok) return data.error || "Failed to send verification code.";
  return null;
}

/** Step 2 of OTP signup: verify the email code */
export async function verifySignupOtp(email: string, token: string): Promise<string | null> {
  const res = await fetch("/api/verify-signup-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), code: token.trim() }),
  });
  const data = await res.json();
  if (!res.ok) return data.error || "Invalid or expired code. Please try again.";
  return null;
}

/** Step 3 of OTP signup: register with email + password after email verified */
export async function completeSignup(
  email: string,
  username: string,
  password: string,
  avatarUrl?: string,
  avatarEmoji?: string,
): Promise<string | null> {
  // Use server-side admin route to create user with email pre-confirmed
  const res = await fetch("/api/complete-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password, username, avatarUrl, avatarEmoji }),
  });
  const result = await res.json();
  if (!res.ok) return result.error || "Failed to create account.";

  // Sign in after account created
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (signInErr) return signInErr.message;

  return null;
}

/** Login with email + password. Returns error string on failure, null on success. */
export async function login(email: string, password: string): Promise<string | null> {
  clearSessionCache();
  try {
    // Call our server API route — EC2→Supabase (both Mumbai) is fast & reliable
    // Avoids browser→Supabase latency/timeout issues entirely
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Invalid email or password.";

    // Set the session on the browser Supabase client using the returned tokens
    const { error: sessErr } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (sessErr) return "Failed to establish session. Please try again.";
    return null;
  } catch {
    return "Login failed. Please check your connection and try again.";
  }
}

/** Send a 6-digit OTP to the given email. Returns error string or null. */
export async function sendOtp(email: string): Promise<string | null> {
  const res = await fetch("/api/send-login-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) return data.error || "Failed to send code.";
  return null;
}

/** Verify the OTP code. Returns error string or null on success. */
export async function verifyOtp(email: string, token: string): Promise<string | null> {
  const res = await fetch("/api/verify-login-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: token }),
  });
  const data = await res.json();
  if (!res.ok) return data.error || "Invalid or expired OTP. Please try again.";

  // Use the hashed token to establish a session
  if (data.token) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token,
      type: "magiclink",
    });
    if (error) return "Failed to sign in. Please try again.";
  }
  return null;
}

/** Send password reset email. Returns error string or null. */
export async function sendPasswordReset(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return error.message;
  return null;
}

/** Sign out the current user. */
export async function logout(): Promise<void> {
  clearSessionCache();
  await supabase.auth.signOut();
}

// In-memory session cache — avoids repeated Supabase round-trips
let _sessionCache: AuthUser | null = null;
let _sessionCacheAt = 0;
const SESSION_TTL = 300_000; // 5 minutes
const LS_KEY = "rn_session_v1";

/** Persist session to localStorage for instant load across page navigations */
function saveSessionToStorage(user: AuthUser) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, at: Date.now() }));
  } catch {}
}

/** Read session from localStorage if fresh */
function readSessionFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { user, at } = JSON.parse(raw);
    if (Date.now() - at < SESSION_TTL) return user as AuthUser;
  } catch {}
  return null;
}

/** Invalidate the cached session (call on login/logout). */
export function clearSessionCache() {
  _sessionCache = null;
  _sessionCacheAt = 0;
  try { localStorage.removeItem(LS_KEY); } catch {}
}

/** Synchronously read session from localStorage — safe to call on client before any async. */
export function getSessionSync(): AuthUser | null {
  if (typeof window === "undefined") return null;
  return readSessionFromStorage();
}

/** Get the current logged-in user with profile. Returns null if not logged in. */
export async function getSession(): Promise<AuthUser | null> {
  // 1. In-memory cache (fastest)
  if (_sessionCache && Date.now() - _sessionCacheAt < SESSION_TTL) {
    return _sessionCache;
  }

  // 2. localStorage cache (fast, survives page reload)
  const stored = readSessionFromStorage();
  if (stored) {
    _sessionCache = stored;
    _sessionCacheAt = Date.now();
    return stored;
  }

  // 3. Supabase auth (reads localStorage token — no network)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    _sessionCache = null;
    return null;
  }
  const user = session.user;

  // 4. Only DB call: fetch profile (only on first visit or after cache expires)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    _sessionCache = null;
    return null;
  }

  _sessionCache = {
    id: user.id,
    username: profile.username,
    email: user.email || "",
    isAdmin: profile.is_admin || false,
  };
  _sessionCacheAt = Date.now();
  saveSessionToStorage(_sessionCache);
  return _sessionCache;
}


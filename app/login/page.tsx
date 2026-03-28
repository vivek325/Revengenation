"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, signUp, initDemoUser } from "@/lib/auth";
import { saveProfile } from "@/lib/storage";

const PRESET_AVATARS = [
  { emoji: "🔥", bg: "from-[#E11D48] to-[#F97316]" },
  { emoji: "💀", bg: "from-[#7C3AED] to-[#4C1D95]" },
  { emoji: "⚡", bg: "from-[#F59E0B] to-[#DC2626]" },
  { emoji: "🌙", bg: "from-[#1D4ED8] to-[#4C1D95]" },
  { emoji: "🐺", bg: "from-[#374151] to-[#1F2937]" },
  { emoji: "🦋", bg: "from-[#0891B2] to-[#7C3AED]" },
  { emoji: "🌹", bg: "from-[#BE185D] to-[#7C3AED]" },
  { emoji: "👁️", bg: "from-[#065F46] to-[#1D4ED8]" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08080E] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#E11D48] border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 fields
  const [username, setUsername] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { initDemoUser(); }, []);

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setSignupStep(1);
    setError("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = login(loginUsername, loginPassword);
    if (err) { setError(err); setLoading(false); return; }
    router.push(redirectTo);
    router.refresh();
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSignupStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = signUp(username, password, email);
    if (err) { setError(err); setLoading(false); return; }
    saveProfile({
      username: username.trim().toLowerCase(),
      displayName: username.trim(),
      bio: "",
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(selectedEmoji ? { avatarEmoji: selectedEmoji } : {}),
    });
    router.push(redirectTo);
    router.refresh();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
      setSelectedEmoji(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#08080E]">
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="h-1" style={{ background: "linear-gradient(90deg, #E11D48, #7C3AED)" }} />

            <div className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-white text-2xl font-black text-center mb-1">
                {mode === "login"
                  ? "Welcome back"
                  : signupStep === 1
                  ? "Join RevengeNation"
                  : "Set up your profile"}
              </h1>
              <p className="text-[#475569] text-sm text-center mb-8">
                {mode === "login"
                  ? "Log in to share and vote on stories"
                  : signupStep === 1
                  ? "Create an account to share your story"
                  : "Pick a username and avatar"}
              </p>

              {/* Tab switcher */}
              <div className="flex bg-[#1A1A28] rounded-xl p-1 mb-6">
                <button
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    mode === "login" ? "bg-[#E11D48] text-white" : "text-[#64748B] hover:text-white"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    mode === "signup" ? "bg-[#E11D48] text-white" : "text-[#64748B] hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* ── LOGIN FORM ── */}
              {mode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Username</label>
                    <input
                      type="text" value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="your_username" autoComplete="username" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Password</label>
                    <input
                      type="password" value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  {error && <ErrorBox message={error} />}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-[#E11D48] hover:bg-[#BE1239] disabled:opacity-60 text-white font-bold rounded-xl transition-colors mt-2">
                    {loading ? "Please wait…" : "Log In"}
                  </button>
                </form>
              )}

              {/* ── SIGNUP STEP 1: email + password ── */}
              {mode === "signup" && signupStep === 1 && (
                <form onSubmit={handleStep1} className="space-y-4">
                  {/* Step dots */}
                  <div className="flex justify-end gap-1.5 mb-1">
                    <div className="w-8 h-1 rounded-full bg-[#E11D48]" />
                    <div className="w-8 h-1 rounded-full bg-[#2A2A3E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Password</label>
                    <input
                      type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" autoComplete="new-password" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <input
                      type="password" value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  {error && <ErrorBox message={error} />}
                  <button type="submit"
                    className="w-full py-3 bg-[#E11D48] hover:bg-[#BE1239] text-white font-bold rounded-xl transition-colors mt-2">
                    Continue →
                  </button>
                </form>
              )}

              {/* ── SIGNUP STEP 2: username + avatar ── */}
              {mode === "signup" && signupStep === 2 && (
                <form onSubmit={handleStep2} className="space-y-5">
                  {/* Step dots + back */}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setSignupStep(1); setError(""); }}
                      className="text-[#64748B] hover:text-white transition-colors text-sm">
                      ← Back
                    </button>
                    <div className="flex gap-1.5 ml-auto">
                      <div className="w-8 h-1 rounded-full bg-[#E11D48]" />
                      <div className="w-8 h-1 rounded-full bg-[#E11D48]" />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Username</label>
                    <input
                      type="text" value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="choose_a_username" autoComplete="username" required
                      className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>

                  {/* Avatar picker */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">
                      Choose Avatar <span className="normal-case text-[#2A2A40] font-normal">(optional)</span>
                    </label>

                    {/* Preset grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {PRESET_AVATARS.map(({ emoji, bg }) => (
                        <button key={emoji} type="button"
                          onClick={() => { setSelectedEmoji(emoji); setAvatarUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className={`aspect-square rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-2xl transition-all ${
                            selectedEmoji === emoji
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[#0F0F18] scale-105"
                              : "hover:scale-105 opacity-75 hover:opacity-100"
                          }`}>
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Upload */}
                    {avatarUrl ? (
                      <div className="flex items-center gap-3 bg-[#1A1A28] rounded-xl px-3 py-2">
                        <img src={avatarUrl} alt="avatar preview" className="w-10 h-10 rounded-lg object-cover ring-2 ring-[#E11D48]" />
                        <span className="text-white text-xs flex-1">Custom image</span>
                        <button type="button"
                          onClick={() => { setAvatarUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className="text-xs text-[#64748B] hover:text-[#E11D48] transition-colors">
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full py-2.5 border border-dashed border-[#2A2A3E] hover:border-[#E11D48]/50 rounded-xl text-[#64748B] hover:text-white text-xs transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload your own image
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </div>

                  {error && <ErrorBox message={error} />}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-[#E11D48] hover:bg-[#BE1239] disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                    {loading ? "Creating account…" : "Create Account 🔥"}
                  </button>
                </form>
              )}

              {/* Admin hint */}
              <div className="mt-6 pt-6 border-t border-[#1E1E2E]">
                <p className="text-center text-xs text-[#2A2A40]">
                  Admin?{" "}
                  <button
                    onClick={() => { switchMode("login"); setLoginUsername("admin"); }}
                    className="text-[#475569] hover:text-[#64748B] underline transition-colors"
                  >
                    Use your admin credentials
                  </button>
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[#2A2A40] text-xs mt-6">
            All stories are 100% anonymous.{" "}
            <Link href="/" className="text-[#475569] hover:text-[#64748B] underline">
              Browse without account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-xl px-4 py-3">
      <svg className="w-4 h-4 text-[#E11D48] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-[#E11D48] text-xs font-medium">{message}</p>
    </div>
  );
}

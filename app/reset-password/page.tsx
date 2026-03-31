"use client";

import { useState, useEffect, Suspense } from "react";
import RNLoader from "@/components/RNLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<RNLoader />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session in the URL hash when user clicks reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-2xl overflow-hidden">
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

            {done ? (
              <div className="text-center space-y-4">
                <div className="text-5xl">✅</div>
                <h1 className="text-slate-900 dark:text-white text-xl font-black">Password Updated!</h1>
                <p className="text-[#64748B] text-sm">Redirecting you to home…</p>
              </div>
            ) : !ready ? (
              <div className="text-center space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-[#E11D48] border-t-transparent animate-spin mx-auto" />
                <h1 className="text-slate-900 dark:text-white text-xl font-black">Reset Password</h1>
                <p className="text-[#64748B] text-sm">Waiting for reset link verification…</p>
                <p className="text-[#475569] text-xs">Make sure you opened this page from the reset email link.</p>
                <Link href="/login" className="block text-[#E11D48] text-sm hover:underline">
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-slate-900 dark:text-white text-2xl font-black text-center mb-1">Set New Password</h1>
                <p className="text-[#475569] text-sm text-center mb-8">Choose a strong new password</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">New Password</label>
                    <input
                      type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" autoComplete="new-password" required
                      className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <input
                      type="password" value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password" required
                      className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-[#475569] text-sm outline-none transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-xl px-4 py-3">
                      <p className="text-[#E11D48] text-xs font-medium">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-[#E11D48] hover:bg-[#BE1239] disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                    {loading ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

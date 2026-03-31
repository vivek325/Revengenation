"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import RNLoader from "@/components/RNLoader";
import { login, getSession, logout } from "@/lib/auth";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<RNLoader />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError("");
    setLoading(true);

    try {
      const loginErr = await login(email.trim(), password);
      if (loginErr) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Check admin status
      const session = await getSession();
      if (!session?.isAdmin) {
        await logout();
        setError("Access denied. This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">⚔️</span>
            <span className="text-xl font-bold text-gray-900">RevengeNation</span>
          </div>
          <p className="text-gray-500 text-sm">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-gray-900 font-semibold text-lg mb-1">Admin Sign In</h1>
          <p className="text-gray-400 text-xs mb-6">Restricted access — admins only</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d7263d] focus:ring-1 focus:ring-[#d7263d] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d7263d] focus:ring-1 focus:ring-[#d7263d] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d7263d] hover:bg-[#b91c2e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Not an admin?{" "}
          <a href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
            Go home
          </a>
        </p>
      </div>
    </div>
  );
}

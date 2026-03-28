"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCommunity, getUserCommunities } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import type { Community } from "@/types";

const EMOJI_OPTIONS = [
  "🔥","⚔️","💔","🔪","☯️","💼","🏠","🤝","🔒","😈","👑","🌪️",
  "🩸","🐍","🎭","💣","🌑","⚡","🕵️","🧨","💥","🤬","🫀","🌹",
];

const COLOR_OPTIONS = [
  "#E11D48","#A855F7","#3B82F6","#F59E0B","#22C55E","#EC4899",
  "#F97316","#14B8A6","#EF4444","#8B5CF6","#06B6D4","#64748B",
];

export default function NewCommunityPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [color, setColor] = useState("#E11D48");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login?redirect=/communities/new");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#08080E] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#E11D48] border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) { setError("Community name is required."); return; }
    if (trimmed.length < 3) { setError("Name must be at least 3 characters."); return; }
    if (trimmed.length > 30) { setError("Name must be 30 characters or less."); return; }

    // Check for duplicates (built-in + user-created)
    const BUILT_IN = ["Betrayal","Revenge","Karma","Toxic Love","Workplace","Family Drama","Friendships","Trust Issues"];
    const existing = getUserCommunities().map((c) => c.name.toLowerCase());
    if (
      BUILT_IN.some((b) => b.toLowerCase() === trimmed.toLowerCase()) ||
      existing.includes(trimmed.toLowerCase())
    ) {
      setError("A community with that name already exists.");
      return;
    }

    setLoading(true);
    const session = getSession();
    const community: Community = {
      id: Date.now().toString(),
      name: trimmed,
      emoji,
      color,
      description: description.trim(),
      createdBy: session?.username ?? "anonymous",
      createdAt: new Date().toISOString(),
    };
    addCommunity(community);
    setTimeout(() => router.push("/"), 400);
  };

  return (
    <div className="min-h-screen bg-[#08080E]">

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#475569] mb-6">
          <Link href="/" className="hover:text-[#94A3B8] transition-colors">Home</Link>
          <span>›</span>
          <span className="text-[#94A3B8]">Create Community</span>
        </div>

        <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: "linear-gradient(90deg, #E11D48, #7C3AED)" }} />

          <div className="p-8">
            <h1 className="text-white text-2xl font-black mb-1">Create a Community</h1>
            <p className="text-[#475569] text-sm mb-8">
              Add a new story category that others can post to.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview */}
              <div className="flex items-center gap-3 p-4 bg-[#1A1A28] border border-[#2A2A3E] rounded-xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: color + "22", border: `1px solid ${color}44` }}
                >
                  {emoji}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {name.trim() || "Community Name"}
                  </p>
                  <p className="text-[#475569] text-xs mt-0.5">
                    {description.trim() || "Your community description"}
                  </p>
                </div>
                <span
                  className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: color + "22", color }}
                >
                  {name.trim() || "Category"}
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cheating Partners"
                  maxLength={30}
                  required
                  className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors"
                />
                <p className="text-[#2A2A40] text-xs mt-1 text-right">{name.length}/30</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of stories belong here?"
                  maxLength={120}
                  rows={2}
                  className="w-full bg-[#1A1A28] border border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm outline-none transition-colors resize-none"
                />
              </div>

              {/* Emoji picker */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl transition-colors ${
                        emoji === e
                          ? "bg-[#E11D48]/20 border-2 border-[#E11D48]/60"
                          : "bg-[#1A1A28] border border-[#2A2A3E] hover:bg-[#2A2A3E]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-[#E11D48] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-[#E11D48] text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] hover:text-white hover:bg-[#1A1A28] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#E11D48] hover:bg-[#BE1239] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

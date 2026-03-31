"use client";

import { useState, useEffect } from "react";
import RNLoader from "@/components/RNLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCommunity, getUserCommunities, joinCommunity } from "@/lib/storage";
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [color, setColor] = useState("#E11D48");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const session = await getSession();
      if (!session) {
        router.replace("/login?redirect=/communities/new");
      } else {
        setCurrentUserId(session.id);
        setCurrentUsername(session.username);
        setAuthChecked(true);
      }
    }
    check();
  }, [router]);

  if (!authChecked) return <RNLoader />;

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Banner max size is 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) { setError("Community name is required."); return; }

    const BUILT_IN = ["Betrayal","Revenge","Karma","Toxic Love","Workplace","Family Drama","Friendships","Trust Issues"];
    const existing = (await getUserCommunities()).map((c) => c.name.toLowerCase());
    if (
      BUILT_IN.some((b) => b.toLowerCase() === trimmed.toLowerCase()) ||
      existing.includes(trimmed.toLowerCase())
    ) {
      setError("A community with that name already exists.");
      return;
    }

    setLoading(true);
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const community: Community = {
      id: slug,
      name: trimmed,
      emoji,
      color,
      description: description.trim(),
      createdBy: currentUsername || "anonymous",
      createdAt: new Date().toISOString(),
      bannerUrl: bannerPreview || undefined,
    };
    await addCommunity(community, currentUserId);
    // Auto-join the community as creator
    if (currentUserId) await joinCommunity(slug, currentUserId);
    setTimeout(() => router.push(`/communities/${slug}`), 400);
  };

  return (
    <div className="min-h-screen">

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#475569] mb-6">
          <Link href="/" className="hover:text-[#94A3B8] transition-colors">Home</Link>
          <span>›</span>
          <span className="text-[#94A3B8]">Create Community</span>
        </div>

        <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: "linear-gradient(90deg, #E11D48, #7C3AED)" }} />

          <div className="p-8">
            <h1 className="text-slate-900 dark:text-white text-2xl font-black mb-1">Create a Community</h1>
            <p className="text-[#475569] text-sm mb-8">
              Add a new story category that others can post to.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview */}
              <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] rounded-xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: color + "22", border: `1px solid ${color}44` }}
                >
                  {emoji}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: name.trim() ? "white" : color }}>
                    {name.trim() || "Community Name"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: description.trim() ? "#94A3B8" : color + "BB" }}>
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
                  required
                  className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-[#475569] text-sm outline-none transition-colors"
                />
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
                  rows={2}
                  className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-[#475569] text-sm outline-none transition-colors resize-none"
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
                          : "bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] hover:bg-[#2A2A3E]"
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

              {/* Banner upload */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                  Banner Image <span className="normal-case text-[#2A2A40] font-normal">(optional)</span>
                </label>
                {bannerPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-[#2A2A3E]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bannerPreview} alt="banner preview" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => setBannerPreview(null)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-4 py-4 bg-slate-100 dark:bg-[#1A1A28] border border-dashed border-slate-300 dark:border-[#2A2A3E] hover:border-[#E11D48]/50 rounded-xl cursor-pointer transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-[#08080E] flex items-center justify-center shrink-0 group-hover:bg-[#E11D48]/10 transition-colors">
                      <svg className="w-4 h-4 text-[#64748B] group-hover:text-[#E11D48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs font-semibold group-dark:hover:text-white hover:text-slate-800 transition-colors">Upload a banner</p>
                      <p className="text-[#475569] text-[10px] mt-0.5">PNG, JPG · max 5 MB · recommended 1200×300</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                  </label>
                )}
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
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] dark:hover:text-white hover:text-slate-800 hover:bg-slate-100 dark:bg-[#1A1A28] transition-colors"
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserAddedPosts, saveUserAddedPosts, getUserCommunities } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import type { Post } from "@/types";

const BASE_CATEGORIES = [
  "Red Flag Guide",
  "Psychology & Mindset",
  "Stories",
  "How-To Guides",
  "Relationship Advice",
  "Listicle/Roundup",
];

const FLAIR_COLORS: Record<string, string> = {
  "Red Flag Guide": "#EF4444",
  "Psychology & Mindset": "#8B5CF6",
  "Stories": "#F59E0B",
  "How-To Guides": "#3B82F6",
  "Relationship Advice": "#EC4899",
  "Listicle/Roundup": "#10B981",
};

type ModeType = "post" | "story";

export default function SubmitPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState<ModeType>("post");
  const [categories, setCategories] = useState<string[]>(BASE_CATEGORIES);
  const [category, setCategory] = useState("Red Flag Guide");
  const [form, setForm] = useState({
    title: "",
    content: "",
    fullStory: "",
    author: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [postAnon, setPostAnon] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login?redirect=/submit");
    } else {
      setAuthChecked(true);
      const session = getSession();
      setCurrentUser(session?.username ?? "");
      // Merge built-in + user communities
      const userComms = getUserCommunities();
      const userNames = userComms.map((c) => c.name);
      setCategories([...BASE_CATEGORIES, ...userNames.filter((n) => !BASE_CATEGORIES.includes(n))]);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#08080E] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#E11D48] border-t-transparent animate-spin" />
      </div>
    );
  }

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max file size is 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newPost: Post = {
      id: Date.now(),
      title: form.title.trim(),
      content: form.content.trim(),
      fullStory: form.fullStory.trim() || form.content.trim(),
      author: postAnon ? "Anonymous" : (currentUser || "Anonymous"),
      category,
      votes: 1,
      createdAt: new Date().toISOString(),
      type: mode,
      imageUrl: mode === "post" && imagePreview ? imagePreview : undefined,
    };
    const existing = getUserAddedPosts();
    saveUserAddedPosts([...existing, newPost]);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 600);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08080E]">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-10">
            <div className="text-6xl mb-5">🔥</div>
            <h1 className="text-2xl font-bold text-[#E2E8F0] mb-2">Story Submitted!</h1>
            <p className="text-[#64748B] text-sm mb-8">
              Your revenge story is now live. Let the community judge.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ title: "", content: "", fullStory: "", author: "" });
                  setPostAnon(false);
                }}
                className="px-5 py-2 border border-[#1E1E2E] text-[#94A3B8] hover:bg-[#1A1A28] rounded-lg text-sm font-bold transition-colors"
              >
                Submit Another
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-5 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white rounded-lg text-sm font-bold transition-colors"
              >
                View All Stories
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080E]">

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-5">
          <Link href="/" className="hover:underline hover:text-[#E2E8F0]">RevengeNation</Link>
          <span>›</span>
          <span className="text-[#E2E8F0]">Submit a Story</span>
        </div>

        <div className="flex gap-6">
          {/* Left: Form */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl overflow-hidden">
              {/* Mode selector */}
              <div className="p-4 border-b border-[#1E1E2E]">
                <p className="text-[#64748B] text-xs font-semibold mb-3 uppercase tracking-widest">What are you posting?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("post")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      mode === "post"
                        ? "border-[#E11D48] bg-[#E11D48]/10 text-white"
                        : "border-[#1E1E2E] bg-[#08080E] text-[#64748B] hover:border-[#2A2A3E] hover:text-[#94A3B8]"
                    }`}
                  >
                    <span className="text-2xl">💬</span>
                    <div className="text-center">
                      <p className="text-sm font-bold">Post</p>
                      <p className="text-[10px] mt-0.5 opacity-70">Short discussion or opinion</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("story")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      mode === "story"
                        ? "border-[#7C3AED] bg-[#7C3AED]/10 text-white"
                        : "border-[#1E1E2E] bg-[#08080E] text-[#64748B] hover:border-[#2A2A3E] hover:text-[#94A3B8]"
                    }`}
                  >
                    <span className="text-2xl">🔥</span>
                    <div className="text-center">
                      <p className="text-sm font-bold">Story</p>
                      <p className="text-[10px] mt-0.5 opacity-70">Full revenge narrative</p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Community selector */}
                <div className="flex items-center gap-2 p-2 border border-[#1E1E2E] hover:border-[#2A2A3E] rounded-lg transition-colors bg-[#08080E]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-black">R</span>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 bg-transparent text-[#E2E8F0] text-sm font-bold outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#0F0F18]">{c}</option>
                    ))}
                  </select>
                  <div
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: (FLAIR_COLORS[category] ?? "#E11D48") + "22",
                      color: FLAIR_COLORS[category] ?? "#E11D48",
                    }}
                  >
                    {category}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <input
                    required
                    maxLength={300}
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Title *"
                    className="w-full bg-[#08080E] border border-[#1E1E2E] hover:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors"
                  />
                  <div className="text-right text-[#64748B] text-xs mt-1">{form.title.length}/300</div>
                </div>

                {/* Post mode — body text + optional image */}
                {mode === "post" && (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={form.content}
                      onChange={(e) => update("content", e.target.value)}
                      placeholder="What's on your mind? Share a thought, question, or short post…"
                      className="w-full bg-[#08080E] border border-[#1E1E2E] hover:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
                    />

                    {/* Image upload */}
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#1E1E2E]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="preview" className="w-full max-h-72 object-cover" />
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 px-4 py-3 bg-[#08080E] border border-dashed border-[#1E1E2E] hover:border-[#E11D48]/50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-[#1A1A28] flex items-center justify-center shrink-0 group-hover:bg-[#E11D48]/10 transition-colors">
                          <svg className="w-4 h-4 text-[#64748B] group-hover:text-[#E11D48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#94A3B8] text-xs font-semibold group-hover:text-white transition-colors">Add an image</p>
                          <p className="text-[#64748B] text-[10px] mt-0.5">PNG, JPG, GIF · max 5 MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImage}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Story mode — preview + full narrative */}
                {mode === "story" && (
                  <>
                    <div>
                      <textarea
                        rows={3}
                        value={form.content}
                        onChange={(e) => update("content", e.target.value)}
                        placeholder="Hook (2–3 sentences shown on the feed card) — optional…"
                        className="w-full bg-[#08080E] border border-[#1E1E2E] hover:border-[#2A2A3E] focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
                      />
                      <p className="text-[#64748B] text-[10px] mt-1">This appears as the card preview on the feed</p>
                    </div>
                    <div>
                      <textarea
                        required
                        rows={12}
                        value={form.fullStory}
                        onChange={(e) => update("fullStory", e.target.value)}
                        placeholder="Tell the full story — be raw, be real. Use double line breaks for paragraphs…"
                        className="w-full bg-[#08080E] border border-[#1E1E2E] hover:border-[#2A2A3E] focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none leading-relaxed"
                      />
                      <p className="text-[#64748B] text-[10px] mt-1">Readers see this on the full story page</p>
                    </div>
                  </>
                )}

                {/* Post anonymously toggle */}
                <div className="flex items-center justify-between p-3 bg-[#08080E] border border-[#1E1E2E] rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-xs font-black uppercase shrink-0">
                      {postAnon ? "?" : currentUser[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-[#E2E8F0] text-xs font-semibold">
                        Posting as{" "}
                        <span className={postAnon ? "text-[#64748B]" : "text-[#E11D48]"}>
                          {postAnon ? "Anonymous" : currentUser}
                        </span>
                      </p>
                      <p className="text-[#64748B] text-[10px] mt-0.5">Toggle to hide your identity</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[#64748B] text-xs font-semibold">Post Anonymously</span>
                    <div
                      onClick={() => setPostAnon((v) => !v)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        postAnon ? "bg-[#E11D48]" : "bg-[#1E1E2E]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          postAnon ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-5 py-2 border border-[#1E1E2E] text-[#94A3B8] hover:bg-[#1A1A28] rounded-lg text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.title}
                    className={`px-6 py-2 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors ${
                      mode === "story"
                        ? "bg-[#7C3AED] hover:bg-[#6D28D9]"
                        : "bg-[#E11D48] hover:bg-[#BE1239]"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Posting…
                      </span>
                    ) : mode === "story" ? "Post Story 🔥" : "Post 💬"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="w-64 shrink-0 hidden lg:block space-y-3">
            {/* Posting rules */}
            <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#E11D48] to-[#7C3AED] px-3 py-2.5">
                <p className="text-white text-xs font-bold">📌 Posting Rules</p>
              </div>
              <div className="p-3 space-y-2">
                {[
                  "1. Be anonymous — no real names",
                  "2. True stories only, no fiction",
                  "3. Use paragraph breaks for readability",
                  "4. No hate speech or threats",
                  "5. Keep it real, keep it raw",
                ].map((rule) => (
                  <div key={rule} className="text-[#94A3B8] text-xs border-b border-[#1E1E2E] pb-2 last:border-0 last:pb-0">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Tips card */}
            <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-4">
              <p className="text-[#E2E8F0] text-xs font-bold mb-2">💡 Tips for a viral post</p>
              <ul className="text-[#64748B] text-xs space-y-1.5 list-disc list-inside">
                <li>Start with a hook that stops scrollers</li>
                <li>Be specific — details make stories believable</li>
                <li>End with the outcome or twist</li>
                <li>Use an alias people will remember</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

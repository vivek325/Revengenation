"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import RNLoader from "@/components/RNLoader";
import RichTextareaToolbar from "@/components/RichTextareaToolbar";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { saveUserAddedPost, getUserCommunities, injectPostIntoFeedCache, bustFeedCache } from "@/lib/storage";
import { getSession, getSessionSync } from "@/lib/auth";
import type { Post } from "@/types";

const BASE_CATEGORIES = [
  "Red Flag Guide",
  "Psychology & Mindset",
  "Cheating Stories",
  "How-To Guides",
  "Relationship Advice",
  "Listicle/Roundup",
];

const FLAIR_COLORS: Record<string, string> = {
  "Red Flag Guide": "#EF4444",
  "Psychology & Mindset": "#8B5CF6",
  "Cheating Stories": "#F59E0B",
  "How-To Guides": "#3B82F6",
  "Relationship Advice": "#EC4899",
  "Listicle/Roundup": "#10B981",
};

type ModeType = "post" | "story" | "blog";

export default function SubmitPage() {
  return (
    <Suspense fallback={<RNLoader />}>
      <SubmitPageInner />
    </Suspense>
  );
}

function SubmitPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Instant auth check from localStorage - no blank flash while async resolves
  const syncSession = typeof window !== "undefined" ? getSessionSync() : null;
  const [authChecked, setAuthChecked] = useState(() => !!syncSession);
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [postAnon, setPostAnon] = useState(false);
  const [postAsRN, setPostAsRN] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(syncSession?.username || "");
  const [currentUserId, setCurrentUserId] = useState("");
  const [ownedCommunityNames, setOwnedCommunityNames] = useState<Set<string>>(new Set());
  const [postAsCommunity, setPostAsCommunity] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fullStoryRef = useRef<HTMLTextAreaElement>(null);
  const [allCommunityNames, setAllCommunityNames] = useState<Set<string>>(new Set());
  const [communityMeta, setCommunityMeta] = useState<Record<string, { emoji: string; color: string }>>({});

  useEffect(() => {
    async function check() {
      const session = await getSession();
      if (!session) {
        router.replace("/login?redirect=/submit");
      } else {
        setCurrentUser(session.username);
        setCurrentUserId(session.id);
        setIsAdmin(session.isAdmin ?? false);
        setAuthChecked(true);
        getUserCommunities().then((userComms) => {
          const userNames = userComms.map((c) => c.name);
          setCategories(BASE_CATEGORIES);
          const allNames = new Set(userNames);
          setAllCommunityNames(allNames);
          const meta: Record<string, { emoji: string; color: string }> = {};
          userComms.forEach((c) => { meta[c.name] = { emoji: c.emoji, color: c.color }; });
          setCommunityMeta(meta);
          const owned = new Set(userComms.filter((c) => c.createdBy === session.username).map((c) => c.name));
          setOwnedCommunityNames(owned);
          const urlCat = searchParams?.get("category");
          if (urlCat && (BASE_CATEGORIES.includes(urlCat) || allNames.has(urlCat))) setCategory(urlCat);
        });
      }
    }
    check();
  }, [router]);

  // Auto-set postAsCommunity when category changes
  useEffect(() => {
    // If owner switches to their community → default to posting as community
    setPostAsCommunity(ownedCommunityNames.has(category));
    if (!BASE_CATEGORIES.includes(category)) setPostAnon(false);
  }, [category, ownedCommunityNames]);

  const isInCommunity = allCommunityNames.has(category);

  if (!authChecked) return null;

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

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max file size is 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newPost: Post = {
      id: Date.now(),
      title: form.title.trim(),
      content: form.content.trim(),
      fullStory: form.fullStory.trim() || form.content.trim(),
      author: postAnon ? "Anonymous" : (postAsRN ? "RevengeNation" : (postAsCommunity && ownedCommunityNames.has(category) ? category : (currentUser || "Anonymous"))),
      category,
      votes: 1,
      createdAt: new Date().toISOString(),
      type: mode,
      imageUrl: mode === "post" && imagePreview ? imagePreview : undefined,
      coverImage: mode === "blog" && coverImage ? coverImage : undefined,
    };
    injectPostIntoFeedCache(newPost);
    bustFeedCache(); // force home feed to re-fetch so new post appears instantly
    saveUserAddedPost(newPost).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-10">
            <div className="text-6xl mb-5">🔥</div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-[#E2E8F0] mb-2">Story Submitted!</h1>
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
                className="px-5 py-2 border border-slate-200 dark:border-[#1E1E2E] text-[#94A3B8] hover:bg-slate-100 dark:bg-[#1A1A28] rounded-lg text-sm font-bold transition-colors"
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
    <div className="min-h-screen">

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-5">
          <Link href="/" className="hover:underline hover:text-slate-800 dark:text-[#E2E8F0]">RevengeNation</Link>
          <span>›</span>
          <span className="text-slate-800 dark:text-[#E2E8F0]">Submit a Story</span>
        </div>

        <div className="flex gap-6">
          {/* Left: Form */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl overflow-hidden">
              {/* Mode selector */}
              <div className="p-4 border-b border-slate-200 dark:border-[#1E1E2E]">
                <p className="text-[#64748B] text-xs font-semibold mb-3 uppercase tracking-widest">What are you posting?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("post")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      mode === "post"
                        ? "border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48] shadow-md shadow-[#E11D48]/20 scale-[1.02]"
                        : "border-slate-300 dark:border-[#2A2A3E] bg-white dark:bg-[#0D0D1A] text-slate-600 dark:text-[#94A3B8] hover:border-[#E11D48]/50 hover:bg-[#E11D48]/5 hover:text-[#E11D48]"
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
                        ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.02]"
                        : "border-slate-300 dark:border-[#2A2A3E] bg-white dark:bg-[#0D0D1A] text-slate-600 dark:text-[#94A3B8] hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
                    }`}
                  >
                    <span className="text-2xl">🔥</span>
                    <div className="text-center">
                      <p className="text-sm font-bold">Story</p>
                      <p className="text-[10px] mt-0.5 opacity-70">Full revenge narrative</p>
                    </div>
                  </button>
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setMode("blog")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all col-span-2 ${
                      mode === "blog"
                        ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981] shadow-md shadow-[#10B981]/20 scale-[1.02]"
                        : "border-slate-300 dark:border-[#2A2A3E] bg-white dark:bg-[#0D0D1A] text-slate-600 dark:text-[#94A3B8] hover:border-[#10B981]/50 hover:bg-[#10B981]/5 hover:text-[#10B981]"
                    }`}
                  >
                    <span className="text-2xl">📰</span>
                    <div className="text-center">
                      <p className="text-sm font-bold">Blog Post</p>
                      <p className="text-[10px] mt-0.5 opacity-70">Official article — Admin only</p>
                    </div>
                  </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Category / Community selector */}
                {isInCommunity ? (
                  // Locked community badge — not changeable
                  <div className="flex items-center gap-2 p-2 border border-slate-200 dark:border-[#1E1E2E] rounded-lg bg-slate-50 dark:bg-[#08080E]">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: (communityMeta[category]?.color ?? "#E11D48") + "33" }}
                    >
                      {communityMeta[category]?.emoji ?? "🏘️"}
                    </div>
                    <span className="flex-1 text-slate-800 dark:text-[#E2E8F0] text-sm font-bold">{category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A1A28] text-[#64748B] font-medium">Community</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] rounded-lg transition-colors bg-slate-50 dark:bg-[#08080E]">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-black">R</span>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 bg-transparent text-slate-800 dark:text-[#E2E8F0] text-sm font-bold outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-white dark:bg-[#0F0F18]">{c}</option>
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
                )}

                {/* Title */}
                <div>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Title *"
                    className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors"
                  />
                </div>

                {/* Post mode — body text + optional image */}
                {mode === "post" && (
                  <div className="space-y-3">
                    <RichTextareaToolbar textareaRef={contentRef} value={form.content} onChange={(v) => update("content", v)} />
                    <textarea
                      ref={contentRef}
                      rows={5}
                      value={form.content}
                      onChange={(e) => update("content", e.target.value)}
                      placeholder="What's on your mind? Share a thought, question, or short post…"
                      className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
                    />

                    {/* Image upload */}
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E1E2E]">
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
                      <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[#08080E] border border-dashed border-slate-200 dark:border-[#1E1E2E] hover:border-[#E11D48]/50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1A1A28] flex items-center justify-center shrink-0 group-hover:bg-[#E11D48]/10 transition-colors">
                          <svg className="w-4 h-4 text-[#64748B] group-hover:text-[#E11D48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#94A3B8] text-xs font-semibold group-dark:hover:text-white hover:text-slate-800 transition-colors">Add an image</p>
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

                {/* Blog mode — admin only, cover image + article body */}
                {mode === "blog" && (
                  <div className="space-y-3">
                    {/* Cover image */}
                    {coverImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E1E2E]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImage} alt="cover" className="w-full max-h-56 object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverImage(null)}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black transition-colors"
                        >✕</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[#08080E] border border-dashed border-slate-200 dark:border-[#1E1E2E] hover:border-[#10B981]/50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1A1A28] flex items-center justify-center shrink-0 group-hover:bg-[#10B981]/10 transition-colors">
                          <svg className="w-4 h-4 text-[#64748B] group-hover:text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#94A3B8] text-xs font-semibold group-dark:hover:text-white hover:text-slate-800 transition-colors">Add cover image</p>
                          <p className="text-[#64748B] text-[10px] mt-0.5">PNG, JPG · max 5 MB</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverImage} />
                      </label>
                    )}
                    <RichTextareaToolbar textareaRef={fullStoryRef} value={form.fullStory} onChange={(v) => update("fullStory", v)} />
                    <textarea
                      ref={fullStoryRef}
                      required
                      rows={14}
                      value={form.fullStory}
                      onChange={(e) => update("fullStory", e.target.value)}
                      placeholder="Write the full blog article here. Use double line breaks for new paragraphs…"
                      className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#10B981] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Story mode — preview + full narrative */}
                {mode === "story" && (
                  <>
                    <div>
                      <RichTextareaToolbar textareaRef={contentRef} value={form.content} onChange={(v) => update("content", v)} />
                      <textarea
                        ref={contentRef}
                        rows={3}
                        value={form.content}
                        onChange={(e) => update("content", e.target.value)}
                        placeholder="Hook (2–3 sentences shown on the feed card) — optional…"
                        className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
                      />
                      <p className="text-[#64748B] text-[10px] mt-1">This appears as the card preview on the feed</p>
                    </div>
                    <div>
                      <RichTextareaToolbar textareaRef={fullStoryRef} value={form.fullStory} onChange={(v) => update("fullStory", v)} />
                      <textarea
                        ref={fullStoryRef}
                        required
                        rows={12}
                        value={form.fullStory}
                        onChange={(e) => update("fullStory", e.target.value)}
                        placeholder="Tell the full story — be raw, be real. Use double line breaks for paragraphs…"
                        className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none leading-relaxed"
                      />
                      <p className="text-[#64748B] text-[10px] mt-1">Readers see this on the full story page</p>
                    </div>
                  </>
                )}

                {/* Post as community toggle — only shown for community owners */}
                {!postAnon && ownedCommunityNames.has(category) && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#E11D48]/20 flex items-center justify-center text-sm shrink-0">🏘️</div>
                      <div>
                        <p className="text-slate-800 dark:text-[#E2E8F0] text-xs font-semibold">
                          Post as{" "}
                          <span className={postAsCommunity ? "text-[#E11D48]" : "text-[#94A3B8]"}>
                            {postAsCommunity ? category : currentUser}
                          </span>
                        </p>
                        <p className="text-[#64748B] text-[10px] mt-0.5">
                          {postAsCommunity ? "Posting under community name" : "Posting under your profile"}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-[#64748B] text-xs font-semibold">
                        {postAsCommunity ? "Community" : "Profile"}
                      </span>
                      <div
                        onClick={() => setPostAsCommunity((v) => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          postAsCommunity ? "bg-[#E11D48]" : "bg-[#1E1E2E]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            postAsCommunity ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                )}

                {/* Post as RevengeNation toggle — admin only */}
                {isAdmin && !postAnon && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#08080E] border border-[#E11D48]/30 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-800 dark:text-[#E2E8F0] text-xs font-semibold">
                        Post as{" "}
                        <span className={postAsRN ? "text-[#E11D48]" : "text-[#94A3B8]"}>
                          {postAsRN ? "RevengeNation" : currentUser}
                        </span>
                      </p>
                      <p className="text-[#64748B] text-[10px] mt-0.5">Admin: post under platform name</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[#64748B] text-xs font-semibold">RevengeNation</span>
                    <div
                      onClick={() => setPostAsRN((v) => !v)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        postAsRN ? "bg-[#E11D48]" : "bg-[#1E1E2E]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          postAsRN ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>
                )}

                {/* Post anonymously toggle — hidden in communities */}
                {!isInCommunity && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-xs font-black uppercase shrink-0">
                      {postAnon ? "?" : currentUser[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-slate-800 dark:text-[#E2E8F0] text-xs font-semibold">
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
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-5 py-2 border border-slate-200 dark:border-[#1E1E2E] text-[#94A3B8] hover:bg-slate-100 dark:bg-[#1A1A28] rounded-lg text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.title || !authChecked}
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
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RNLoader from "@/components/RNLoader";
import RichTextareaToolbar from "@/components/RichTextareaToolbar";
import { getSession } from "@/lib/auth";
import { storyUrl } from "@/lib/utils";

const CATEGORIES = [
  "Red Flag Guide",
  "Psychology & Mindset",
  "Cheating Stories",
  "How-To Guides",
  "Relationship Advice",
  "Listicle/Roundup",
  "Betrayal",
  "Karma",
  "Workplace",
  "Toxic Love",
  "Family Drama",
  "Revenge",
  "Friendships",
  "Trust Issues",
];

type PostType = "post" | "story" | "blog";

function getTokenSync(): string {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const ref = url.replace("https://", "").split(".")[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (raw) return JSON.parse(raw).access_token || "";
  } catch {}
  return "";
}

async function adminFetch(url: string, opts?: RequestInit) {
  const token = getTokenSync();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers || {}),
    },
  });
}

export default function NewPostPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Template fields
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [type, setType] = useState<PostType>("blog");
  const [category, setCategory] = useState("Red Flag Guide");
  const [customCategory, setCustomCategory] = useState("");
  const [author, setAuthor] = useState("RevengeNation");
  const [content, setContent] = useState("");        // Excerpt / Hook
  const [fullStory, setFullStory] = useState("");    // Full article
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fullStoryRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session?.isAdmin) { router.replace("/"); return; }
      setAuthor(session.username === "RevengeNation" ? "RevengeNation" : session.username);
      setAuthChecked(true);
    })();
  }, [router]);

  const handlePublish = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!fullStory.trim() && !content.trim()) { setError("Content cannot be empty"); return; }
    setSaving(true);
    setError("");

    const finalCategory = customCategory.trim() || category;
    const id = Date.now();

    const postPayload = {
      id,
      title: title.trim(),
      content: content.trim(),
      fullStory: fullStory.trim() || content.trim(),
      author: author.trim() || "RevengeNation",
      category: finalCategory,
      type,
      votes: 1,
      createdAt: new Date().toISOString(),
      metaDescription: metaDescription.trim(),
      tags: tags.trim(),
    };

    const res = await adminFetch("/api/post", {
      method: "POST",
      body: JSON.stringify(postPayload),
    });

    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Failed to create post");
      setSaving(false);
      return;
    }

    // If draft, hide it immediately after creation
    if (status === "draft") {
      await adminFetch("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          action: "toggle_hide",
          targetType: "post",
          targetId: String(id),
        }),
      });
    }

    router.push(`/admin/edit/${id}`);
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center"><RNLoader /></div>;

  const previewSlug = storyUrl(0, title || "post-title").replace("/story/", "").replace("-0", "");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08080E]">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Link href="/admin" className="hover:underline hover:text-slate-800 dark:text-[#E2E8F0]">Admin</Link>
              <span>›</span>
              <span className="text-slate-800 dark:text-[#E2E8F0]">New Post</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-[#E2E8F0]">Create New Post</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="px-3 py-1.5 border border-slate-200 dark:border-[#1E1E2E] text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A1A28] rounded-lg text-xs font-semibold transition-colors">
              Cancel
            </Link>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-1.5 bg-[#E11D48] hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {saving ? "Creating…" : status === "draft" ? "Save Draft" : "Publish"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Post Title */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Post Title (H1)</label>
              <p className="text-[#64748B] text-[10px] mb-2">Main headline visitors see on the story page</p>
              <input
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 10 Phone Behaviors That Are Major Red Flags in a Marriage"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors"
              />
              <p className={`text-[10px] mt-1 ${title.length > 100 ? "text-yellow-500" : "text-[#64748B]"}`}>{title.length} chars</p>
            </div>

            {/* Meta Description */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Meta Description</label>
              <p className="text-[#64748B] text-[10px] mb-2">Shown in Google search results — under 155 characters</p>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Compelling reason to click — include main keywords…"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors resize-none"
              />
              <p className={`text-[10px] mt-1 ${metaDescription.length > 155 ? "text-red-500" : metaDescription.length > 130 ? "text-yellow-500" : "text-[#64748B]"}`}>
                {metaDescription.length}/155 chars
              </p>
            </div>

            {/* Excerpt / Hook */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Excerpt / Hook</label>
              <p className="text-[#64748B] text-[10px] mb-2">Shown on feed card (2–3 sentences, under 200 chars)</p>
              <RichTextareaToolbar textareaRef={contentRef} value={content} onChange={setContent} />
              <textarea
                ref={contentRef}
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Short hook shown on the feed card…"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors resize-none"
              />
              <p className={`text-[10px] mt-1 ${content.length > 200 ? "text-yellow-500" : "text-[#64748B]"}`}>{content.length}/200 chars</p>
            </div>

            {/* Full Story */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Full Story / Article Body</label>
              <p className="text-[#64748B] text-[10px] mb-2">Use blank lines between paragraphs. Supports [link text](url) markdown.</p>
              <RichTextareaToolbar textareaRef={fullStoryRef} value={fullStory} onChange={setFullStory} />
              <textarea
                ref={fullStoryRef}
                rows={22}
                value={fullStory}
                onChange={(e) => setFullStory(e.target.value)}
                placeholder="Paste full blog content here with headings, paragraphs, etc.\n\nUse double line breaks for new paragraphs."
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors resize-none leading-relaxed font-mono"
              />
              <p className="text-[#64748B] text-[10px] mt-1.5">
                {fullStory.length.toLocaleString()} chars · ~{Math.ceil(fullStory.split(/\s+/).filter(Boolean).length / 200)} min read
              </p>
            </div>

          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Status */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(["published", "draft"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`py-2 rounded-lg border text-xs font-bold capitalize transition-all ${
                      status === s
                        ? s === "published"
                          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-400 bg-slate-50 dark:bg-slate-400/10 text-slate-600 dark:text-slate-400"
                        : "border-slate-200 dark:border-[#1E1E2E] text-[#64748B] hover:border-slate-300"
                    }`}>
                    {s === "published" ? "✓ Published" : "⏸ Draft"}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">Post Type</label>
              <div className="space-y-2">
                {(["blog", "story", "post"] as PostType[]).map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      type === t
                        ? t === "blog" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                        : t === "story" ? "border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]"
                        : "border-blue-400 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-[#1E1E2E] text-[#64748B] hover:border-slate-300"
                    }`}>
                    <span>{t === "blog" ? "📰" : t === "story" ? "🔥" : "💬"}</span>
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); if (e.target.value !== "__custom__") setCustomCategory(""); }}
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg px-3 py-2 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none focus:border-[#E11D48] transition-colors"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
              {category === "__custom__" && (
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Custom category name"
                  className="mt-2 w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors"
                />
              )}
            </div>

            {/* Author */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-2">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="RevengeNation or Anonymous"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors"
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setAuthor("RevengeNation")} className="px-2 py-1 text-[10px] bg-[#E11D48]/10 text-[#E11D48] rounded border border-[#E11D48]/20 font-semibold hover:bg-[#E11D48]/20 transition-colors">RevengeNation</button>
                <button type="button" onClick={() => setAuthor("Anonymous")} className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-[#1A1A28] text-[#64748B] rounded border border-slate-200 dark:border-[#1E1E2E] font-semibold hover:bg-slate-200 transition-colors">Anonymous</button>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Tags</label>
              <p className="text-[#64748B] text-[10px] mb-2">3–5 tags, comma separated</p>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="phone-red-flags, cheating-signs, marriage-red-flags"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors"
              />
              {tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A1A28] text-[#64748B] border border-slate-200 dark:border-[#1E1E2E]">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Slug preview */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">URL Slug (Preview)</label>
              <p className="text-slate-800 dark:text-[#94A3B8] text-xs font-mono break-all bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg px-3 py-2">
                /story/{previewSlug || "post-title"}
              </p>
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full py-3 bg-[#E11D48] hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {saving ? "Creating…" : status === "draft" ? "Save as Draft" : "Publish Post"}
            </button>

            <Link href="/admin" className="block w-full py-2.5 text-center border border-slate-200 dark:border-[#1E1E2E] text-[#64748B] hover:bg-slate-100 dark:hover:bg-[#1A1A28] rounded-xl text-sm font-semibold transition-colors">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface PostData {
  id: number;
  title: string;
  content: string;
  full_story: string;
  author: string;
  category: string;
  type: PostType;
  votes: number;
  is_hidden: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  is_nsfw: boolean;
  created_at: string;
  meta_description?: string;
  tags?: string;
}

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

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<PostData | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PostType>("story");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [fullStory, setFullStory] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tags, setTags] = useState("");

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fullStoryRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session?.isAdmin) { router.replace("/"); return; }

      const res = await adminFetch(`/api/admin/content?type=posts`);
      const data = await res.json();
      const found: PostData | undefined = (data.posts || []).find((p: PostData) => p.id === postId);
      if (!found) { router.replace("/admin"); return; }

      setPost(found);
      setTitle(found.title);
      setType((found.type as PostType) || "story");
      setCategory(CATEGORIES.includes(found.category) ? found.category : "Red Flag Guide");
      setCustomCategory(CATEGORIES.includes(found.category) ? "" : found.category);
      setAuthor(found.author);
      setContent(found.content);
      setFullStory(found.full_story);
      setMetaDescription(found.meta_description || "");
      setTags(found.tags || "");
      setLoading(false);
    })();
  }, [postId, router]);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    setSaved(false);

    const finalCategory = customCategory.trim() || category;

    const res = await adminFetch("/api/admin/content", {
      method: "POST",
      body: JSON.stringify({
        action: "update_post",
        targetType: "post",
        targetId: String(postId),
        title: title.trim(),
        content: content.trim(),
        full_story: fullStory.trim(),
        author: author.trim(),
        category: finalCategory,
        type,
        meta_description: metaDescription.trim(),
        tags: tags.trim(),
      }),
    });

    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Save failed");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RNLoader /></div>;
  if (!post) return null;

  const previewUrl = storyUrl(post.id, title || post.title);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08080E]">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Link href="/admin" className="hover:underline hover:text-slate-800 dark:text-[#E2E8F0]">Admin</Link>
              <span>›</span>
              <span className="text-slate-800 dark:text-[#E2E8F0]">Edit Post</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-[#E2E8F0]">Edit Post #{post.id}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={previewUrl}
              target="_blank"
              className="px-3 py-1.5 border border-slate-200 dark:border-[#1E1E2E] text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A1A28] rounded-lg text-xs font-semibold transition-colors"
            >
              Preview ↗
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#E11D48] hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
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

            {/* Title */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Post Title (H1)</label>
              <p className="text-[#64748B] text-[10px] mb-2">Main headline visitors see on the story page</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title…"
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
                rows={20}
                value={fullStory}
                onChange={(e) => setFullStory(e.target.value)}
                placeholder="Full content here…"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors resize-none leading-relaxed font-mono"
              />
              <p className="text-[#64748B] text-[10px] mt-1.5">{fullStory.length.toLocaleString()} chars · ~{Math.ceil(fullStory.split(/\s+/).filter(Boolean).length / 200)} min read</p>
            </div>
          </div>

          {/* Right — settings sidebar */}
          <div className="space-y-4">

            {/* Type */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">Post Type</label>
              <div className="space-y-2">
                {(["post", "story", "blog"] as PostType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      type === t
                        ? t === "blog"
                          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                          : t === "story"
                          ? "border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]"
                          : "border-blue-400 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-[#1E1E2E] text-[#64748B] hover:border-slate-300"
                    }`}
                  >
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
              {(category === "__custom__" || (!CATEGORIES.includes(post.category) && customCategory)) && (
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
                placeholder="username or RevengeNation"
                className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48] rounded-lg px-3 py-2 text-slate-800 dark:text-[#E2E8F0] text-sm outline-none transition-colors"
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setAuthor("RevengeNation")} className="px-2 py-1 text-[10px] bg-[#E11D48]/10 text-[#E11D48] rounded border border-[#E11D48]/20 font-semibold hover:bg-[#E11D48]/20 transition-colors">
                  RevengeNation
                </button>
                <button type="button" onClick={() => setAuthor("Anonymous")} className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-[#1A1A28] text-[#64748B] rounded border border-slate-200 dark:border-[#1E1E2E] font-semibold hover:bg-slate-200 transition-colors">
                  Anonymous
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">Tags</label>
              <p className="text-[#64748B] text-[10px] mb-2">3–5 tags, comma separated (e.g. cheating-signs, red-flags)</p>
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
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-1">URL Slug</label>
              <p className="text-[#64748B] text-[10px] mb-2">Auto-generated from title</p>
              <p className="text-slate-800 dark:text-[#E2E8F0] text-xs font-mono break-all bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg px-3 py-2">
                {previewUrl}
              </p>
            </div>

            {/* Post info */}
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-2">Post Info</label>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">ID</span>
                <span className="text-slate-800 dark:text-[#E2E8F0] font-mono">{post.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Votes</span>
                <span className="text-slate-800 dark:text-[#E2E8F0]">{post.votes}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Created</span>
                <span className="text-slate-800 dark:text-[#E2E8F0]">{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.is_pinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold">Pinned</span>}
                {post.is_locked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-semibold">Locked</span>}
                {post.is_nsfw && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold">NSFW</span>}
                {post.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A1A28] text-[#64748B] font-semibold">Hidden</span>}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-[#E11D48] hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
            </button>

            <Link
              href="/admin"
              className="block w-full py-2.5 text-center border border-slate-200 dark:border-[#1E1E2E] text-[#64748B] hover:bg-slate-100 dark:hover:bg-[#1A1A28] rounded-xl text-sm font-semibold transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

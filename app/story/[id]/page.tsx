"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { posts as staticPosts } from "@/data/posts";
import {
  getPostById,
  getPostFromFeedCacheSync,
  getVoteAdjustments,
  getUpvotedPosts,
  getDownvotedPosts,
  castVote,
  getDeletedPostIds,
  getComments,
  addComment,
  deleteComment,
  updatePost,
  markPostDeleted,
} from "@/lib/storage";
import { getSession, getSessionSync } from "@/lib/auth";
import RNLoader from "@/components/RNLoader";
import type { Post, Comment } from "@/types";

const FLAIR_COLORS: Record<string, string> = {
  Betrayal: "#FF6314",
  Karma: "#F5A623",
  Workplace: "#4A90E2",
  "Toxic Love": "#E91E8C",
  "Family Drama": "#FF7043",
  Revenge: "#9B59B6",
  Friendships: "#27AE60",
  "Trust Issues": "#818384",
};

type VoteState = "up" | "down" | null;
type CommentSort = "New" | "Top";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [voteState, setVoteState] = useState<VoteState>(null);
  const [votes, setVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentSort, setCommentSort] = useState<CommentSort>("New");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getSessionSync()?.username ?? null;
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getSessionSync()?.id ?? null;
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFullStory, setEditFullStory] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = Number(params.id);

    // Step 1: Show post IMMEDIATELY from feed cache (no network, no spinner)
    const staticFound = staticPosts.find((p) => p.id === id);
    const cachedPost = staticFound || getPostFromFeedCacheSync(id);
    if (cachedPost) {
      setPost(cachedPost);
      setVotes(cachedPost.votes);
      setLoading(false);
    }

    // Step 2: Load full post (with fullStory) + vote adjustments + deleted check in parallel
    Promise.all([
      getPostById(id),
      getDeletedPostIds(),
      getVoteAdjustments(),
    ]).then(([found, deletedIds, adj]) => {
      // Use DB result; fall back to static/feed cache if DB returns null (static posts aren't in DB)
      const resolved = found ?? cachedPost;
      if (!resolved || deletedIds.includes(id)) { router.push("/"); return; }
      setPost(resolved);
      setVotes(resolved.votes + (adj[resolved.id] || 0));
      setLoading(false);
    });

    // Step 3: Load comments separately — doesn't block post rendering
    getComments(id).then(setComments);

    // Step 4: Session + user votes in background
    getSession().then((session) => {
      setCurrentUser(session?.username ?? null);
      setCurrentUserId(session?.id ?? null);
      if (session) {
        Promise.all([getUpvotedPosts(session.id), getDownvotedPosts(session.id)]).then(
          ([up, down]) => setVoteState(up.has(id) ? "up" : down.has(id) ? "down" : null)
        );
      }
    });
  }, [params.id, router]);

  const sortedComments = [...comments].sort((a, b) =>
    commentSort === "New"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : 0
  );

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !post || !currentUserId) return;
    setSubmitting(true);
    const c: Comment = {
      id: Date.now().toString(),
      postId: post.id,
      author: currentUser || "Anonymous",
      body: commentBody.trim(),
      createdAt: new Date().toISOString(),
    };
    await addComment(c, currentUserId);
    setComments((prev) => [c, ...prev]);
    setCommentBody("");
    setSubmitting(false);
  };

  const handleDeleteComment = async (id: string) => {
    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleVote = async (dir: "up" | "down") => {
    if (!post) return;
    if (!currentUserId) {
      router.push(`/login?redirect=/story/${post.id}`);
      return;
    }
    const isUp = voteState === "up";
    const isDown = voteState === "down";
    let delta = 0;
    let nowUp = false;
    let nowDown = false;

    if (dir === "up") {
      if (isUp) { delta = -1; }
      else if (isDown) { delta = 2; nowUp = true; }
      else { delta = 1; nowUp = true; }
    } else {
      if (isDown) { delta = 1; }
      else if (isUp) { delta = -2; nowDown = true; }
      else { delta = -1; nowDown = true; }
    }

    castVote(post.id, delta, nowUp, nowDown, currentUserId);
    setVoteState(nowUp ? "up" : nowDown ? "down" : null);
    setVotes((v) => v + delta);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    if (!post || !editTitle.trim()) return;
    setEditSaving(true);
    await updatePost(post.id, { title: editTitle.trim(), content: editContent.trim(), full_story: editFullStory.trim() });
    setPost((p) => p ? { ...p, title: editTitle.trim(), content: editContent.trim(), fullStory: editFullStory.trim() } : p);
    setEditSaving(false);
    setEditOpen(false);
  };

  const handleDeletePost = () => {
    if (!post) return;
    setDeleting(true);
    setDeleteConfirm(false);
    markPostDeleted(post.id).catch(() => {});
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
          <div className="h-4 w-40 bg-slate-200 dark:bg-[#1E1E2E] rounded mb-4" />
          <div className="h-64 bg-slate-200 dark:bg-[#0F0F18] rounded-xl mb-4" />
          <div className="h-32 bg-slate-200 dark:bg-[#0F0F18] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const flairColor = FLAIR_COLORS[post.category] ?? "#64748B";
  const voteColor =
    voteState === "up" ? "#E11D48" : voteState === "down" ? "#7C3AED" : "#64748B";

  return (
    <div className="min-h-screen">

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-4">
          <Link href="/" className="hover:text-slate-800 dark:text-[#E2E8F0] hover:underline">RevengeNation</Link>
          <span>›</span>
          <span style={{ color: flairColor }}>{post.category}</span>
        </div>

        {/* Post card */}
        <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${flairColor}, ${flairColor}88)` }} />
          <div className="p-5">
            {/* Meta */}
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-3 flex-wrap">
              <span className="font-bold" style={{ color: flairColor }}>{post.category}</span>
              <span>•</span>
              {post.author === "RevengeNation" ? (
                <span className="text-[#E11D48] font-bold">RevengeNation</span>
              ) : (
                <span>u/{post.author}</span>
              )}
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            <h1 className="text-slate-800 dark:text-[#E2E8F0] text-xl font-bold leading-snug mb-4">{post.title}</h1>

            {/* Cover image (blog only) */}
            {post.type === "blog" && post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt="cover"
                className="w-full max-h-80 object-cover rounded-xl mb-5 border border-slate-200 dark:border-[#1E1E2E]"
              />
            )}

            {/* Image (for posts with uploaded image) */}
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.imageUrl}
                alt="post image"
                className="w-full max-h-96 object-cover rounded-xl mb-4 border border-slate-200 dark:border-[#1E1E2E]"
              />
            )}

            {/* Body */}
            {post.type === "blog" ? (
              <div className="prose prose-invert max-w-none text-slate-600 dark:text-[#CBD5E1] text-base leading-8 space-y-5">
                {post.author === "RevengeNation" && (
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-[#1E1E2E]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#E11D48] font-bold text-sm">RevengeNation</p>
                      <p className="text-[#64748B] text-xs">Official Blog</p>
                    </div>
                  </div>
                )}
                {post.fullStory.split("\n\n").map((para, i) => (
                  <p key={i} className="text-slate-600 dark:text-[#CBD5E1] leading-8">{para}</p>
                ))}
              </div>
            ) : (
            <div className="text-[#94A3B8] text-sm leading-7 space-y-4">
              {post.fullStory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-[#1E1E2E] flex-wrap">
              {/* Votes */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] rounded-lg px-1 py-1">
                <button
                  onClick={() => handleVote("up")}
                  className={`p-1.5 rounded-md transition-colors ${
                    voteState === "up" ? "text-[#E11D48] bg-[#E11D48]/10" : "text-[#64748B] hover:text-[#E11D48] hover:bg-[#E11D48]/10"
                  }`}
                >
                  <svg className="w-4 h-4" fill={voteState === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-sm font-bold tabular-nums px-1" style={{ color: voteColor }}>
                  {votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : votes}
                </span>
                <button
                  onClick={() => handleVote("down")}
                  className={`p-1.5 rounded-md transition-colors ${
                    voteState === "down" ? "text-[#7C3AED] bg-[#7C3AED]/10" : "text-[#64748B] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10"
                  }`}
                >
                  <svg className="w-4 h-4" fill={voteState === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => textareaRef.current?.focus()}
                className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-slate-100 dark:bg-[#1A1A28] hover:text-slate-800 dark:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-slate-100 dark:bg-[#1A1A28] hover:text-slate-800 dark:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>

              <Link
                href="/"
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-slate-100 dark:bg-[#1A1A28] hover:text-slate-800 dark:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                ← Back
              </Link>

              {currentUser && post.author === currentUser && (
                <>
                  <button
                    onClick={() => { setEditTitle(post.title); setEditContent(post.content); setEditFullStory(post.fullStory ?? ""); setEditOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Delete Confirm Modal ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)}>
            <div className="bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-slate-800 dark:text-[#E2E8F0] font-bold text-lg mb-2">Delete Post?</h3>
              <p className="text-slate-500 dark:text-[#475569] text-sm mb-5">This action cannot be undone. The post will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-[#1C2035] text-slate-600 dark:text-[#94A3B8] text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#161B2A] transition-colors">Cancel</button>
                <button onClick={handleDeletePost} disabled={deleting} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !editSaving && setEditOpen(false)}>
            <div className="bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-slate-800 dark:text-[#E2E8F0] font-bold text-lg">Edit Post</h3>
                <button onClick={() => !editSaving && setEditOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1C2035] bg-slate-50 dark:bg-[#161B2A] text-slate-800 dark:text-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40"
                    placeholder="Post title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Summary</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1C2035] bg-slate-50 dark:bg-[#161B2A] text-slate-800 dark:text-[#E2E8F0] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40"
                    placeholder="Short summary"
                  />
                </div>
                {post && post.type !== "post" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Full Story</label>
                    <textarea
                      value={editFullStory}
                      onChange={(e) => setEditFullStory(e.target.value)}
                      rows={10}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1C2035] bg-slate-50 dark:bg-[#161B2A] text-slate-800 dark:text-[#E2E8F0] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40"
                      placeholder="Full story content"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => !editSaving && setEditOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1C2035] text-slate-600 dark:text-[#94A3B8] text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#161B2A] transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} disabled={editSaving || !editTitle.trim()} className="flex-1 py-2.5 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments section */}
        <div id="comments" className="mt-4 space-y-4">
          {/* Comment input */}
          <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
            {currentUser ? (
              <>
                <p className="text-[#64748B] text-xs font-semibold mb-3">
                  💬 Comment as{" "}
                  <span className="text-slate-800 dark:text-[#E2E8F0]">{currentUser}</span>
                </p>
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="What do you think? Add a comment…"
                    className="w-full bg-slate-50 dark:bg-[#08080E] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-slate-800 dark:text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !commentBody.trim()}
                      className="px-5 py-2 bg-[#E11D48] hover:bg-[#BE1239] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {submitting ? "Posting…" : "Post Comment"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-[#64748B] text-sm">Log in to join the conversation 💬</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`/login?redirect=/story/${post?.id}`}
                    className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Log In
                  </a>
                  <a
                    href={`/login?mode=signup&redirect=/story/${post?.id}`}
                    className="px-4 py-2 border border-slate-300 dark:border-[#2A2A3E] hover:bg-slate-100 dark:bg-[#1A1A28] text-[#94A3B8] dark:hover:text-white hover:text-slate-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    Sign Up
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sort + count */}
          {comments.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[#64748B] text-xs font-semibold">{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[#64748B] text-xs">Sort:</span>
                {(["New", "Top"] as CommentSort[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCommentSort(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      commentSort === s ? "text-white bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E]" : "text-[#64748B] dark:hover:text-white hover:text-slate-800 hover:bg-slate-100 dark:bg-[#1A1A28]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment list */}
          {sortedComments.length === 0 ? (
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-slate-800 dark:text-[#E2E8F0] font-semibold text-sm">No comments yet</p>
              <p className="text-[#64748B] text-xs mt-1">Be the first to share your thoughts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedComments.map((c) => (
                <div key={c.id} className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] rounded-xl p-4 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                      {c.author[0]}
                    </div>
                    <span className="text-slate-800 dark:text-[#E2E8F0] text-xs font-bold">{c.author}</span>
                    <span className="text-[#64748B] text-xs">{timeAgo(c.createdAt)}</span>
                    {(currentUser === c.author || currentUser === "admin") && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="ml-auto text-[10px] text-[#64748B] hover:text-[#E11D48] transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-[#94A3B8] text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

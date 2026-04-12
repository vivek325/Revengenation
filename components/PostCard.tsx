"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpCircle, ArrowDownCircle, MessageCircle, Share2,
  CheckCircle2, ArrowRight, Flame, Newspaper, MessageSquareText,
  Pencil, Trash2, X,
} from "lucide-react";
import type { Post } from "@/types";
import { getComments, updatePost, markPostDeleted } from "@/lib/storage";
import { storyUrl } from "@/lib/utils";

const FLAIR_COLORS: Record<string, string> = {
  "Red Flag Guide": "#EF4444",
  "Psychology & Mindset": "#8B5CF6",
  "Cheating Stories": "#F59E0B",
  "How-To Guides": "#3B82F6",
  "Relationship Advice": "#EC4899",
  "Listicle/Roundup": "#10B981",
};

export type VoteState = "up" | "down" | null;
interface PostCardProps {
  post: Post;
  voteState: VoteState;
  onVote: (id: number, dir: "up" | "down") => void;
  commentCount?: number;
  currentUsername?: string | null;
  onDelete?: (id: number) => void;
  onEdit?: (post: Post) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default memo(function PostCard({ post, voteState, onVote, commentCount: countProp, currentUsername, onDelete, onEdit }: PostCardProps) {
  const flairColor = FLAIR_COLORS[post.category] ?? "#64748B";
  const [commentCount, setCommentCount] = useState(countProp ?? 0);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editFullStory, setEditFullStory] = useState(post.fullStory ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!(currentUsername && post.author === currentUsername);

  async function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    await updatePost(post.id, { title: editTitle.trim(), content: editContent.trim(), full_story: editFullStory.trim() });
    setEditSaving(false);
    setEditOpen(false);
    onEdit?.({ ...post, title: editTitle.trim(), content: editContent.trim(), fullStory: editFullStory.trim() });
  }

  function handleDelete() {
    setDeleting(true);
    setDeleteConfirm(false);
    onDelete?.(post.id);
    markPostDeleted(post.id).catch(() => {}).finally(() => setDeleting(false));
  }

  useEffect(() => {
    if (countProp !== undefined) { setCommentCount(countProp); return; }
    getComments(post.id).then((c) => setCommentCount(c.length));
  }, [post.id, countProp]);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard?.writeText(window.location.origin + storyUrl(post.id, post.title));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayVotes = Math.abs(post.votes) >= 1000 ? `${(post.votes / 1000).toFixed(1)}k` : String(post.votes);
  const voteNumColor = voteState === "up" ? "#E11D48" : voteState === "down" ? "#6366F1" : undefined;

  const TypeIcon = post.type === "blog" ? Newspaper : post.type === "post" ? MessageSquareText : Flame;
  const typeLabel = post.type === "blog" ? "Blog" : post.type === "post" ? "Post" : "Story";
  const typeBadgeClass =
    post.type === "post"
      ? "bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#60A5FA] border border-blue-100 dark:border-[#3B82F6]/20"
      : post.type === "blog"
      ? "bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#34D399] border border-emerald-100 dark:border-[#10B981]/20"
      : "bg-rose-50 dark:bg-[#E11D48]/10 text-[#E11D48] border border-rose-100 dark:border-[#E11D48]/20";

  return (
    <article className="relative bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] hover:border-slate-300 dark:hover:border-[#2E3450] rounded-2xl transition-all group overflow-hidden shadow-sm hover:shadow-md dark:shadow-none">
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${flairColor}, transparent 70%)` }} />
      <div className="p-5">

        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${typeBadgeClass}`}>
            <TypeIcon size={10} />
            {typeLabel}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: flairColor + "12", color: flairColor, borderColor: flairColor + "30" }}>
            {post.category}
          </span>
          <span className="text-slate-300 dark:text-[#2A2A40] text-xs">•</span>
          <span className="text-slate-500 dark:text-[#475569] text-xs">
            {post.author === "RevengeNation"
              ? <span className="text-[#E11D48] font-bold">RevengeNation</span>
              : <>by {post.author}</>}
          </span>
          <span className="text-slate-300 dark:text-[#2A2A40] text-xs">•</span>
          <span className="text-slate-500 dark:text-[#475569] text-xs">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Title */}
        <Link href={storyUrl(post.id, post.title)}>
          <h2 className="text-slate-800 dark:text-[#E2E8F0] font-bold text-[17px] leading-snug mb-2.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-slate-500 dark:text-[#475569] text-sm leading-relaxed line-clamp-2 mb-4">{post.content}</p>

        {post.type === "blog" && post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="cover" className="w-full max-h-48 object-cover rounded-xl mb-4 border border-slate-200 dark:border-[#1C2035]" />
        )}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="post image" className="w-full max-h-72 object-cover rounded-xl mb-4 border border-slate-200 dark:border-[#1C2035]" />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">

            {/* Vote pill */}
            <div className="flex items-center bg-slate-50 dark:bg-[#111520] rounded-lg overflow-hidden border border-slate-200 dark:border-[#1E2336]">
              <button
                onClick={(e) => { e.preventDefault(); onVote(post.id, "up"); }}
                aria-label="Upvote"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                  voteState === "up"
                    ? "text-[#E11D48] bg-rose-50 dark:bg-[#E11D48]/10"
                    : "text-slate-400 dark:text-[#64748B] hover:text-[#E11D48] hover:bg-rose-50 dark:hover:bg-[#E11D48]/5"
                }`}
              >
                <ArrowUpCircle size={14} fill={voteState === "up" ? "currentColor" : "none"} />
                <span style={voteNumColor ? { color: voteNumColor } : {}} className={!voteNumColor ? "text-slate-500 dark:text-[#64748B]" : ""}>{displayVotes}</span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-[#2A2A3E]" />
              <button
                onClick={(e) => { e.preventDefault(); onVote(post.id, "down"); }}
                aria-label="Downvote"
                className={`px-2.5 py-1.5 transition-colors ${
                  voteState === "down"
                    ? "text-indigo-500 dark:text-[#818CF8] bg-indigo-50 dark:bg-[#818CF8]/10"
                    : "text-slate-400 dark:text-[#64748B] hover:text-indigo-500 dark:hover:text-[#818CF8] hover:bg-indigo-50 dark:hover:bg-[#818CF8]/5"
                }`}
              >
                <ArrowDownCircle size={14} fill={voteState === "down" ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Comments */}
            <Link
              href={storyUrl(post.id, post.title) + "#comments"}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#111520] border border-slate-200 dark:border-[#1E2336] rounded-lg text-slate-500 dark:text-[#475569] hover:text-slate-700 dark:hover:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A1A28] text-xs font-semibold transition-colors"
            >
              <MessageCircle size={14} />
              {commentCount}
            </Link>

            {/* Share */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? "bg-emerald-50 dark:bg-[#22C55E]/10 border-emerald-200 dark:border-[#22C55E]/40 text-emerald-600 dark:text-[#22C55E]"
                  : "bg-slate-50 dark:bg-[#111520] border-slate-200 dark:border-[#1E2336] text-slate-500 dark:text-[#475569] hover:bg-slate-100 dark:hover:bg-[#1A1A28] hover:text-slate-700 dark:hover:text-[#94A3B8]"
              }`}
            >
              {copied
                ? <><CheckCircle2 size={14} /> Copied!</>
                : <><Share2 size={14} /> Share</>}
            </button>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={(e) => { e.preventDefault(); setEditTitle(post.title); setEditContent(post.content); setEditFullStory(post.fullStory ?? ""); setEditOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-[#64748B] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setDeleteConfirm(true); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-[#64748B] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}

          <Link href={storyUrl(post.id, post.title)} className="flex items-center gap-1 text-sm font-bold text-[#E11D48] hover:text-rose-700 dark:hover:text-rose-400 transition-colors">
            {post.type === "post" ? "View Post" : "Read"}
            <ArrowRight size={15} />
          </Link>
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
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
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
              <button onClick={() => !editSaving && setEditOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20} /></button>
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
              {post.type !== "post" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Full Story</label>
                  <textarea
                    value={editFullStory}
                    onChange={(e) => setEditFullStory(e.target.value)}
                    rows={8}
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
    </article>
  );
});

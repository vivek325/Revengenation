"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { Post } from "@/types";
import { getComments } from "@/lib/storage";

const FLAIR_COLORS: Record<string, string> = {
  "Red Flag Guide": "#EF4444",
  "Psychology & Mindset": "#8B5CF6",
  "Stories": "#F59E0B",
  "How-To Guides": "#3B82F6",
  "Relationship Advice": "#EC4899",
  "Listicle/Roundup": "#10B981",
};

export type VoteState = "up" | "down" | null;

interface PostCardProps {
  post: Post;
  voteState: VoteState;
  onVote: (id: number, dir: "up" | "down") => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function PostCard({ post, voteState, onVote }: PostCardProps) {
  const flairColor = FLAIR_COLORS[post.category] ?? "#64748B";
  const [commentCount, setCommentCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCommentCount(getComments(post.id).length);
  }, [post.id]);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.location.origin + `/story/${post.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayVotes =
    Math.abs(post.votes) >= 1000
      ? `${(post.votes / 1000).toFixed(1)}k`
      : String(post.votes);

  const voteNumColor =
    voteState === "up" ? "#E11D48" : voteState === "down" ? "#818CF8" : "#64748B";

  return (
    <article className="relative bg-[#0F0F18] border border-[#1E1E2E] hover:border-[#2A2A40] rounded-xl transition-all group overflow-hidden">
      {/* Category color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${flairColor}, transparent 70%)` }}
      />

      <div className="p-5">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Post / Story type badge */}
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${
              post.type === "post"
                ? "bg-[#3B82F6]/15 text-[#60A5FA]"
                : "bg-[#E11D48]/15 text-[#FB7185]"
            }`}
          >
            {post.type === "post" ? "💬 Post" : "🔥 Story"}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: flairColor + "1A", color: flairColor }}
          >
            {post.category}
          </span>
          <span className="text-[#2A2A40] text-xs">•</span>
          <span className="text-[#475569] text-xs">by {post.author}</span>
          <span className="text-[#2A2A40] text-xs">•</span>
          <span className="text-[#475569] text-xs">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Title */}
        <Link href={`/story/${post.id}`}>
          <h2 className="text-[#E2E8F0] font-bold text-[17px] leading-snug mb-2.5 group-hover:text-white transition-colors">
            {post.title}
          </h2>
        </Link>

        {/* Preview */}
        <p className="text-[#475569] text-sm leading-relaxed line-clamp-2 mb-4">
          {post.content}
        </p>

        {/* Image (posts only) */}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt="post image"
            className="w-full max-h-72 object-cover rounded-xl mb-4 border border-[#1E1E2E]"
          />
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Vote pill */}
            <div className="flex items-center bg-[#1A1A28] rounded-lg overflow-hidden border border-[#2A2A3E]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onVote(post.id, "up");
                }}
                aria-label="Upvote"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                  voteState === "up"
                    ? "text-[#E11D48] bg-[#E11D48]/10"
                    : "text-[#64748B] hover:text-[#E11D48] hover:bg-[#E11D48]/5"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={voteState === "up" ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span style={{ color: voteNumColor }}>{displayVotes}</span>
              </button>
              <div className="w-px h-4 bg-[#2A2A3E]" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onVote(post.id, "down");
                }}
                aria-label="Downvote"
                className={`px-2.5 py-1.5 transition-colors ${
                  voteState === "down"
                    ? "text-[#818CF8] bg-[#818CF8]/10"
                    : "text-[#64748B] hover:text-[#818CF8] hover:bg-[#818CF8]/5"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={voteState === "down" ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Comment count */}
            <Link
              href={`/story/${post.id}#comments`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A28] border border-[#2A2A3E] rounded-lg text-[#475569] hover:text-[#94A3B8] text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount}
            </Link>

            {/* Share */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? "bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]"
                  : "bg-[#1A1A28] border-[#2A2A3E] text-[#475569] hover:text-[#94A3B8]"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>

          {/* Read / View CTA */}
          <Link
            href={`/story/${post.id}`}
            className="flex items-center gap-1 text-sm font-bold transition-colors"
            style={{ color: post.type === "post" ? "#60A5FA" : "#E11D48" }}
          >
            {post.type === "post" ? "View Post" : "Read Story"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

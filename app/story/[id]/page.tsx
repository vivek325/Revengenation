"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { posts as staticPosts } from "@/data/posts";
import {
  getUserAddedPosts,
  getVoteAdjustments,
  getUpvotedPosts,
  getDownvotedPosts,
  castVote,
  getDeletedPostIds,
  getComments,
  addComment,
  deleteComment,
} from "@/lib/storage";
import { getSession } from "@/lib/auth";
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
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = Number(params.id);
    const userPosts = getUserAddedPosts();
    const deletedIds = getDeletedPostIds();
    const all = [...staticPosts, ...userPosts].filter((p) => !deletedIds.includes(p.id));
    const found = all.find((p) => p.id === id);
    if (!found) { router.push("/"); return; }

    const adj = getVoteAdjustments();
    const up = getUpvotedPosts();
    const down = getDownvotedPosts();
    setPost(found);
    setVotes(found.votes + (adj[found.id] || 0));
    setVoteState(up.has(found.id) ? "up" : down.has(found.id) ? "down" : null);
    setComments(getComments(id));
    const session = getSession();
    setCurrentUser(session?.username ?? null);
    setLoading(false);
  }, [params.id, router]);

  const sortedComments = [...comments].sort((a, b) =>
    commentSort === "New"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : 0
  );

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !post) return;
    setSubmitting(true);
    const c: Comment = {
      id: Date.now().toString(),
      postId: post.id,
      author: currentUser || "Anonymous",
      body: commentBody.trim(),
      createdAt: new Date().toISOString(),
    };
    addComment(c);
    setComments((prev) => [c, ...prev]);
    setCommentBody("");
    setSubmitting(false);
  };

  const handleDeleteComment = (id: string) => {
    deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleVote = (dir: "up" | "down") => {
    if (!post) return;
    if (!currentUser) {
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

    castVote(post.id, delta, nowUp, nowDown);
    setVoteState(nowUp ? "up" : nowDown ? "down" : null);
    setVotes((v) => v + delta);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  const flairColor = FLAIR_COLORS[post.category] ?? "#64748B";
  const voteColor =
    voteState === "up" ? "#E11D48" : voteState === "down" ? "#7C3AED" : "#64748B";

  return (
    <div className="min-h-screen bg-[#08080E]">

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-4">
          <Link href="/" className="hover:text-[#E2E8F0] hover:underline">RevengeNation</Link>
          <span>›</span>
          <span style={{ color: flairColor }}>{post.category}</span>
        </div>

        {/* Post card */}
        <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${flairColor}, ${flairColor}88)` }} />
          <div className="p-5">
            {/* Meta */}
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-3 flex-wrap">
              <span className="font-bold" style={{ color: flairColor }}>{post.category}</span>
              <span>•</span>
              <span>u/{post.author}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            <h1 className="text-[#E2E8F0] text-xl font-bold leading-snug mb-4">{post.title}</h1>

            {/* Image (for posts with uploaded image) */}
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.imageUrl}
                alt="post image"
                className="w-full max-h-96 object-cover rounded-xl mb-4 border border-[#1E1E2E]"
              />
            )}

            {/* Body */}
            <div className="text-[#94A3B8] text-sm leading-7 space-y-4">
              {post.fullStory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#1E1E2E] flex-wrap">
              {/* Votes */}
              <div className="flex items-center gap-1 bg-[#08080E] border border-[#1E1E2E] rounded-lg px-1 py-1">
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
                className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-[#1A1A28] hover:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-[#1A1A28] hover:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>

              <Link
                href="/"
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[#64748B] hover:bg-[#1A1A28] hover:text-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div id="comments" className="mt-4 space-y-4">
          {/* Comment input */}
          <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-4">
            {currentUser ? (
              <>
                <p className="text-[#64748B] text-xs font-semibold mb-3">
                  💬 Comment as{" "}
                  <span className="text-[#E2E8F0]">{currentUser}</span>
                </p>
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="What do you think? Add a comment…"
                    className="w-full bg-[#08080E] border border-[#1E1E2E] hover:border-[#2A2A3E] focus:border-[#E11D48] rounded-lg px-3 py-2.5 text-[#E2E8F0] placeholder-[#64748B] text-sm outline-none transition-colors resize-none"
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
                    className="px-4 py-2 border border-[#2A2A3E] hover:bg-[#1A1A28] text-[#94A3B8] hover:text-white text-xs font-bold rounded-lg transition-colors"
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
                      commentSort === s ? "text-white bg-[#1A1A28] border border-[#2A2A3E]" : "text-[#64748B] hover:text-white hover:bg-[#1A1A28]"
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
            <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-[#E2E8F0] font-semibold text-sm">No comments yet</p>
              <p className="text-[#64748B] text-xs mt-1">Be the first to share your thoughts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedComments.map((c) => (
                <div key={c.id} className="bg-[#0F0F18] border border-[#1E1E2E] hover:border-[#2A2A3E] rounded-xl p-4 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                      {c.author[0]}
                    </div>
                    <span className="text-[#E2E8F0] text-xs font-bold">{c.author}</span>
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

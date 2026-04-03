"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import {
  getUserCommunities,
  getCommunityById,
  getCommunityPosts,
  joinCommunity,
  leaveCommunity,
  isMember,
  getMemberCount,
  getVoteAdjustments,
  getUpvotedPosts,
  getDownvotedPosts,
  castVote,
  deleteCommunity,
  getAllCommentCounts,
} from "@/lib/storage";
import { getSession } from "@/lib/auth";
import RNLoader from "@/components/RNLoader";
import type { Community, Post } from "@/types";

// Built-in communities
const BUILTIN: Community[] = [
  { id: "red-flag-guide", name: "Red Flag Guide", emoji: "🚩", color: "#EF4444", description: "Spot the signs before it's too late.", createdBy: "system", createdAt: "" },
  { id: "psychology-mindset", name: "Psychology & Mindset", emoji: "🧠", color: "#8B5CF6", description: "The mental game behind toxic relationships.", createdBy: "system", createdAt: "" },
  { id: "stories", name: "Cheating Stories", emoji: "💔", color: "#F59E0B", description: "Real cheating stories from real people.", createdBy: "system", createdAt: "" },
  { id: "how-to-guides", name: "How-To Guides", emoji: "🔍", color: "#3B82F6", description: "Step-by-step advice for every situation.", createdBy: "system", createdAt: "" },
  { id: "relationship-advice", name: "Relationship Advice", emoji: "💔", color: "#EC4899", description: "When you need real talk, not fluff.", createdBy: "system", createdAt: "" },
  { id: "listicle-roundup", name: "Listicle/Roundup", emoji: "📊", color: "#10B981", description: "The best lists, ranked and curated.", createdBy: "system", createdAt: "" },
];

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [voteAdjustments, setVoteAdjustments] = useState<Record<number, number>>({});
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set());
  const [downvoted, setDownvoted] = useState<Set<number>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [sort, setSort] = useState<"new" | "top" | "hot">("new");

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Start session + feed data in parallel while we resolve community
      const [sessionRes, adjRes, countsRes, userCommsRes] = await Promise.all([
        getSession(),
        getVoteAdjustments(),
        getAllCommentCounts(),
        getUserCommunities(),
      ]);

      // Try built-in first, then DB
      let comm: Community | null = BUILTIN.find((c) => c.id === id) || null;
      if (!comm) comm = userCommsRes.find((c) => c.id === id) || null;
      if (!comm) { setLoading(false); return; }
      setCommunity(comm);

      setVoteAdjustments(adjRes);
      setUserId(sessionRes?.id || null);
      setUsername(sessionRes?.username || null);
      setCommentCounts(countsRes);

      // Fetch posts + member count in parallel
      const [communityPosts, count] = await Promise.all([
        getCommunityPosts(comm.name),
        getMemberCount(comm.id),
      ]);
      setPosts(communityPosts);
      setMemberCount(count);

      if (sessionRes?.id) {
        const [memberStatus, up, down] = await Promise.all([
          isMember(comm.id, sessionRes.id),
          getUpvotedPosts(sessionRes.id),
          getDownvotedPosts(sessionRes.id),
        ]);
        setJoined(memberStatus);
        setUpvoted(up);
        setDownvoted(down);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  const sorted = useMemo(() => {
    const withAdj = posts.map((p) => ({ ...p, votes: p.votes + (voteAdjustments[p.id] || 0) }));
    if (sort === "top") return [...withAdj].sort((a, b) => b.votes - a.votes);
    if (sort === "hot") {
      return [...withAdj].sort((a, b) => {
        const aAge = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
        const bAge = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
        return b.votes / (bAge + 1) - a.votes / (aAge + 1);
      });
    }
    return [...withAdj].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, voteAdjustments, sort]);

  const handleJoin = async () => {
    if (!userId) { router.push(`/login?redirect=/communities/${id}`); return; }
    if (!community) return;
    setJoinLoading(true);
    if (joined) {
      await leaveCommunity(community.id, userId);
      setJoined(false);
      setMemberCount((c) => Math.max(0, c - 1));
    } else {
      await joinCommunity(community.id, userId);
      setJoined(true);
      setMemberCount((c) => c + 1);
    }
    setJoinLoading(false);
  };

  const handleDelete = async () => {
    if (!community) return;
    if (!confirm(`Delete "${community.name}"? This cannot be undone.`)) return;
    setDeleteLoading(true);
    await deleteCommunity(community.id);
    router.push("/");
  };

  const handleVote = async (postId: number, dir: "up" | "down") => {
    if (!userId) { router.push(`/login?redirect=/communities/${id}`); return; }
    const isUp = upvoted.has(postId);
    const isDown = downvoted.has(postId);
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
    castVote(postId, delta, nowUp, nowDown, userId);
    const nextUp = new Set(upvoted);
    const nextDown = new Set(downvoted);
    if (nowUp) nextUp.add(postId); else nextUp.delete(postId);
    if (nowDown) nextDown.add(postId); else nextDown.delete(postId);
    setUpvoted(nextUp);
    setDownvoted(nextDown);
    setVoteAdjustments((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + delta }));
  };

  const getVoteState = (pid: number): "up" | "down" | null =>
    upvoted.has(pid) ? "up" : downvoted.has(pid) ? "down" : null;

  if (loading) return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 dark:bg-[#1E1E2E] rounded mb-6" />
        <div className="h-32 bg-slate-200 dark:bg-[#0F0F18] rounded-2xl mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-[#0F0F18] rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔍</div>
        <p className="text-white font-semibold text-lg">Community not found</p>
        <Link href="/" className="text-[#E11D48] hover:underline text-sm">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      {community.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={community.bannerUrl}
          alt=""
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          className="h-24 w-full"
          style={{ background: `linear-gradient(135deg, ${community.color}30 0%, #08080E 100%)` }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* Community header */}
        <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-5 -mt-8 mb-6 relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2"
                style={{ backgroundColor: community.color + "20", borderColor: community.color + "50" }}
              >
                {community.emoji}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{community.name}</h1>
                <p className="text-[#64748B] text-sm mt-0.5">{community.description || "No description."}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-[#94A3B8] text-xs">
                    <span className="font-bold text-white">{memberCount.toLocaleString()}</span> members
                  </span>
                  <span className="text-[#2A2A40]">·</span>
                  <span className="text-[#94A3B8] text-xs">
                    <span className="font-bold text-white">{posts.length}</span> posts
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {username === community.createdBy && (
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-[#1A1A28] border border-[#E11D48]/30 text-[#E11D48] hover:bg-[#E11D48]/10 transition-colors"
                >
                  {deleteLoading ? "..." : "🗑️"}
                </button>
              )}
              <Link
                href={`/submit?category=${encodeURIComponent(community.name)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-white"
                style={{ backgroundColor: community.color + "20", border: `1px solid ${community.color}40`, color: community.color }}
              >
                ✍️ Post Here
              </Link>
              <button
                onClick={handleJoin}
                disabled={joinLoading}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  joined
                    ? "bg-slate-100 dark:bg-[#1A1A28] border border-[#2A2A40] text-[#94A3B8] hover:border-[#E11D48]/50 hover:text-[#E11D48]"
                    : "text-white"
                }`}
                style={!joined ? { backgroundColor: community.color, boxShadow: `0 0 16px ${community.color}40` } : {}}
              >
                {joinLoading ? "..." : joined ? "✓ Joined" : "+ Join"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6 items-start">
          {/* Posts */}
          <div className="flex-1 min-w-0">
            {/* Sort */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-1 w-fit mb-4">
              {(["new", "hot", "top"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    sort === s ? "bg-[#E11D48] text-white" : "text-[#64748B] dark:hover:text-white hover:text-slate-800 hover:bg-slate-100 dark:bg-[#1A1A28]"
                  }`}
                >
                  {s === "new" ? "✨ New" : s === "hot" ? "🔥 Hot" : "📈 Top"}
                </button>
              ))}
            </div>

            {sorted.length === 0 ? (
              <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-16 text-center">
                <div className="text-5xl mb-4">{community.emoji}</div>
                <p className="text-slate-800 dark:text-[#E2E8F0] font-semibold">No posts yet</p>
                <p className="text-[#475569] text-sm mt-1 mb-4">Be the first to post in this community!</p>
                <Link
                  href={`/submit?category=${encodeURIComponent(community.name)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: community.color }}
                >
                  ✍️ Create First Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    voteState={getVoteState(post.id)}
                    onVote={handleVote}
                    commentCount={commentCounts[post.id] ?? 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-8">
            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">About</h3>
              <p className="text-[#94A3B8] text-sm">{community.description || "A community on RevengeNation."}</p>
              <div className="border-t border-slate-200 dark:border-[#1E1E2E] mt-3 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Members</span>
                  <span className="text-white font-bold">{memberCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Posts</span>
                  <span className="text-white font-bold">{posts.length}</span>
                </div>
              </div>
              <Link
                href={`/submit?category=${encodeURIComponent(community.name)}`}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: community.color }}
              >
                ✍️ Post Here
              </Link>
            </div>

            <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Community Rules</h3>
              <ol className="space-y-2">
                {["Be respectful", "No personal info", "Stay on topic", "No spam", "Real stories only"].map((rule, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#94A3B8]">
                    <span className="text-[#E11D48] font-bold shrink-0">{i + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

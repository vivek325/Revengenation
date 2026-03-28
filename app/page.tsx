"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { posts as staticPosts } from "@/data/posts";
import {
  getUserAddedPosts,
  getVoteAdjustments,
  getUpvotedPosts,
  getDownvotedPosts,
  castVote,
  getDeletedPostIds,
  getUserCommunities,
} from "@/lib/storage";
import { getSession } from "@/lib/auth";
import type { Post, Community } from "@/types";

const SORT_OPTIONS = [
  { label: "Hot", icon: "🔥" },
  { label: "New", icon: "✨" },
  { label: "Top", icon: "📈" },
  { label: "Rising", icon: "🚀" },
];

const COMMUNITIES = [
  { name: "Red Flag Guide", emoji: "🚩", color: "#EF4444" },
  { name: "Psychology & Mindset", emoji: "🧠", color: "#8B5CF6" },
  { name: "Stories", emoji: "📖", color: "#F59E0B" },
  { name: "How-To Guides", emoji: "🔍", color: "#3B82F6" },
  { name: "Relationship Advice", emoji: "💔", color: "#EC4899" },
  { name: "Listicle/Roundup", emoji: "📊", color: "#10B981" },
];

export default function Home() {
  const [sort, setSort] = useState("New");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [voteAdjustments, setVoteAdjustments] = useState<Record<number, number>>({});
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set());
  const [downvoted, setDownvoted] = useState<Set<number>>(new Set());
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setVoteAdjustments(getVoteAdjustments());
    setUpvoted(getUpvotedPosts());
    setDownvoted(getDownvotedPosts());
    setUserPosts(getUserAddedPosts());
    setDeletedIds(getDeletedPostIds());
    setUserCommunities(getUserCommunities());
    setMounted(true);
  }, []);

  const allPosts = useMemo(
    () =>
      [...staticPosts, ...userPosts]
        .filter((p) => !deletedIds.includes(p.id))
        .map((p) => ({ ...p, votes: p.votes + (voteAdjustments[p.id] || 0) })),
    [userPosts, voteAdjustments, deletedIds]
  );

  const filtered = useMemo(() => {
    let r = allPosts;
    if (activeCategory) r = r.filter((p) => p.category === activeCategory);
    if (search.trim())
      r = r.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.content.toLowerCase().includes(search.toLowerCase())
      );
    if (sort === "New")
      return [...r].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    if (sort === "Top") return [...r].sort((a, b) => b.votes - a.votes);
    if (sort === "Rising")
      return [...r].sort((a, b) => {
        const aAge = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
        const bAge = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
        return b.votes / (bAge + 1) - a.votes / (aAge + 1);
      });
    return [...r].sort((a, b) => b.votes - a.votes); // Hot
  }, [allPosts, activeCategory, search, sort]);

  const handleVote = (postId: number, dir: "up" | "down") => {
    if (!getSession()) {
      router.push("/login?redirect=/");
      return;
    }
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

    castVote(postId, delta, nowUp, nowDown);
    const nextUp = new Set(upvoted);
    const nextDown = new Set(downvoted);
    if (nowUp) nextUp.add(postId); else nextUp.delete(postId);
    if (nowDown) nextDown.add(postId); else nextDown.delete(postId);
    setUpvoted(nextUp);
    setDownvoted(nextDown);
    setVoteAdjustments((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + delta }));
  };

  const getVoteState = (id: number): "up" | "down" | null =>
    upvoted.has(id) ? "up" : downvoted.has(id) ? "down" : null;

  const totalVotes = allPosts.reduce((s, p) => s + p.votes, 0);

  // Merge built-in + user-created communities
  const allCommunities = [
    ...COMMUNITIES,
    ...userCommunities.map((c) => ({ name: c.name, emoji: c.emoji, color: c.color })),
  ];

  const communitiesWithCounts = allCommunities.map((c) => ({
    ...c,
    count: allPosts.filter((p) => p.category === c.name).length,
  })).sort((a, b) => b.count - a.count);


  return (
    <div className="min-h-screen bg-[#08080E]">

      {/* Main layout */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
        <div>
          {/* ── Feed ─────────────────────────────── */}
          <div>

            {/* Search */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0F0F18] border border-[#1E1E2E] focus:border-[#E11D48]/40 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-[#475569] text-sm outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-1 w-fit mb-4">
              {SORT_OPTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setSort(label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    sort === label
                      ? "bg-[#E11D48] text-white"
                      : "text-[#64748B] hover:text-white hover:bg-[#1A1A28]"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  !activeCategory
                    ? "bg-[#E11D48] text-white"
                    : "bg-[#0F0F18] border border-[#1E1E2E] text-[#64748B] hover:text-white hover:border-[#2A2A40]"
                }`}
              >
                All
              </button>
              {COMMUNITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() =>
                    setActiveCategory((prev) => (prev === c.name ? null : c.name))
                  }
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeCategory === c.name
                      ? "bg-[#1A1A28] border text-white"
                      : "bg-[#0F0F18] border border-[#1E1E2E] text-[#64748B] hover:text-white hover:border-[#2A2A40]"
                  }`}
                  style={activeCategory === c.name ? { borderColor: c.color, color: c.color } : {}}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* Count */}
            <p className="text-[#2A2A40] text-xs mb-4 font-medium">
              {filtered.length} {filtered.length === 1 ? "story" : "stories"} found
            </p>

            {/* Posts */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-[#0F0F18] border border-[#1E1E2E] rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#E2E8F0] font-semibold">No stories found</p>
                  <p className="text-[#475569] text-sm mt-1">
                    Try different filters or{" "}
                    <Link href="/submit" className="text-[#E11D48] hover:underline">
                      share yours
                    </Link>
                  </p>
                </div>
              ) : (
                filtered.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    voteState={getVoteState(post.id)}
                    onVote={handleVote}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import {
  getUserAddedPosts,
  getVoteAdjustments,
  getUpvotedPosts,
  getDownvotedPosts,
  castVote,
  getDeletedPostIds,
  getUserCommunities,
  getAllCommentCounts,
} from "@/lib/storage";
import { getSession } from "@/lib/auth";
import type { Post, Community } from "@/types";
import { Flame, Sparkles, TrendingUp, Rocket, ChevronUp, ChevronDown, X, Maximize2, Search } from "lucide-react";

interface FeaturedVideo { id: string; url: string; title: string; }

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const SORT_OPTIONS = ["Hot", "New", "Top", "Rising"];

// Built-in categories shown on main feed
const BUILTIN_CATEGORIES = [
  { name: "Red Flag Guide", color: "#EF4444" },
  { name: "Psychology & Mindset", color: "#8B5CF6" },
  { name: "Cheating Stories", color: "#F59E0B" },
  { name: "How-To Guides", color: "#3B82F6" },
  { name: "Relationship Advice", color: "#EC4899" },
  { name: "Listicle/Roundup", color: "#10B981" },
];

const BUILTIN_NAMES = new Set(BUILTIN_CATEGORIES.map((c) => c.name));

function communitySlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [catExpanded, setCatExpanded] = useState(true);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [vidExpanded, setVidExpanded] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<FeaturedVideo | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const [adj, posts, deleted, comms, session, counts] = await Promise.all([
        getVoteAdjustments(),
        getUserAddedPosts(),
        getDeletedPostIds(),
        getUserCommunities(),
        getSession(),
        getAllCommentCounts(),
      ]);
      setVoteAdjustments(adj);
      setUserPosts(posts);
      setDeletedIds(deleted);
      setUserCommunities(comms);
      setUserId(session?.id || null);
      setCommentCounts(counts);
      if (session) {
        const [up, down] = await Promise.all([
          getUpvotedPosts(session.id),
          getDownvotedPosts(session.id),
        ]);
        setUpvoted(up);
        setDownvoted(down);
      }
    }
    load();
    fetch("/api/videos").then((r) => r.json()).then((d) => setFeaturedVideos(d.videos || [])).catch(() => {});
  }, []);

  // User-created community names (posts in these should NOT appear on main feed)
  const userCommunityNames = useMemo(
    () => new Set(userCommunities.map((c) => c.name)),
    [userCommunities]
  );

  // Main feed: only built-in category posts (exclude user community posts)
  const allPosts = useMemo(
    () =>
      [...userPosts]
        .filter((p) => !deletedIds.includes(p.id))
        .filter((p) => !userCommunityNames.has(p.category))
        .map((p) => ({ ...p, votes: p.votes + (voteAdjustments[p.id] || 0) })),
    [userPosts, voteAdjustments, deletedIds, userCommunityNames]
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
      return [...r].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "Top") return [...r].sort((a, b) => b.votes - a.votes);
    if (sort === "Rising")
      return [...r].sort((a, b) => {
        const aAge = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
        const bAge = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
        return b.votes / (bAge + 1) - a.votes / (aAge + 1);
      });
    return [...r].sort((a, b) => b.votes - a.votes);
  }, [allPosts, activeCategory, search, sort]);

  const handleVote = async (postId: number, dir: "up" | "down") => {
    if (!userId) { router.push("/login?redirect=/"); return; }
    const isUp = upvoted.has(postId);
    const isDown = downvoted.has(postId);
    let delta = 0, nowUp = false, nowDown = false;
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

  const getVoteState = (id: number): "up" | "down" | null =>
    upvoted.has(id) ? "up" : downvoted.has(id) ? "down" : null;

  const builtinWithCounts = BUILTIN_CATEGORIES.map((c) => ({
    ...c,
    count: allPosts.filter((p) => p.category === c.name).length,
  }));

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#07090F] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        <div className="flex gap-6 items-start">

          {/* ── Feed (left) ─────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] focus:border-[#E11D48]/40 rounded-xl pl-10 pr-9 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#475569] text-sm outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569] hover:text-slate-700 dark:hover:text-white transition-colors" aria-label="Clear search"><X size={16} /></button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl p-1 w-fit mb-4">
              {SORT_OPTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => setSort(label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    sort === label ? "bg-[#E11D48] text-white" : "text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A28]"
                  }`}
                >
                  {label === "Hot" ? <Flame size={13} /> : label === "New" ? <Sparkles size={13} /> : label === "Top" ? <TrendingUp size={13} /> : <Rocket size={13} />}
                  {label}
                </button>
              ))}
            </div>

            {/* Count */}
            <p className="text-slate-400 dark:text-[#2A2A40] text-xs mb-4 font-medium">
              {filtered.length} {filtered.length === 1 ? "story" : "stories"} found
            </p>

            {/* Posts */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl p-16 text-center">
                  <div className="flex justify-center mb-4"><Search size={48} className="text-slate-300 dark:text-[#2A2A40]" /></div>
                  <p className="text-slate-700 dark:text-[#E2E8F0] font-semibold">No stories found</p>
                  <p className="text-slate-500 dark:text-[#475569] text-sm mt-1">
                    Try different filters or{" "}
                    <Link href="/submit" className="text-[#E11D48] hover:underline">share yours</Link>
                  </p>
                </div>
              ) : (
                filtered.map((post) => (
                  <PostCard key={post.id} post={post} voteState={getVoteState(post.id)} onVote={handleVote} commentCount={commentCounts[post.id] ?? 0} />
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT Sidebar — Categories ───────────── */}
          <div className="hidden lg:flex flex-col w-56 shrink-0 gap-3 self-start">
            <div className="bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl">
              <button
                onClick={() => setCatExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#161B2A] transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-500 dark:text-[#64748B] uppercase tracking-wider">Categories</h3>
                {catExpanded ? <ChevronUp size={14} className="text-slate-400 dark:text-[#475569]" /> : <ChevronDown size={14} className="text-slate-400 dark:text-[#475569]" />}
              </button>
              {catExpanded && (
              <div className="px-3 pb-3 space-y-0.5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !activeCategory
                      ? "bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A28]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-[#E11D48]"></span>
                    <span>All</span>
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${!activeCategory ? "bg-[#E11D48]/20 text-[#E11D48]" : "bg-slate-100 dark:bg-[#1A1A28] text-slate-500 dark:text-[#475569]"}`}>
                    {allPosts.length}
                  </span>
                </button>
                {builtinWithCounts.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setActiveCategory((prev) => (prev === c.name ? null : c.name))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === c.name
                        ? "bg-slate-100 dark:bg-[#1A1A28] border"
                        : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A28]"
                    }`}
                    style={activeCategory === c.name ? { borderColor: c.color + "40", color: c.color } : {}}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                      <span className="truncate text-xs">{c.name}</span>
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md shrink-0 ml-1"
                      style={activeCategory === c.name
                        ? { backgroundColor: c.color + "20", color: c.color }
                        : { backgroundColor: "transparent", color: "#64748B" }}
                    >
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
              )}
            </div>

          {/* ── RIGHT Sidebar — Featured Videos ─────────────── */}
          {featuredVideos.length > 0 && (
            <div className="bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl">
              <button
                onClick={() => setVidExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#161B2A] transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-500 dark:text-[#64748B] uppercase tracking-wider">Featured Videos</h3>
                {vidExpanded ? <ChevronUp size={14} className="text-slate-400 dark:text-[#475569]" /> : <ChevronDown size={14} className="text-slate-400 dark:text-[#475569]" />}
              </button>
              {vidExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {featuredVideos.map((v) => {
                    const ytId = getYouTubeId(v.url);
                    if (!ytId) return null;
                    return (
                      <div key={v.id} className="space-y-1.5">
                        <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 dark:border-[#1C2035] group" style={{ paddingTop: "56.25%" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                          <button
                            onClick={() => setExpandedVideo(v)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black z-10"
                            title="Fullscreen"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>
                        {v.title && <p className="text-slate-500 dark:text-[#94A3B8] text-xs leading-snug">{v.title}</p>}
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#64748B] hover:text-[#E11D48] transition-colors"
                        >
                          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 7s-.3-1.9-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.3 3 12 3 12 3s-4.3 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5.3 1 7 1 7S.7 9 .7 11v1.9C.7 15 1 17 1 17s.3 1.9 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21 12 21 12 21s4.3 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.7 1.2-2.7s.3-2 .3-4V11c0-2-.3-4-.3-4zm-13.7 8.1V8.9l8.1 3.1-8.1 3.1z" />
                          </svg>
                          Watch on YouTube
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </div>

        </div>
      </div>

      {/* Fullscreen video modal */}
      {expandedVideo && (() => {
        const ytId = getYouTubeId(expandedVideo.url);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setExpandedVideo(null)}
          >
            <div
              className="relative w-full max-w-4xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-white font-semibold text-sm truncate pr-4">{expandedVideo.title || "Video"}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={expandedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-lg transition-colors font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 7s-.3-1.9-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.3 3 12 3 12 3s-4.3 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5.3 1 7 1 7S.7 9 .7 11v1.9C.7 15 1 17 1 17s.3 1.9 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21 12 21 12 21s4.3 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.7 1.2-2.7s.3-2 .3-4V11c0-2-.3-4-.3-4zm-13.7 8.1V8.9l8.1 3.1-8.1 3.1z" />
                    </svg>
                    Watch on YouTube
                  </a>
                  <button
                    onClick={() => setExpandedVideo(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-lg"
                  ><X size={18} className="shrink-0" /></button>
                </div>
              </div>
              <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-[#1C2035]" style={{ paddingTop: "56.25%" }}>
                {ytId && (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title={expandedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

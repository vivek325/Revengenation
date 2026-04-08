"use client";

import { useState, useEffect, useMemo } from "react";
import RNLoader from "@/components/RNLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { posts as staticPosts } from "@/data/posts";
import {
  getUserAddedPosts,
  saveUserAddedPost,
  getVoteAdjustments,
  getDeletedPostIds,
  markPostDeleted,
  markPostRestored,
} from "@/lib/storage";
import { getSession } from "@/lib/auth";
import type { Post } from "@/types";

const CATEGORIES = [
  "Betrayal",
  "Revenge",
  "Karma",
  "Toxic Love",
  "Workplace",
  "Family Drama",
  "Friendships",
  "Trust Issues",
];

type FormState = {
  title: string;
  content: string;
  fullStory: string;
  author: string;
  category: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  fullStory: "",
  author: "",
  category: "Betrayal",
};

export default function Admin() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [voteAdjustments, setVoteAdjustments] = useState<Record<number, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  // Auth guard
  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (!session?.isAdmin) {
        router.replace("/login?redirect=/admin");
        setAuthChecked(true);
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
      const [posts, deletedIdsData, adj] = await Promise.all([
        getUserAddedPosts(),
        getDeletedPostIds(),
        getVoteAdjustments(),
      ]);
      setUserPosts(posts);
      setDeletedIds(deletedIdsData);
      setVoteAdjustments(adj);
    }
    init();
  }, [router]);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const allPosts = useMemo(() => {
    return [...staticPosts, ...userPosts].map((p) => ({
      ...p,
      votes: p.votes + (voteAdjustments[p.id] || 0),
      deleted: deletedIds.includes(p.id),
    }));
  }, [userPosts, voteAdjustments, deletedIds]);

  const activePosts = allPosts.filter((p) => !p.deleted);
  const deletedPosts = allPosts.filter((p) => p.deleted);
  const totalVotes = activePosts.reduce((s, p) => s + p.votes, 0);
  const topPost = [...activePosts].sort((a, b) => b.votes - a.votes)[0];

  const handleDelete = async (id: number) => {
    setDeletedIds((prev) => [...prev, id]);
    await markPostDeleted(id);
  };

  const handleRestore = async (id: number) => {
    setDeletedIds((prev) => prev.filter((d) => d !== id));
    await markPostRestored(id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const session = await getSession();
    const newPost: Post = {
      id: Date.now(),
      title: form.title.trim(),
      content: form.content.trim(),
      fullStory: form.fullStory.trim() || form.content.trim(),
      author: form.author.trim() || "Admin",
      category: form.category,
      votes: 1,
      createdAt: new Date().toISOString(),
    };
    await saveUserAddedPost(newPost);
    setUserPosts((prev) => [...prev, newPost]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const displayList = activeTab === "active" ? activePosts : deletedPosts;

  if (!authChecked) return <RNLoader />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#818384] mb-6">
          <Link href="/" className="hover:underline hover:text-slate-900 dark:text-[#D7DADC]">r/RevengeNation</Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-[#D7DADC]">Admin Panel</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#D7DADC]">u/Admin Dashboard</h1>
            <p className="text-[#818384] text-xs mt-0.5">Manage stories and view community stats</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-sm font-bold rounded-full transition-colors"
          >
            + Add Story
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Active Stories", value: activePosts.length, icon: "📖" },
            { label: "Total Votes", value: totalVotes.toLocaleString(), icon: "🔥" },
            { label: "User Submitted", value: userPosts.filter((p) => !deletedIds.includes(p.id)).length, icon: "✍️" },
            { label: "Removed", value: deletedPosts.length, icon: "🗑️" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded-[4px] p-4"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xl font-black text-slate-900 dark:text-[#D7DADC]">{stat.value}</div>
              <div className="text-[#818384] text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top story */}
        {topPost && (
          <div className="bg-slate-50 dark:bg-[#272729] border border-[#FF4500]/30 rounded-[4px] p-4 mb-5">
            <div className="text-xs text-[#FF4500] font-bold uppercase tracking-widest mb-2">🏆 Top Post</div>
            <Link href={`/story/${topPost.id}`} className="text-slate-900 dark:text-[#D7DADC] font-semibold dark:hover:text-white hover:text-slate-800 hover:underline block text-sm mb-1">
              {topPost.title}
            </Link>
            <div className="text-[#818384] text-xs">
              ⬆ {topPost.votes.toLocaleString()} votes · u/{topPost.author} · r/{topPost.category}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded-[4px] overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-[#343536]">
            {(["active", "deleted"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "text-slate-900 dark:text-[#D7DADC] border-[#D7DADC]"
                    : "text-[#818384] border-transparent hover:text-slate-900 dark:text-[#D7DADC] hover:bg-[#343536]"
                }`}
              >
                {tab} ({tab === "active" ? activePosts.length : deletedPosts.length})
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-[#343536]">
            {displayList.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">{activeTab === "active" ? "📭" : "🗑️"}</div>
                <p className="text-[#818384] text-sm">No {activeTab} posts</p>
              </div>
            ) : (
              displayList.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white dark:bg-[#1A1A1B] transition-colors"
                >
                  {/* Vote */}
                  <div className="text-center shrink-0 w-10">
                    <div className="text-[#FF4500] font-bold text-sm">{post.votes >= 1000 ? `${(post.votes/1000).toFixed(1)}k` : post.votes}</div>
                    <div className="text-[#818384] text-xs">votes</div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-[#D7DADC] text-sm font-medium truncate">{post.title}</p>
                    <p className="text-[#818384] text-xs mt-0.5">
                      r/{post.category} · u/{post.author}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/story/${post.id}`}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] hover:border-[#818384] text-[#818384] hover:text-slate-900 dark:text-[#D7DADC] rounded transition-colors"
                    >
                      View
                    </Link>
                    {activeTab === "deleted" ? (
                      <button
                        onClick={() => handleRestore(post.id)}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-[#1A1A1B] border border-green-800 text-green-400 hover:bg-green-950 rounded transition-colors"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-[#1A1A1B] border border-[#FF4500]/40 text-[#FF4500] hover:bg-[#FF4500]/10 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Story Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded-[4px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#343536]">
              <h3 className="text-slate-900 dark:text-[#D7DADC] font-bold">Add Story</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#818384] hover:text-slate-900 dark:text-[#D7DADC] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-3">
              <div>
                <label className="text-[#818384] text-xs font-bold block mb-1.5">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Story title..."
                  className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] hover:border-[#818384] focus:border-[#D7DADC] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[#818384] text-xs font-bold block mb-1.5">Short Preview *</label>
                <textarea
                  required
                  rows={3}
                  value={form.content}
                  onChange={(e) => update("content", e.target.value)}
                  placeholder="2–3 sentence hook shown on feed cards..."
                  className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] hover:border-[#818384] focus:border-[#D7DADC] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-[#818384] text-xs font-bold block mb-1.5">Full Story</label>
                <textarea
                  rows={6}
                  value={form.fullStory}
                  onChange={(e) => update("fullStory", e.target.value)}
                  placeholder="The complete story..."
                  className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] hover:border-[#818384] focus:border-[#D7DADC] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#818384] text-xs font-bold block mb-1.5">Author</label>
                  <input
                    value={form.author}
                    onChange={(e) => update("author", e.target.value)}
                    placeholder="Anonymous"
                    className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] hover:border-[#818384] focus:border-[#D7DADC] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[#818384] text-xs font-bold block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] focus:border-[#D7DADC] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] text-sm outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-50 dark:bg-[#272729]">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-[#818384] text-slate-900 dark:text-[#D7DADC] hover:bg-[#343536] text-sm font-bold rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#FF4500] hover:bg-[#E03D00] disabled:opacity-50 text-white text-sm font-bold rounded-full transition-colors"
                >
                  {saving ? "Adding…" : "Add Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

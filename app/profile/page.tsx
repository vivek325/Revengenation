"use client";

import { useState, useEffect } from "react";
import RNLoader from "@/components/RNLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, getSessionSync } from "@/lib/auth";
import { storyUrl } from "@/lib/utils";
import {
  getUserAddedPosts,
  getAllComments,
  getUpvotedPosts,
  getUserCommunities,
  getProfile,
  saveProfile,
  type UserProfile,
} from "@/lib/storage";
import type { Post, Comment, Community } from "@/types";

const TABS = ["Posts", "Comments", "Upvoted", "Communities"] as const;
type Tab = (typeof TABS)[number];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; isAdmin: boolean } | null>(null);
  // Instant auth check from localStorage - no blank flash
  const syncSession = typeof window !== "undefined" ? getSessionSync() : null;
  const [authChecked, setAuthChecked] = useState(() => !!syncSession);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Posts");
  const [editing, setEditing] = useState(false);

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(new Set());
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [profile, setProfile] = useState<UserProfile>(
    syncSession ? { username: syncSession.username, bio: "", displayName: syncSession.username } : { username: "", bio: "", displayName: "" }
  );
  const [editForm, setEditForm] = useState({ displayName: syncSession?.username || "", bio: "" });

  useEffect(() => {
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/login?redirect=/profile");
        return;
      }
      setUser(session);
      setAuthChecked(true);

      // Fire all in parallel — don't await sequentially
      const [added, allComments, up, comms, profileData] = await Promise.all([
        getUserAddedPosts(),
        getAllComments(),
        getUpvotedPosts(session.id),
        getUserCommunities(),
        getProfile(session.username),
      ]);

      const namedMine = added.filter((p) => p.author === session.username);
      setMyPosts(namedMine);
      setMyComments(allComments.filter((c) => c.author === session.username));
      setUpvotedIds(up);
      setCommunities(comms);

      const { posts: staticPosts } = await import("@/data/posts");
      setAllPosts([...staticPosts, ...added]);

      setProfile(profileData);
      setEditForm({ displayName: profileData.displayName || session.username, bio: profileData.bio || "" });
      setDataLoaded(true);
    }
    // If sync says logged in, start the user as logged in immediately
    if (syncSession) setUser(syncSession);
    load();
  }, [router]);

  const saveEdit = async () => {
    if (!user) return;
    const updated: UserProfile = {
      username: user.username,
      displayName: editForm.displayName.trim() || user.username,
      bio: editForm.bio.trim(),
      avatarUrl: profile.avatarUrl,
      avatarEmoji: profile.avatarEmoji,
    };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  if (!authChecked) return null;

  const upvotedPosts = allPosts.filter((p) => upvotedIds.has(p.id));

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#475569] mb-6">
          <Link href="/" className="hover:text-[#94A3B8] transition-colors">Home</Link>
          <span>›</span>
          <span className="text-[#94A3B8]">Profile</span>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-2xl overflow-hidden mb-6">
          <div className="h-1" style={{ background: "linear-gradient(90deg, #E11D48, #7C3AED)" }} />
          <div className="p-6">
            {editing ? (
              <div className="space-y-4">
                <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-4">Edit Profile</h2>
                <div>
                  <label className="text-[#64748B] text-xs font-semibold uppercase tracking-wide block mb-1.5">Display Name</label>
                  <input
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[#64748B] text-xs font-semibold uppercase tracking-wide block mb-1.5">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell something about yourself…"
                    className="w-full bg-slate-100 dark:bg-[#1A1A28] border border-slate-300 dark:border-[#2A2A3E] focus:border-[#E11D48]/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors resize-none placeholder-[#475569]"
                  />

                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveEdit}
                    className="px-5 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-5 py-2 border border-slate-200 dark:border-[#1E1E2E] text-[#94A3B8] hover:bg-slate-100 dark:bg-[#1A1A28] text-sm font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-2xl font-black uppercase shrink-0 overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : profile.avatarEmoji ? (
                    <span className="text-3xl leading-none">{profile.avatarEmoji}</span>
                  ) : (
                    (profile.displayName || user?.username || "?")[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-slate-900 dark:text-white text-xl font-black">{profile.displayName || user?.username}</h1>
                    {user?.isAdmin && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E11D48]/15 text-[#E11D48] border border-[#E11D48]/20">Admin</span>
                    )}
                  </div>
                  <p className="text-[#475569] text-xs mt-0.5">@{user?.username}</p>
                  {profile.bio ? (
                    <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-[#2A2A3E] text-sm mt-2 italic">No bio yet.</p>
                  )}

                  {/* Stats row */}
                  <div className="flex gap-6 mt-4">
                    <div>
                      <span className="text-white font-bold text-sm">{myPosts.length}</span>
                      <span className="text-[#475569] text-xs ml-1">Posts</span>
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{myComments.length}</span>
                      <span className="text-[#475569] text-xs ml-1">Comments</span>
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{upvotedIds.size}</span>
                      <span className="text-[#475569] text-xs ml-1">Upvoted</span>
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{communities.length}</span>
                      <span className="text-[#475569] text-xs ml-1">Communities</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="shrink-0 px-4 py-2 text-xs font-bold border border-slate-300 dark:border-[#2A2A3E] text-[#94A3B8] dark:hover:text-white hover:text-slate-800 hover:bg-slate-100 dark:bg-[#1A1A28] rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-slate-50 dark:bg-[#1A1A28] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2A2A3E]"
                  : "text-[#475569] hover:text-[#94A3B8]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Posts */}
        {activeTab === "Posts" && (
          <div className="space-y-3">
            {!dataLoaded ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" /></div>
            ) : myPosts.length === 0 ? (
              <EmptyState text="You haven't posted anything yet." cta={{ href: "/submit", label: "Create a Post" }} />
            ) : (
              myPosts.map((post) => <PostRow key={post.id} post={post} />)
            )}
          </div>
        )}

        {/* Tab: Comments */}
        {activeTab === "Comments" && (
          <div className="space-y-3">
            {!dataLoaded ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" /></div>
            ) : myComments.length === 0 ? (
              <EmptyState text="You haven't commented on anything yet." />
            ) : (
              myComments.map((c) => <CommentRow key={c.id} comment={c} allPosts={allPosts} />)
            )}
          </div>
        )}

        {/* Tab: Upvoted */}
        {activeTab === "Upvoted" && (
          <div className="space-y-3">
            {!dataLoaded ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" /></div>
            ) : upvotedPosts.length === 0 ? (
              <EmptyState text="You haven't upvoted any posts yet." />
            ) : (
              upvotedPosts.map((post) => <PostRow key={post.id} post={post} dimmed />)
            )}
          </div>
        )}

        {/* Tab: Communities */}
        {activeTab === "Communities" && (
          <div className="space-y-3">
            {!dataLoaded ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" /></div>
            ) : communities.length === 0 ? (
              <EmptyState text="You haven't created any communities yet." cta={{ href: "/communities/new", label: "Create Community" }} />
            ) : (
              communities.map((c) => (
                <div key={c.id} className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: c.color + "22" }}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{c.name}</p>
                    {c.description && <p className="text-[#475569] text-xs mt-0.5 truncate">{c.description}</p>}
                  </div>
                  <span className="text-[#2A2A3E] text-xs">{timeAgo(c.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PostRow({ post, dimmed }: { post: Post; dimmed?: boolean }) {
  return (
    <Link
      href={storyUrl(post.id, post.title)}
      className={`block bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] rounded-xl p-4 transition-colors ${dimmed ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {post.type && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${post.type === "story" ? "bg-[#E11D48]/15 text-[#E11D48]" : "bg-[#3B82F6]/15 text-[#3B82F6]"}`}>
                {post.type === "story" ? "🔥 Story" : "💬 Post"}
              </span>
            )}
            <span className="text-[10px] text-[#475569]">{post.category}</span>
          </div>
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{post.title}</p>
          <p className="text-[#475569] text-xs mt-1">{timeAgo(post.createdAt)} · {post.votes} votes</p>
        </div>
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
        )}
      </div>
    </Link>
  );
}

function CommentRow({ comment, allPosts }: { comment: Comment; allPosts: Post[] }) {
  const post = allPosts.find((p) => p.id === comment.postId);
  return (
    <Link
      href={(post ? storyUrl(post.id, post.title) : `/story/${comment.postId}`) + "#comments"}
      className="block bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] hover:border-slate-300 dark:border-[#2A2A3E] rounded-xl p-4 transition-colors"
    >
      {post && <p className="text-[#475569] text-xs mb-1.5 truncate">on: {post.title}</p>}
      <p className="text-[#94A3B8] text-sm leading-relaxed line-clamp-3">{comment.body}</p>
      <p className="text-[#2A2A3E] text-xs mt-2">{timeAgo(comment.createdAt)}</p>
    </Link>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="bg-white dark:bg-[#0F0F18] border border-slate-200 dark:border-[#1E1E2E] rounded-xl p-10 text-center">
      <p className="text-[#475569] text-sm mb-4">{text}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white text-sm font-bold rounded-lg transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

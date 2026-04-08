"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import RNLoader from "@/components/RNLoader";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth";
import { bustFeedCache } from "@/lib/storage";

//  Types 

type Tab =
  | "overview"
  | "users"
  | "communities"
  | "posts"
  | "comments"
  | "reports"
  | "categories"
  | "settings"
  | "logs"
  | "security"
  | "announcements";

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  is_admin: boolean;
  is_banned: boolean;
  is_shadowbanned: boolean;
  ban_reason: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface CommunityRow {
  id: string;
  name: string;
  emoji: string;
  description: string;
  created_by: string;
  created_at: string;
  is_locked: boolean;
  is_nsfw: boolean;
  is_featured: boolean;
}

interface PostRow {
  id: number;
  title: string;
  author: string;
  category: string;
  votes: number;
  is_hidden: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  is_nsfw: boolean;
  created_at: string;
}

interface CommentRow {
  id: string;
  post_id: number;
  author: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
}

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface LogRow {
  id: string;
  admin_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

interface Analytics {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalCommunities: number;
  bannedUsers: number;
  newUsersWeek: number;
  categoryBreakdown: Record<string, number>;
}

interface Category {
  id: string;
  name: string;
}

//  Helpers 

// Read token synchronously from localStorage — no async Supabase SDK round-trip
function getTokenSync(): string {
  try {
    // Our login writes the full session here
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const ref = url.replace("https://", "").split(".")[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.access_token || "";
    }
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

// Module-level tab data cache — switching tabs never re-fetches within same session
const _tabCache: Record<string, { data: unknown; at: number }> = {};
const TAB_CACHE_TTL = 120_000; // 2 minutes

async function cachedAdminFetch<T>(url: string): Promise<T> {
  const hit = _tabCache[url];
  if (hit && Date.now() - hit.at < TAB_CACHE_TTL) return hit.data as T;
  const res = await adminFetch(url);
  const data = await res.json();
  _tabCache[url] = { data, at: Date.now() };
  return data as T;
}

function bustTabCache(url: string) { delete _tabCache[url]; }

//  Sub-components 

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    red: "bg-red-900/40 text-red-400 border-red-800",
    green: "bg-green-900/40 text-green-400 border-green-800",
    yellow: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    blue: "bg-blue-900/40 text-blue-400 border-blue-800",
    purple: "bg-purple-900/40 text-purple-400 border-purple-800",
    gray: "bg-[#343536] text-[#818384] border-slate-200 dark:border-[#343536]",
    orange: "bg-orange-900/40 text-orange-400 border-orange-800",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

function ActionBtn({ onClick, color, children, disabled }: { onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean }) {
  const colors: Record<string, string> = {
    red: "border-red-800 text-red-400 hover:bg-red-950",
    green: "border-green-800 text-green-400 hover:bg-green-950",
    yellow: "border-yellow-800 text-yellow-400 hover:bg-yellow-950",
    blue: "border-blue-800 text-blue-400 hover:bg-blue-950",
    gray: "border-slate-200 dark:border-[#343536] text-[#818384] hover:text-slate-900 dark:text-[#D7DADC] hover:border-[#818384]",
    orange: "border-[#FF4500]/40 text-[#FF4500] hover:bg-[#FF4500]/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-2.5 py-1 bg-white dark:bg-[#1A1A1B] border rounded transition-colors disabled:opacity-40 ${colors[color] || colors.gray}`}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-slate-900 dark:text-[#D7DADC] font-bold text-lg">{title}</h2>
      {subtitle && <p className="text-[#818384] text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

//  Overview 

function Overview({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return <div className="text-[#818384] text-sm">Loading analytics...</div>;
  const stats = [
    { label: "Total Users", value: analytics.totalUsers, icon: "", color: "blue" },
    { label: "Total Posts", value: analytics.totalPosts, icon: "", color: "orange" },
    { label: "Comments", value: analytics.totalComments, icon: "", color: "purple" },
    { label: "Communities", value: analytics.totalCommunities, icon: "", color: "green" },
    { label: "Banned Users", value: analytics.bannedUsers, icon: "", color: "red" },
    { label: "New Users (7d)", value: analytics.newUsersWeek, icon: "", color: "yellow" },
  ];
  const colorBorder: Record<string, string> = {
    blue: "border-blue-800/40", orange: "border-[#FF4500]/30", purple: "border-purple-800/40",
    green: "border-green-800/40", red: "border-red-800/40", yellow: "border-yellow-800/40",
  };
  return (
    <div>
      <SectionHeader title="Overview" subtitle="Platform-wide analytics" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white dark:bg-[#1A1A1B] border ${colorBorder[s.color]} rounded-[4px] p-4`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-[#D7DADC]">{s.value.toLocaleString()}</div>
            <div className="text-[#818384] text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      {Object.keys(analytics.categoryBreakdown).length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] p-4">
          <div className="text-xs text-[#818384] font-bold uppercase tracking-widest mb-3">Posts by Category</div>
          <div className="space-y-2">
            {Object.entries(analytics.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const max = Math.max(...Object.values(analytics.categoryBreakdown), 1);
              const pct = Math.round((count / max) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="text-[#818384] text-xs w-28 shrink-0">{cat}</div>
                  <div className="flex-1 bg-slate-50 dark:bg-[#272729] rounded-full h-1.5">
                    <div className="bg-[#FF4500] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[#818384] text-xs w-8 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

//  Users 

function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [banModal, setBanModal] = useState<UserRow | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");

  const load = useCallback(async (bust = false) => {
    const url = `/api/admin/users?search=${encodeURIComponent(search)}&filter=${filter}`;
    if (bust) bustTabCache(url);
    setLoading(true);
    const data = await cachedAdminFetch<{ users: UserRow[] }>(url);
    setUsers(data.users || []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, userId: string, extra?: object) => {
    await adminFetch("/api/admin/users", { method: "POST", body: JSON.stringify({ action, userId, ...extra }) });
    load(true);
  };

  const handleBan = async () => {
    if (!banModal) return;
    await act("ban", banModal.id, { reason: banReason, duration: banDuration ? parseInt(banDuration) : undefined });
    setBanModal(null); setBanReason(""); setBanDuration("");
  };

  return (
    <div>
      <SectionHeader title="User Management" subtitle="Manage all registered users" />
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username..."
          className="flex-1 min-w-[180px] bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-1.5 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none focus:border-[#818384]" />
        {["all","banned","admin","verified"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded border capitalize transition-colors ${filter===f ? "bg-[#FF4500] border-[#FF4500] text-white" : "bg-white dark:bg-[#1A1A1B] border-slate-200 dark:border-[#343536] text-[#818384] hover:text-slate-900 dark:text-[#D7DADC]"}`}>{f}</button>
        ))}
      </div>
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {users.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No users found</div>}
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="text-2xl shrink-0">{u.avatar_emoji || ""}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-900 dark:text-[#D7DADC] text-sm font-medium">u/{u.username}</span>
                  {u.is_admin && <Badge color="purple">Admin</Badge>}
                  {u.is_banned && <Badge color="red">Banned</Badge>}
                  {u.is_shadowbanned && <Badge color="yellow">Shadowbanned</Badge>}
                  {u.is_verified && <Badge color="blue"> Verified</Badge>}
                  {u.role === "moderator" && <Badge color="green">Mod</Badge>}
                </div>
                <div className="text-[#818384] text-xs mt-0.5">
                  {u.display_name && `${u.display_name}  `}Joined {new Date(u.created_at).toLocaleDateString()}
                  {u.ban_reason && `   ${u.ban_reason}`}
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                {u.is_banned ? <ActionBtn color="green" onClick={() => act("unban", u.id)}>Unban</ActionBtn>
                  : <ActionBtn color="red" onClick={() => setBanModal(u)}>Ban</ActionBtn>}
                {u.is_shadowbanned ? <ActionBtn color="green" onClick={() => act("unshadowban", u.id)}>Un-Shadow</ActionBtn>
                  : <ActionBtn color="yellow" onClick={() => act("shadowban", u.id)}>Shadow</ActionBtn>}
                {!u.is_verified && <ActionBtn color="blue" onClick={() => act("verify", u.id)}>Verify</ActionBtn>}
                <ActionBtn color="gray" onClick={() => act("force_logout", u.id)}>Logout</ActionBtn>
                <select value={u.role || "user"} onChange={(e) => act("set_role", u.id, { role: e.target.value })}
                  className="text-xs bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] text-[#818384] rounded px-1.5 py-1">
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <ActionBtn color="red" onClick={() => { if (confirm(`Delete u/${u.username}? This cannot be undone.`)) act("delete", u.id); }}>Delete</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded-[4px] w-full max-w-md p-5">
            <h3 className="text-slate-900 dark:text-[#D7DADC] font-bold mb-4">Ban u/{banModal.username}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[#818384] text-xs font-bold block mb-1">Reason</label>
                <input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Violated community rules..."
                  className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none" />
              </div>
              <div>
                <label className="text-[#818384] text-xs font-bold block mb-1">Duration (hours, empty = permanent)</label>
                <input type="number" value={banDuration} onChange={(e) => setBanDuration(e.target.value)} placeholder="Empty = permanent"
                  className="w-full bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setBanModal(null)} className="text-sm px-4 py-2 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] text-[#818384] rounded hover:text-slate-900 dark:text-[#D7DADC]">Cancel</button>
                <button onClick={handleBan} className="text-sm px-4 py-2 bg-red-900 border border-red-700 text-red-300 rounded hover:bg-red-800">Ban User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  Communities 

function Communities() {
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) bustTabCache("/api/admin/content?type=communities");
    setLoading(true);
    const data = await cachedAdminFetch<{ communities: CommunityRow[] }>("/api/admin/content?type=communities");
    setCommunities(data.communities || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, id: string) => {
    await adminFetch("/api/admin/content", { method: "POST", body: JSON.stringify({ action, targetType: "community", targetId: id }) });
    load(true);
  };

  return (
    <div>
      <SectionHeader title="Community Management" subtitle="Manage all communities" />
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {communities.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No communities</div>}
          {communities.map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="text-2xl shrink-0 mt-0.5">{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/communities/${c.id}`} className="text-slate-900 dark:text-[#D7DADC] text-sm font-medium hover:underline">r/{c.name}</Link>
                  {c.is_locked && <Badge color="yellow">Locked</Badge>}
                  {c.is_nsfw && <Badge color="red">NSFW</Badge>}
                  {c.is_featured && <Badge color="green"> Featured</Badge>}
                </div>
                <div className="text-[#818384] text-xs mt-0.5 truncate">{c.description || "No description"}  by {c.created_by}  {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                <ActionBtn color={c.is_locked ? "green" : "yellow"} onClick={() => act("toggle_lock", c.id)}>{c.is_locked ? "Unlock" : "Lock"}</ActionBtn>
                <ActionBtn color={c.is_nsfw ? "gray" : "red"} onClick={() => act("toggle_nsfw", c.id)}>{c.is_nsfw ? "Un-NSFW" : "NSFW"}</ActionBtn>
                <ActionBtn color={c.is_featured ? "gray" : "green"} onClick={() => act("toggle_feature", c.id)}>{c.is_featured ? "Unfeature" : "Feature"}</ActionBtn>
                <ActionBtn color="red" onClick={() => { if (confirm(`Delete r/${c.name}?`)) act("delete", c.id); }}>Delete</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  Posts 

function Posts() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) bustTabCache("/api/admin/content?type=posts");
    setLoading(true);
    const data = await cachedAdminFetch<{ posts: PostRow[] }>("/api/admin/content?type=posts");
    setPosts(data.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, id: number | string) => {
    await adminFetch("/api/admin/content", { method: "POST", body: JSON.stringify({ action, targetType: "post", targetId: String(id) }) });
    if (action === "delete") {
      bustFeedCache();
      // Remove from rn_posts_v3 cache so home page instant-render doesn't show deleted post
      try {
        const raw = localStorage.getItem("rn_posts_v3");
        if (raw) {
          const filtered = (JSON.parse(raw) as { id: number }[]).filter((p) => p.id !== Number(id));
          localStorage.setItem("rn_posts_v3", JSON.stringify(filtered));
        }
      } catch {}
      // Signal other tabs
      try { localStorage.setItem("rn_admin_deleted_post", String(id)); } catch {}
    }
    load(true);
  };

  return (
    <div>
      <SectionHeader title="Post Moderation" subtitle="Manage all posts across the platform" />
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {posts.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No posts</div>}
          {posts.map((p) => (
            <div key={p.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="text-center shrink-0 w-10 mt-0.5">
                <div className="text-[#FF4500] font-bold text-sm">{p.votes}</div>
                <div className="text-[#818384] text-[10px]">votes</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/story/${p.id}`} className="text-slate-900 dark:text-[#D7DADC] text-sm font-medium hover:underline">{p.title}</Link>
                  {p.is_pinned && <Badge color="green"> Pinned</Badge>}
                  {p.is_locked && <Badge color="yellow"> Locked</Badge>}
                  {p.is_nsfw && <Badge color="red">NSFW</Badge>}
                  {p.is_hidden && <Badge color="gray">Hidden</Badge>}
                </div>
                <div className="text-[#818384] text-xs mt-0.5">u/{p.author}  r/{p.category}  {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                <ActionBtn color={p.is_pinned ? "gray" : "green"} onClick={() => act("toggle_pin", p.id)}>{p.is_pinned ? "Unpin" : "Pin"}</ActionBtn>
                <ActionBtn color={p.is_locked ? "gray" : "yellow"} onClick={() => act("toggle_lock", p.id)}>{p.is_locked ? "Unlock" : "Lock"}</ActionBtn>
                <ActionBtn color={p.is_nsfw ? "gray" : "red"} onClick={() => act("toggle_nsfw", p.id)}>{p.is_nsfw ? "Un-NSFW" : "NSFW"}</ActionBtn>
                <ActionBtn color={p.is_hidden ? "blue" : "gray"} onClick={() => act("toggle_hide", p.id)}>{p.is_hidden ? "Unhide" : "Hide"}</ActionBtn>
                <ActionBtn color="red" onClick={() => { if (confirm("Delete this post?")) act("delete", p.id); }}>Delete</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  Comments 

function Comments() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) bustTabCache("/api/admin/content?type=comments");
    setLoading(true);
    const data = await cachedAdminFetch<{ comments: CommentRow[] }>("/api/admin/content?type=comments");
    setComments(data.comments || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, id: string) => {
    await adminFetch("/api/admin/content", { method: "POST", body: JSON.stringify({ action, targetType: "comment", targetId: id }) });
    load(true);
  };

  return (
    <div>
      <SectionHeader title="Comment Moderation" subtitle="Manage all comments" />
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {comments.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No comments</div>}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-slate-900 dark:text-[#D7DADC] text-xs font-medium">u/{c.author}</span>
                  <span className="text-[#818384] text-[10px]">on post #{c.post_id}</span>
                  {c.is_hidden && <Badge color="gray">Hidden</Badge>}
                  <span className="text-[#818384] text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[#818384] text-xs line-clamp-2">{c.body}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <ActionBtn color={c.is_hidden ? "blue" : "gray"} onClick={() => act("toggle_hide", c.id)}>{c.is_hidden ? "Unhide" : "Hide"}</ActionBtn>
                <ActionBtn color="red" onClick={() => { if (confirm("Delete this comment?")) act("delete", c.id); }}>Delete</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  Reports 

function Reports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    const url = `/api/admin/settings?type=reports&status=${statusFilter}`;
    if (bust) bustTabCache(url);
    setLoading(true);
    const data = await cachedAdminFetch<{ reports: ReportRow[] }>(url);
    setReports(data.reports || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (reportId: string, resolution: string) => {
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "resolve_report", reportId, resolution }) });
    load(true);
  };

  return (
    <div>
      <SectionHeader title="Reports & Flags" subtitle="User-submitted reports queue" />
      <div className="flex gap-2 mb-4">
        {["pending","resolved","dismissed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded border capitalize transition-colors ${statusFilter===s ? "bg-[#FF4500] border-[#FF4500] text-white" : "bg-white dark:bg-[#1A1A1B] border-slate-200 dark:border-[#343536] text-[#818384] hover:text-slate-900 dark:text-[#D7DADC]"}`}>{s}</button>
        ))}
      </div>
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {reports.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No {statusFilter} reports</div>}
          {reports.map((r) => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge color={r.target_type === "user" ? "purple" : r.target_type === "post" ? "orange" : "gray"}>{r.target_type}</Badge>
                  <span className="text-[#818384] text-xs">ID: {r.target_id.slice(0, 12)}</span>
                  <span className="text-[#818384] text-[10px]">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-900 dark:text-[#D7DADC] text-xs">{r.reason}</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-1.5 shrink-0">
                  <ActionBtn color="green" onClick={() => resolve(r.id, "resolved")}>Resolve</ActionBtn>
                  <ActionBtn color="gray" onClick={() => resolve(r.id, "dismissed")}>Dismiss</ActionBtn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  Categories 

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) bustTabCache("/api/admin/settings?type=categories");
    setLoading(true);
    const data = await cachedAdminFetch<{ categories: Category[] }>("/api/admin/settings?type=categories");
    setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCat = async () => {
    if (!newCat.trim()) return;
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "add_category", name: newCat.trim() }) });
    setNewCat(""); load(true);
  };

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "delete_category", id }) });
    load(true);
  };

  return (
    <div>
      <SectionHeader title="Category Management" subtitle="Add or remove story categories" />
      <div className="flex gap-2 mb-4">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addCat()} placeholder="New category name..."
          className="flex-1 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-1.5 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none focus:border-[#818384]" />
        <button onClick={addCat} className="px-4 py-1.5 bg-[#FF4500] hover:bg-[#E03D00] text-white text-sm font-bold rounded transition-colors">Add</button>
      </div>
      {loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
          {categories.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No categories</div>}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
              <div className="flex-1">
                <span className="text-slate-900 dark:text-[#D7DADC] text-sm">{c.name}</span>
                <span className="text-[#818384] text-xs ml-2 font-mono">/{c.id}</span>
              </div>
              <ActionBtn color="red" onClick={() => deleteCat(c.id, c.name)}>Delete</ActionBtn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  Site Settings 

function SiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [videos, setVideos] = useState<{ id: string; url: string; title: string }[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [videoSaving, setVideoSaving] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) bustTabCache("/api/admin/settings?type=settings");
    setLoading(true);
    const data = await cachedAdminFetch<{ settings: Record<string, string> }>("/api/admin/settings?type=settings");
    const s = data.settings || {};
    setSettings(s);
    try { setVideos(JSON.parse(s.featured_videos || "[]")); } catch { setVideos([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setLoading(true);
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "update_settings", settings }) });
    bustTabCache("/api/admin/settings?type=settings");
    setSaved(true); setTimeout(() => setSaved(false), 2000); setLoading(false);
  };

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: s[key] === "true" ? "false" : "true" }));

  const saveVideos = async (updated: { id: string; url: string; title: string }[]) => {
    setVideoSaving(true);
    const newSettings = { ...settings, featured_videos: JSON.stringify(updated) };
    setSettings(newSettings);
    setVideos(updated);
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "update_settings", settings: { featured_videos: JSON.stringify(updated) } }) });
    setVideoSaving(false);
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim()) return;
    const updated = [...videos, { id: Date.now().toString(), url: newVideoUrl.trim(), title: newVideoTitle.trim() }];
    await saveVideos(updated);
    setNewVideoUrl(""); setNewVideoTitle("");
  };

  const removeVideo = async (id: string) => {
    await saveVideos(videos.filter((v) => v.id !== id));
  };

  return (
    <div>
      <SectionHeader title="Site Settings" subtitle="Configure global platform settings" />
      {loading && Object.keys(settings).length === 0 ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] p-4 space-y-4">
            <div>
              <label className="text-[#818384] text-xs font-bold block mb-1.5">Site Name</label>
              <input value={settings.site_name || ""} onChange={(e) => setSettings((s) => ({ ...s, site_name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] text-sm outline-none focus:border-[#818384]" />
            </div>
            <div>
              <label className="text-[#818384] text-xs font-bold block mb-1.5">Max Posts Per Hour (per user)</label>
              <input type="number" value={settings.max_posts_per_hour || "10"} onChange={(e) => setSettings((s) => ({ ...s, max_posts_per_hour: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] text-sm outline-none focus:border-[#818384]" />
            </div>
            {[
              { key: "maintenance_mode", label: "Maintenance Mode", desc: "Take site offline temporarily" },
              { key: "nsfw_enabled", label: "NSFW Content Enabled", desc: "Allow NSFW posts and communities" },
              { key: "dms_enabled", label: "Direct Messages Enabled", desc: "Allow users to message each other" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-slate-900 dark:text-[#D7DADC] text-sm">{label}</div>
                  <div className="text-[#818384] text-xs">{desc}</div>
                </div>
                <button onClick={() => toggle(key)} className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${settings[key]==="true" ? "bg-[#FF4500]" : "bg-[#343536]"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key]==="true" ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={loading} className="px-6 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50">
            {saved ? "✅ Saved!" : "Save Settings"}
          </button>

          {/* Featured Videos */}
          <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] p-4 space-y-3">
            <div className="text-slate-900 dark:text-[#D7DADC] text-sm font-bold mb-1">🎥 Featured Videos (Sidebar)</div>
            <p className="text-[#818384] text-xs">YouTube links added here appear in the sidebar for all users.</p>
            {videos.map((v) => (
              <div key={v.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded">
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 dark:text-[#D7DADC] text-xs font-semibold truncate">{v.title || "Untitled"}</div>
                  <div className="text-[#818384] text-[10px] truncate">{v.url}</div>
                </div>
                <button onClick={() => removeVideo(v.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-800 rounded transition-colors shrink-0">Remove</button>
              </div>
            ))}
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-[#343536]">
              <input
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Video title (optional)"
                className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] text-xs outline-none focus:border-[#818384]"
              />
              <div className="flex gap-2">
                <input
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="YouTube URL (e.g. https://youtu.be/xxxxx)"
                  className="flex-1 bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] text-xs outline-none focus:border-[#818384]"
                />
                <button onClick={addVideo} disabled={videoSaving || !newVideoUrl.trim()} className="px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold rounded transition-colors disabled:opacity-50">
                  {videoSaving ? "..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  Announcements 

function Announcements() {
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cachedAdminFetch<{ settings: Record<string, string> }>("/api/admin/settings?type=settings").then((d) => {
      const ann = d.settings?.site_announcement || "";
      setCurrent(ann); setMessage(ann);
    });
  }, [])

  const send = async () => {
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "send_announcement", message }) });
    bustTabCache("/api/admin/settings?type=settings");
    setCurrent(message); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const clear = async () => {
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "send_announcement", message: "" }) });
    bustTabCache("/api/admin/settings?type=settings");
    setMessage(""); setCurrent("");
  };

  return (
    <div>
      <SectionHeader title="Site Announcements" subtitle="Send a global banner to all visitors" />
      <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] p-4 space-y-4">
        {current && (
          <div className="bg-[#FF4500]/10 border border-[#FF4500]/30 rounded p-3">
            <div className="text-[#FF4500] text-xs font-bold mb-1">CURRENT ANNOUNCEMENT</div>
            <p className="text-slate-900 dark:text-[#D7DADC] text-sm">{current}</p>
          </div>
        )}
        <div>
          <label className="text-[#818384] text-xs font-bold block mb-1.5">Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a site-wide announcement..."
            className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded px-3 py-2 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none focus:border-[#818384] resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={send} className="px-5 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-sm font-bold rounded-full transition-colors">{saved ? " Published!" : "Publish"}</button>
          {current && <button onClick={clear} className="px-5 py-2 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] text-[#818384] text-sm rounded-full hover:text-slate-900 dark:text-[#D7DADC] transition-colors">Clear</button>}
        </div>
      </div>
    </div>
  );
}

//  Security 

function Security() {
  const [ipBans, setIpBans] = useState<Array<{ id: string; ip_address: string; reason: string; created_at: string }>>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [tab, setTab] = useState<"logs" | "ipbans">("logs");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bust = false) => {
    if (bust) { bustTabCache("/api/admin/settings?type=logs"); bustTabCache("/api/admin/settings?type=ip_bans"); }
    setLoading(true);
    const [logsData, ipData] = await Promise.all([
      cachedAdminFetch<{ logs: LogRow[] }>("/api/admin/settings?type=logs"),
      cachedAdminFetch<{ ip_bans: Array<{ id: string; ip_address: string; reason: string; created_at: string }> }>("/api/admin/settings?type=ip_bans"),
    ]);
    setLogs(logsData.logs || []);
    setIpBans(ipData.ip_bans || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addIpBan = async () => {
    if (!newIp.trim()) return;
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "add_ip_ban", ip: newIp.trim(), reason: newIpReason }) });
    setNewIp(""); setNewIpReason(""); load(true);
  };

  const removeIpBan = async (id: string) => {
    await adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ action: "remove_ip_ban", id }) });
    load(true);
  };

  const actionColor = (action: string) => {
    if (action.includes("ban") || action.includes("delete")) return "text-red-400";
    if (action.includes("unban") || action.includes("restore")) return "text-green-400";
    if (action.includes("update") || action.includes("setting")) return "text-blue-400";
    return "text-[#818384]";
  };

  return (
    <div>
      <SectionHeader title="Security & Audit" subtitle="Admin logs and IP ban management" />
      <div className="flex gap-2 mb-4">
        {(["logs","ipbans"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded border transition-colors ${tab===t ? "bg-[#FF4500] border-[#FF4500] text-white" : "bg-white dark:bg-[#1A1A1B] border-slate-200 dark:border-[#343536] text-[#818384] hover:text-slate-900 dark:text-[#D7DADC]"}`}>
            {t === "logs" ? "Audit Logs" : "IP Bans"}
          </button>
        ))}
      </div>
      {tab === "logs" && (
        loading ? <div className="text-[#818384] text-sm py-8 text-center">Loading...</div> : (
          <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
            {logs.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No logs yet</div>}
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-900 dark:text-[#D7DADC] text-xs font-medium">u/{l.admin_username}</span>
                    <span className={`text-xs font-mono ${actionColor(l.action)}`}>{l.action}</span>
                    {l.target_type && <Badge color="gray">{l.target_type}</Badge>}
                  </div>
                  {l.details && <p className="text-[#818384] text-xs mt-0.5 truncate">{l.details}</p>}
                </div>
                <div className="text-[#818384] text-[10px] shrink-0 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )
      )}
      {tab === "ipbans" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="IP address (e.g. 1.2.3.4)"
              className="flex-1 min-w-[150px] bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-1.5 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none focus:border-[#818384]" />
            <input value={newIpReason} onChange={(e) => setNewIpReason(e.target.value)} placeholder="Reason..."
              className="flex-1 min-w-[150px] bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded px-3 py-1.5 text-slate-900 dark:text-[#D7DADC] placeholder-[#818384] text-sm outline-none focus:border-[#818384]" />
            <button onClick={addIpBan} className="px-4 py-1.5 bg-red-900 border border-red-700 text-red-300 text-sm rounded hover:bg-red-800 transition-colors">Ban IP</button>
          </div>
          <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-[4px] divide-y divide-slate-200 dark:divide-[#343536]">
            {ipBans.length === 0 && <div className="py-10 text-center text-[#818384] text-sm">No IP bans</div>}
            {ipBans.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-[#272729] transition-colors">
                <div className="flex-1">
                  <div className="text-slate-900 dark:text-[#D7DADC] text-sm font-mono">{b.ip_address}</div>
                  {b.reason && <div className="text-[#818384] text-xs">{b.reason}</div>}
                </div>
                <div className="text-[#818384] text-xs">{new Date(b.created_at).toLocaleDateString()}</div>
                <ActionBtn color="green" onClick={() => removeIpBan(b.id)}>Remove</ActionBtn>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

//  Main Admin Page 

export default function AdminPage() {
  return (
    <Suspense fallback={<RNLoader />}>
      <AdminPageInner />
    </Suspense>
  );
}

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const activeTab = (searchParams.get("tab") ?? "overview") as Tab;

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (!session?.isAdmin) {
        router.replace("/login?redirect=/admin");
        setAuthChecked(true);
        return;
      }
      setAdminUser({ username: session.username });
      setAuthChecked(true);

      cachedAdminFetch<Analytics>("/api/admin/settings?type=analytics").then((d) => setAnalytics(d));
    }
    init();
  }, [router]);

  if (!authChecked) return <RNLoader />;
  if (!adminUser) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-[#818384] mb-1">
            <Link href="/" className="hover:underline hover:text-slate-900 dark:text-[#D7DADC]">r/RevengeNation</Link>
            <span></span>
            <span className="text-slate-900 dark:text-[#D7DADC]">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#D7DADC]"> Admin Panel</h1>
          <p className="text-[#818384] text-xs mt-0.5">Logged in as u/{adminUser.username}</p>
        </div>

        <div className="flex-1 min-w-0">
            {activeTab === "overview" && <Overview analytics={analytics} />}
            {activeTab === "users" && <Users />}
            {activeTab === "communities" && <Communities />}
            {activeTab === "posts" && <Posts />}
            {activeTab === "comments" && <Comments />}
            {activeTab === "reports" && <Reports />}
            {activeTab === "categories" && <Categories />}
            {activeTab === "announcements" && <Announcements />}
            {activeTab === "settings" && <SiteSettings />}
            {activeTab === "security" && <Security />}
          </div>
      </div>
    </div>
  );
}

import { supabase } from "./supabase";
import type { Post, Comment, Community } from "@/types";
import { posts as _staticPosts } from "@/data/posts";

// ── In-memory browser cache (per-session fallback) ──────────────────────────
const _cache = new Map<string, { value: unknown; at: number }>();

function getCache<T>(key: string, ttl: number): T | null {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  return null;
}
function setCache(key: string, value: unknown) {
  _cache.set(key, { value, at: Date.now() });
}
export function bustCache(...keys: string[]) {
  keys.forEach((k) => _cache.delete(k));
  // Also clear the shared feed cache when any feed-related key is invalidated
  const feedKeys = new Set(["posts", "votes", "comment_counts", "communities", "deleted"]);
  if (keys.some((k) => feedKeys.has(k))) _feedCache = null;
}

// ── Server-backed feed cache (Redis via /api/feed) ────────────────────────────
interface FeedData {
  posts: Post[];
  votes: Record<number, number>;
  commentCounts: Record<number, number>;
  communities: Community[];
  deletedPostIds: number[];
}

let _feedCache: { data: FeedData; at: number } | null = null;
let _feedInFlight: Promise<FeedData> | null = null;
const FEED_BROWSER_TTL = 300_000; // 5 min — matches server Redis TTL

async function fetchFeedFromSupabase(): Promise<FeedData> {
  const [postsRes, votesRes, commentsRes, communitiesRes, deletedRes] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, content, full_story, author, category, type, votes, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("vote_adjustments").select("post_id, adjustment").limit(500),
      supabase.from("comments").select("post_id").limit(5000),
      supabase.from("communities").select("*").order("created_at", { ascending: false }),
      supabase.from("deleted_posts").select("post_id"),
    ]);

  const votes: Record<number, number> = {};
  (votesRes.data || []).forEach((r) => { votes[r.post_id] = r.adjustment; });

  const commentCounts: Record<number, number> = {};
  (commentsRes.data || []).forEach((r) => {
    commentCounts[r.post_id] = (commentCounts[r.post_id] || 0) + 1;
  });

  const posts = (postsRes.data || []).map((p) => {
    const excerpt = p.content?.trim()
      || p.full_story?.split("\n").find((l: string) => l.trim().length > 20)?.trim().substring(0, 200)
      || "";
    return {
      id: p.id,
      title: p.title,
      content: excerpt,
      fullStory: "",
      votes: p.votes,
      author: p.author,
      category: p.category,
      type: p.type as "post" | "story",
      imageUrl: p.image_url ?? undefined,
      createdAt: p.created_at,
    };
  });

  const communities = (communitiesRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    emoji: c.emoji,
    color: c.color,
    createdBy: c.created_by,
    createdAt: c.created_at,
    bannerUrl: c.banner_url || undefined,
  }));

  return {
    posts,
    votes,
    commentCounts,
    communities,
    deletedPostIds: (deletedRes.data || []).map((r) => r.post_id),
  };
}

async function fetchFeed(): Promise<FeedData> {
  if (_feedCache && Date.now() - _feedCache.at < FEED_BROWSER_TTL) {
    return _feedCache.data;
  }
  // Deduplicate: if a fetch is in-flight, reuse its promise
  if (_feedInFlight) return _feedInFlight;

  _feedInFlight = (async () => {
    try {
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error(`feed ${res.status}`);
      const data: FeedData = await res.json();
      data.posts = mergeJustSubmitted(data.posts);
      _feedCache = { data, at: Date.now() };
      return data;
    } catch {
      const data = await fetchFeedFromSupabase();
      data.posts = mergeJustSubmitted(data.posts);
      _feedCache = { data, at: Date.now() };
      return data;
    } finally {
      _feedInFlight = null;
    }
  })();
  return _feedInFlight;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getUserAddedPosts(): Promise<Post[]> {
  return (await fetchFeed()).posts;
}

// Synchronously get a post from the feed cache (no fullStory, but has title/content/votes)
// Used by the story page to show something instantly while the full post loads
export function getPostFromFeedCacheSync(id: number): Post | null {
  if (!_feedCache) return null;
  return _feedCache.data.posts.find((p) => p.id === id) ?? null;
}

// Fetch a single post WITH full_story — used only on the story detail page
export async function getPostById(id: number): Promise<Post | null> {
  // Static posts live only in data/posts.ts — no DB lookup needed
  const staticPost = _staticPosts.find((p) => p.id === id);
  if (staticPost) return staticPost;

  const cacheKey = `post:${id}`;
  const cached = getCache<Post>(cacheKey, 300_000);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/post/${id}`);
    if (!res.ok) throw new Error(`post ${res.status}`);
    const { post } = await res.json();
    if (post) setCache(cacheKey, post);
    return post ?? null;
  } catch {
    // Fallback to direct Supabase
    const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const post: Post = {
      id: data.id, title: data.title, content: data.content,
      fullStory: data.full_story, votes: data.votes, author: data.author,
      category: data.category, type: data.type as "post" | "story",
      imageUrl: data.image_url ?? undefined, createdAt: data.created_at,
    };
    setCache(cacheKey, post);
    return post;
  }
}

// Merge any just-submitted post (not yet in Redis cache) into feed results
function mergeJustSubmitted(posts: Post[]): Post[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("rn_just_submitted") : null;
    if (!raw) return posts;
    const { post, at } = JSON.parse(raw) as { post: Post; at: number };
    // Keep for 6 minutes (slightly over Redis TTL of 5 min) then discard
    if (Date.now() - at > 360_000) {
      localStorage.removeItem("rn_just_submitted");
      return posts;
    }
    const ids = new Set(posts.map((p) => p.id));
    if (ids.has(post.id)) {
      // Post now appears naturally — clear pending entry
      localStorage.removeItem("rn_just_submitted");
      return posts;
    }
    return [post, ...posts];
  } catch {
    return posts;
  }
}

// Store a just-submitted post so fetchFeed always includes it until Redis catches up
export function injectPostIntoFeedCache(post: Post): void {
  try {
    localStorage.setItem("rn_just_submitted", JSON.stringify({ post, at: Date.now() }));
  } catch {}
}

export async function saveUserAddedPost(post: Post, userId: string): Promise<void> {
  bustCache("posts", "comment_counts");
  await supabase.from("posts").insert({
    id: post.id,
    title: post.title,
    content: post.content,
    full_story: post.fullStory,
    votes: post.votes,
    author: post.author,
    category: post.category,
    type: post.type || "post",
    image_url: post.imageUrl || null,
    is_anonymous: post.author === "Anonymous",
    created_at: post.createdAt,
    user_id: userId || null,
  });
  // Bust Redis feed cache in background — don't block on it
  fetch("/api/feed", { method: "DELETE" }).catch(() => {});
}

export async function getDeletedPostIds(): Promise<number[]> {
  return (await fetchFeed()).deletedPostIds;
}

export async function markPostDeleted(postId: number): Promise<void> {
  bustCache("posts", "deleted", "comment_counts");
  try { localStorage.removeItem("rn_posts_v3"); } catch {}
  // Bust Redis cache in background — don't block on it
  fetch("/api/feed", { method: "DELETE" }).catch(() => {});
  // Run both Supabase ops in parallel
  await Promise.all([
    supabase.from("deleted_posts").upsert({ post_id: postId }, { onConflict: "post_id" }),
    supabase.from("posts").delete().eq("id", postId),
  ]);
}

export async function updatePost(postId: number, fields: { title: string; content: string; full_story: string }): Promise<void> {
  bustCache("posts", `post:${postId}`);
  try { localStorage.removeItem("rn_posts_v2"); } catch {}
  await supabase.from("posts").update({
    title: fields.title,
    content: fields.content,
    full_story: fields.full_story,
  }).eq("id", postId);
}

export async function markPostRestored(postId: number): Promise<void> {
  bustCache("deleted");
  await supabase.from("deleted_posts").delete().eq("post_id", postId);
}

// ── Votes ──────────────────────────────────────────────────────────────────────

export async function getVoteAdjustments(): Promise<Record<number, number>> {
  return (await fetchFeed()).votes;
}

export async function getUpvotedPosts(userId: string): Promise<Set<number>> {
  const cacheKey = `upvoted:${userId}`;
  const cached = getCache<number[]>(cacheKey, 300_000);
  if (cached) return new Set(cached);
  const { data } = await supabase
    .from("user_votes")
    .select("post_id")
    .eq("user_id", userId)
    .eq("direction", "up");
  const ids = (data || []).map((r) => r.post_id);
  setCache(cacheKey, ids);
  return new Set(ids);
}

export async function getDownvotedPosts(userId: string): Promise<Set<number>> {
  const cacheKey = `downvoted:${userId}`;
  const cached = getCache<number[]>(cacheKey, 300_000);
  if (cached) return new Set(cached);
  const { data } = await supabase
    .from("user_votes")
    .select("post_id")
    .eq("user_id", userId)
    .eq("direction", "down");
  const ids = (data || []).map((r) => r.post_id);
  setCache(cacheKey, ids);
  return new Set(ids);
}

export async function castVote(
  postId: number,
  delta: number,
  nowUpvoted: boolean,
  nowDownvoted: boolean,
  userId: string
): Promise<void> {
  // Update aggregate — optimistically update cache first
  bustCache("votes");
  const cached = getCache<Record<number, number>>("votes", 0); // already busted so null
  void cached;

  const { data: existing } = await supabase
    .from("vote_adjustments")
    .select("adjustment")
    .eq("post_id", postId)
    .maybeSingle();

  const currentAdj = existing?.adjustment ?? 0;
  await supabase.from("vote_adjustments").upsert(
    { post_id: postId, adjustment: currentAdj + delta },
    { onConflict: "post_id" }
  );

  // Update per-user vote state
  if (!nowUpvoted && !nowDownvoted) {
    await supabase.from("user_votes").delete().eq("user_id", userId).eq("post_id", postId);
  } else {
    await supabase.from("user_votes").upsert(
      { user_id: userId, post_id: postId, direction: nowUpvoted ? "up" : "down" },
      { onConflict: "user_id,post_id" }
    );
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(postId: number): Promise<Comment[]> {
  const cacheKey = `comments:${postId}`;
  const cached = getCache<Comment[]>(cacheKey, 120_000); // 2 min
  if (cached) return cached;
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  const result = (data || []).map((c) => ({
    id: c.id,
    postId: c.post_id,
    author: c.author,
    body: c.body,
    createdAt: c.created_at,
  }));
  setCache(cacheKey, result);
  return result;
}

export async function addComment(comment: Comment, userId: string): Promise<void> {
  bustCache("comment_counts");
  // Invalidate comment cache for this post so next load is fresh
  _cache.delete(`comments:${comment.postId}`);
  await supabase.from("comments").insert({
    id: comment.id,
    post_id: comment.postId,
    author: comment.author,
    body: comment.body,
    created_at: comment.createdAt,
    user_id: userId || null,
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  bustCache("comment_counts");
  await supabase.from("comments").delete().eq("id", commentId);
}

export async function getAllComments(): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (data || []).map((c) => ({
    id: c.id,
    postId: c.post_id,
    author: c.author,
    body: c.body,
    createdAt: c.created_at,
  }));
}

// ── Communities ───────────────────────────────────────────────────────────────

export async function getAllCommentCounts(): Promise<Record<number, number>> {
  return (await fetchFeed()).commentCounts;
}

export async function getUserCommunities(): Promise<Community[]> {
  return (await fetchFeed()).communities;
}

export async function addCommunity(community: Community, userId: string): Promise<void> {
  bustCache("communities");
  await supabase.from("communities").insert({
    id: community.id,
    name: community.name,
    description: community.description,
    emoji: community.emoji,
    color: community.color,
    created_by: community.createdBy,
    created_at: community.createdAt,
    user_id: userId || null,
    banner_url: community.bannerUrl || null,
  });
}

export async function deleteCommunity(id: string): Promise<void> {
  bustCache("communities");
  await supabase.from("communities").delete().eq("id", id);
}

export async function joinCommunity(communityId: string, userId: string): Promise<void> {
  await supabase.from("community_members").upsert(
    { community_id: communityId, user_id: userId },
    { onConflict: "community_id,user_id" }
  );
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
}

export async function isMember(communityId: string, userId: string): Promise<boolean> {
  const cacheKey = `ismember:${communityId}:${userId}`;
  const cached = getCache<boolean>(cacheKey, 120_000);
  if (cached !== null) return cached;
  const { data } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  const result = !!data;
  setCache(cacheKey, result);
  return result;
}

export async function getMemberCount(communityId: string): Promise<number> {
  const cacheKey = `membercount:${communityId}`;
  const cached = getCache<number>(cacheKey, 120_000); // 2 min
  if (cached !== null) return cached;
  const { count } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);
  const result = count ?? 0;
  setCache(cacheKey, result);
  return result;
}

export async function getCommunityById(id: string): Promise<Community | null> {
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    emoji: data.emoji,
    color: data.color,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function getCommunityPosts(communityName: string): Promise<import("@/types").Post[]> {
  const cacheKey = `communityposts:${communityName}`;
  const cached = getCache<import("@/types").Post[]>(cacheKey, 120_000); // 2 min
  if (cached) return cached;
  const { data } = await supabase
    .from("posts")
    .select("id, title, content, author, category, type, votes, image_url, created_at")
    .eq("category", communityName)
    .order("created_at", { ascending: false });
  const result = (data || []).map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    fullStory: "",
    votes: p.votes,
    author: p.author,
    category: p.category,
    createdAt: p.created_at,
    type: p.type,
    imageUrl: p.image_url,
  }));
  setCache(cacheKey, result);
  return result;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  bio: string;
  displayName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
}

export async function getProfile(username: string): Promise<UserProfile> {
  const cacheKey = `profile:${username}`;
  const cached = getCache<UserProfile>(cacheKey, 300_000); // 5 min
  if (cached) return cached;

  const { data } = await supabase
    .from("profiles")
    .select("username, bio, display_name, avatar_url, avatar_emoji")
    .eq("username", username)
    .maybeSingle();

  if (!data) return { username, bio: "", displayName: username };

  const result: UserProfile = {
    username: data.username,
    bio: data.bio || "",
    displayName: data.display_name || username,
    avatarUrl: data.avatar_url ?? undefined,
    avatarEmoji: data.avatar_emoji ?? undefined,
  };
  setCache(cacheKey, result);
  return result;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({
    display_name: profile.displayName,
    bio: profile.bio,
    avatar_url: profile.avatarUrl || null,
    avatar_emoji: profile.avatarEmoji || null,
  }).eq("id", user.id);
}


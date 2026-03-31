import { supabase } from "./supabase";
import type { Post, Comment, Community } from "@/types";

// ── In-memory TTL cache ───────────────────────────────────────────────────────
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
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getUserAddedPosts(): Promise<Post[]> {
  const cached = getCache<Post[]>("posts", 30_000);
  if (cached) return cached;

  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const result = (data || []).map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    fullStory: p.full_story,
    votes: p.votes,
    author: p.author,
    category: p.category,
    type: p.type as "post" | "story",
    imageUrl: p.image_url ?? undefined,
    createdAt: p.created_at,
  }));
  setCache("posts", result);
  return result;
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
}

export async function getDeletedPostIds(): Promise<number[]> {
  const cached = getCache<number[]>("deleted", 60_000);
  if (cached) return cached;
  const { data } = await supabase.from("deleted_posts").select("post_id");
  const result = (data || []).map((r) => r.post_id);
  setCache("deleted", result);
  return result;
}

export async function markPostDeleted(postId: number): Promise<void> {
  bustCache("posts", "deleted", "comment_counts");
  await supabase.from("deleted_posts").upsert({ post_id: postId }, { onConflict: "post_id" });
  await supabase.from("posts").delete().eq("id", postId);
}

export async function markPostRestored(postId: number): Promise<void> {
  bustCache("deleted");
  await supabase.from("deleted_posts").delete().eq("post_id", postId);
}

// ── Votes ──────────────────────────────────────────────────────────────────────

export async function getVoteAdjustments(): Promise<Record<number, number>> {
  const cached = getCache<Record<number, number>>("votes", 15_000);
  if (cached) return cached;
  const { data } = await supabase.from("vote_adjustments").select("post_id, adjustment").limit(500);
  if (!data) return {};
  const result: Record<number, number> = {};
  data.forEach((r) => { result[r.post_id] = r.adjustment; });
  setCache("votes", result);
  return result;
}

export async function getUpvotedPosts(userId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from("user_votes")
    .select("post_id")
    .eq("user_id", userId)
    .eq("direction", "up");
  return new Set((data || []).map((r) => r.post_id));
}

export async function getDownvotedPosts(userId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from("user_votes")
    .select("post_id")
    .eq("user_id", userId)
    .eq("direction", "down");
  return new Set((data || []).map((r) => r.post_id));
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
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  return (data || []).map((c) => ({
    id: c.id,
    postId: c.post_id,
    author: c.author,
    body: c.body,
    createdAt: c.created_at,
  }));
}

export async function addComment(comment: Comment, userId: string): Promise<void> {
  bustCache("comment_counts");
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
  const cached = getCache<Record<number, number>>("comment_counts", 20_000);
  if (cached) return cached;
  const { data } = await supabase.from("comments").select("post_id").limit(2000);
  const counts: Record<number, number> = {};
  (data || []).forEach((r) => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });
  setCache("comment_counts", counts);
  return counts;
}

export async function getUserCommunities(): Promise<Community[]> {
  const cached = getCache<Community[]>("communities", 60_000);
  if (cached) return cached;

  const { data } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  const result = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    emoji: c.emoji,
    color: c.color,
    createdBy: c.created_by,
    createdAt: c.created_at,
    bannerUrl: c.banner_url || undefined,
  }));
  setCache("communities", result);
  return result;
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
  const { data } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getMemberCount(communityId: string): Promise<number> {
  const { count } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);
  return count ?? 0;
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
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("category", communityName)
    .order("created_at", { ascending: false });
  return (data || []).map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    fullStory: p.full_story || "",
    votes: p.votes,
    author: p.author,
    category: p.category,
    createdAt: p.created_at,
    type: p.type,
    imageUrl: p.image_url,
  }));
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
  const { data } = await supabase
    .from("profiles")
    .select("username, bio, display_name, avatar_url, avatar_emoji")
    .eq("username", username)
    .maybeSingle();

  if (!data) return { username, bio: "", displayName: username };

  return {
    username: data.username,
    bio: data.bio || "",
    displayName: data.display_name || username,
    avatarUrl: data.avatar_url ?? undefined,
    avatarEmoji: data.avatar_emoji ?? undefined,
  };
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


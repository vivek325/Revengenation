import type { Post, Comment } from "@/types";

const VOTES_KEY = "rns_votes";
const UPVOTED_KEY = "rns_upvoted";
const DOWNVOTED_KEY = "rns_downvoted";
const ADDED_POSTS_KEY = "rns_added_posts";
const DELETED_KEY = "rns_deleted";
const COMMENTS_KEY = "rns_comments";

export function getComments(postId: number): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const all: Comment[] = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    return all.filter((c) => c.postId === postId);
  } catch { return []; }
}

export function addComment(comment: Comment): void {
  if (typeof window === "undefined") return;
  try {
    const all: Comment[] = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([...all, comment]));
  } catch { /* ignore */ }
}

export function deleteComment(commentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const all: Comment[] = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all.filter((c) => c.id !== commentId)));
  } catch { /* ignore */ }
}

export function getVoteAdjustments(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getUpvotedPosts(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(UPVOTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function getDownvotedPosts(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DOWNVOTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function castVote(
  postId: number,
  delta: number,
  nowUpvoted: boolean,
  nowDownvoted: boolean
) {
  const adj = getVoteAdjustments();
  adj[postId] = (adj[postId] || 0) + delta;
  localStorage.setItem(VOTES_KEY, JSON.stringify(adj));

  const up = getUpvotedPosts();
  if (nowUpvoted) up.add(postId);
  else up.delete(postId);
  localStorage.setItem(UPVOTED_KEY, JSON.stringify([...up]));

  const down = getDownvotedPosts();
  if (nowDownvoted) down.add(postId);
  else down.delete(postId);
  localStorage.setItem(DOWNVOTED_KEY, JSON.stringify([...down]));
}

export function getUserAddedPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ADDED_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUserAddedPosts(posts: Post[]) {
  localStorage.setItem(ADDED_POSTS_KEY, JSON.stringify(posts));
}

export function getDeletedPostIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveDeletedPostIds(ids: number[]) {
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
}

// ── Communities ─────────────────────────────────────────────────────────────
import type { Community } from "@/types";

const COMMUNITIES_KEY = "rns_communities";

export function getUserCommunities(): Community[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COMMUNITIES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUserCommunities(communities: Community[]) {
  localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(communities));
}

export function addCommunity(community: Community) {
  const existing = getUserCommunities();
  saveUserCommunities([...existing, community]);
}

export function deleteCommunity(id: string) {
  const existing = getUserCommunities();
  saveUserCommunities(existing.filter((c) => c.id !== id));
}

export function getAllComments(): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
  } catch { return []; }
}

// ── Profile ─────────────────────────────────────────────────────────────────
const PROFILE_KEY = "rns_profiles";

export interface UserProfile {
  username: string;
  bio: string;
  displayName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
}

export function getProfile(username: string): UserProfile {
  if (typeof window === "undefined") return { username, bio: "", displayName: username };
  try {
    const all: Record<string, UserProfile> = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return all[username] ?? { username, bio: "", displayName: username };
  } catch { return { username, bio: "", displayName: username }; }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    const all: Record<string, UserProfile> = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    all[profile.username] = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}


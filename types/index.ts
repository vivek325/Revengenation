export interface Post {
  id: number;
  title: string;
  content: string;
  fullStory: string;
  votes: number;
  author: string;
  category: string;
  createdAt: string;
  type?: "post" | "story" | "blog";
  imageUrl?: string;
  coverImage?: string;
  metaDescription?: string;
  tags?: string;
}

export interface Community {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  createdBy: string;
  createdAt: string;
  bannerUrl?: string;
}

export interface Comment {
  id: string;
  postId: number;
  author: string;
  body: string;
  createdAt: string;
}

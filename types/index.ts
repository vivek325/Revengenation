export interface Post {
  id: number;
  title: string;
  content: string;
  fullStory: string;
  votes: number;
  author: string;
  category: string;
  createdAt: string;
  type?: "post" | "story";
  imageUrl?: string;
}

export interface Community {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: number;
  author: string;
  body: string;
  createdAt: string;
}

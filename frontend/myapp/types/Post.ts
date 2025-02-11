export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  likes: string[];
  likesCount: number;
  comments: { userId: string, text: string }[];
  commentsCount: number;
  createdAt: string;
}
export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  likes: string[];
  comments: { userId: string, text: string }[];
  createdAt: string;
}
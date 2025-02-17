/**
 * Interfaz que representa un comentario en un post.
 */
export interface PostComment {
  /** Identificador único del usuario que realizó el comentario. */
  userId: string;
  /** Contenido textual del comentario. */
  text: string;
}

/**
 * Interfaz que representa un post en la red social.
 */
export interface Post {
  /** Identificador único del post. */
  id: string;
  /** Identificador del usuario que creó el post. */
  userId: string;
  /** Contenido textual del post. */
  content: string;
  /** URL de la imagen asociada al post (o null si no hay imagen). */
  imageUrl: string | null;
  /** Lista de identificadores de usuarios que han dado "like" al post. */
  likes: string[];
  /** Número total de "likes" recibidos. */
  likesCount: number;
  /** Lista de comentarios asociados al post. */
  comments: PostComment[];
  /** Número total de comentarios en el post. */
  commentsCount: number;
  /** Fecha de creación del post en formato ISO (string). */
  createdAt: string;
}

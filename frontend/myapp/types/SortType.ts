/**
 * SortType:
 * Enum que define los criterios de ordenamiento para los posts en la aplicación.
 * Este enum se utiliza para determinar el campo por el cual se deben ordenar los posts.
 */
export enum SortType {
  /** Ordenar por la cantidad de "likes" (campo: likesCount). */
  LIKES = "likesCount",
  /** Ordenar por la cantidad de comentarios (campo: commentsCount). */
  COMMENTS = "commentsCount",
  /** Ordenar por la fecha de creación (campo: createdAt). */
  DATE = "createdAt",
}

// función que calcula el tiempo transcurrido desde la fecha de creación
export const timeAgo = (createdAt: string | Date): string => {
  const now = new Date(); // Fecha actual
  const postDate = new Date(createdAt); // Convertimos createdAt a Date si es necesario

  // Diferencia en segundos
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} segundos`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutos`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} días`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} meses`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} años`;
};
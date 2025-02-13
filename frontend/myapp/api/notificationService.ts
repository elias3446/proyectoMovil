import axios from "axios";

// Constantes para la configuración de Native Notify
const NOTIFICATION_API_URL = "https://app.nativenotify.com/api/indie/notification";
const APP_ID = 27248;
const APP_TOKEN = "g7bm81eIUEY0Mmtod4FmYb";

/**
 * sendNotificationMessage
 * -------------------------
 * Envía una notificación a través de Native Notify.
 *
 * @param receiverId - ID del suscriptor (destinatario de la notificación).
 * @param title - Título de la notificación.
 * @param message - Contenido del mensaje.
 * @returns Promise<string | undefined> - La respuesta de la API en caso de éxito o undefined si ocurre un error.
 */
export const sendNotificationMessage = async (
  receiverId: string,
  title: string,
  message: string
): Promise<string | undefined> => {
  try {
    // Realiza la solicitud POST a la API de Native Notify con los parámetros necesarios
    const response = await axios.post(NOTIFICATION_API_URL, {
      subID: receiverId,
      appId: APP_ID,
      appToken: APP_TOKEN,
      title,
      message,
    });
    // Retorna la respuesta de la API (se espera que sea 'Success!' en caso de éxito)
    return response.data;
  } catch (error: any) {
    console.error("Error al enviar la notificación:", error);
    return undefined;
  }
};

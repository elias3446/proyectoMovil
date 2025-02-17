import axios from "axios";

/**
 * Configuración para las notificaciones de Native Notify.
 * Nota: Para producción, estos valores deben definirse como variables de entorno.
 */
export const APP_ID = process.env.REACT_APP_NATIVE_NOTIFY_APP_ID
  ? Number(process.env.REACT_APP_NATIVE_NOTIFY_APP_ID)
  : 27521;
export const APP_TOKEN = process.env.REACT_APP_NATIVE_NOTIFY_APP_TOKEN || "rNRgdCvDNRU32d09grVuSh";

/**
 * sendNotificationMessage:
 * --------------------------
 * Envía una notificación a través de la API de Native Notify.
 *
 * @param receiverId - ID del receptor de la notificación.
 * @param title - Título de la notificación.
 * @param message - Mensaje que se enviará en la notificación.
 * @returns Una promesa que se resuelve con la respuesta del servidor o undefined en caso de error.
 */
export const sendNotificationMessage = async (
  receiverId: string,
  title: string,
  message: string
): Promise<string | undefined> => {
  try {
    // Realiza una solicitud POST a la API de Native Notify con los datos necesarios.
    const response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
      subID: receiverId, // ID del receptor
      appId: APP_ID,
      appToken: APP_TOKEN,
      title,
      message,
    });

    // Muestra en consola la respuesta para depuración.
    console.log("Notificación enviada:", response.data);

    // Devuelve la respuesta de la API.
    return response.data;
  } catch (error: any) {
    // Registra el error en la consola para facilitar la depuración.
    console.error("Error al enviar la notificación:", error);
  }
};

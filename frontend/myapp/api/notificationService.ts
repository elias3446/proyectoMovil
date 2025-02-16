import axios from "axios";

/**
 * Constantes de configuración para la notificación.
 * 
 * Nota: Para mayor seguridad, mueve estos valores a variables de entorno.
 */
export const APP_ID = 27521;
export const APP_TOKEN = "rNRgdCvDNRU32d09grVuSh";

/**
 * sendNotificationMessage:
 * Envía una notificación a través de la API de Native Notify.
 *
 * @param receiverId - El ID del receptor de la notificación.
 * @param title - El título de la notificación.
 * @param message - El mensaje que se enviará en la notificación.
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

    // Devuelve la respuesta obtenida de la API.
    return response.data;
  } catch (error: any) {
    // Registra el error en la consola para facilitar la depuración.
    console.error("Error al enviar la notificación:", error);
    // Opcionalmente, se podría lanzar el error o retornar un valor predeterminado.
  }
};

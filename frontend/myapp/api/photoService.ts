import { uploadImageToCloudinary } from "./cloudinaryService";
import { savePhotoMessage, saveBotResponseMessage, getCurrentUser } from "./firebaseService";

// URL de la API para procesar imágenes
const PROCESS_IMAGE_API_URL = "https://proyectomovil-1.onrender.com/process_image";

/**
 * processImageWithAPI
 * --------------------
 * Envía una solicitud a la API para procesar la imagen y obtener la respuesta del bot.
 *
 * @param imageUrl - URL de la imagen a procesar.
 * @returns Promise<string> - La respuesta del bot.
 * @throws Error si la respuesta de la API no es exitosa o no contiene datos válidos.
 */
export const processImageWithAPI = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(PROCESS_IMAGE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error en la respuesta de la API");
    }
    return data.respuesta || "No response from server";
  } catch (error) {
    console.error("Error en processImageWithAPI:", error);
    throw error;
  }
};

/**
 * sendPhotoMessage
 * ----------------
 * Envía un mensaje de foto realizando las siguientes acciones:
 * 1. Verifica que el usuario esté autenticado.
 * 2. Sube la imagen a Cloudinary en la carpeta "user_messages".
 * 3. Procesa la imagen con la API para obtener la respuesta del bot.
 * 4. Guarda el mensaje del usuario y la respuesta del bot en Firebase.
 * 5. Cambia a la pantalla de chat.
 *
 * Se pueden pasar callbacks opcionales para actualizar el estado de carga (setLoading)
 * y para mostrar mensajes de error (setError).
 *
 * @param photo - Objeto con la URI de la foto.
 * @param setCurrentScreen - Función para cambiar la pantalla actual.
 * @param setLoading - (Opcional) Función para actualizar el estado de carga.
 * @param setError - (Opcional) Función para actualizar el mensaje de error.
 * @returns Promise<void>
 */
export const sendPhotoMessage = async (
  photo: { uri: string },
  setCurrentScreen: (screen: string) => void,
  setLoading?: (loading: boolean) => void,
  setError?: (message: string) => void
): Promise<void> => {
  try {
    // Inicia el estado de carga, si se proporciona la función
    if (setLoading) setLoading(true);

    // Verifica que el usuario esté autenticado
    const user = getCurrentUser();
    if (!user) {
      throw new Error("Usuario no autenticado.");
    }

    // Define el UID del receptor (por ejemplo, un chatbot) y la carpeta para subir la imagen
    const receiverUID = "receiverUID";
    const folder = "user_messages";

    // Sube la imagen a Cloudinary
    const imageUrl = await uploadImageToCloudinary(photo, folder, user.uid);
    if (!imageUrl) {
      throw new Error("Error al subir la imagen a Cloudinary.");
    }

    // Procesa la imagen a través de la API para obtener la respuesta del bot
    const botResponseText = await processImageWithAPI(imageUrl);

    // Si la respuesta indica "no hay plantas", notifica y detiene el flujo
    if (botResponseText.toLowerCase() === "no hay plantas") {
      const mensaje = "Solo se pueden subir fotos con plantas.";
      if (setError) {
        setError(mensaje);
      } else {
        alert(mensaje);
      }
      return; // No procede a guardar mensajes ni a cambiar la pantalla
    }

    // Guarda el mensaje del usuario en Firebase (con la URL de la imagen)
    await savePhotoMessage(user.uid, receiverUID, imageUrl);

    // Guarda la respuesta del bot en Firebase
    await saveBotResponseMessage(user.uid, receiverUID, botResponseText);

    // Cambia a la pantalla de chat
    setCurrentScreen("ChatScreen");
  } catch (error: any) {
    console.error("Error en sendPhotoMessage:", error);
    if (setError) {
      setError(error.message || "Error al enviar el mensaje de foto.");
    } else {
      alert(error.message || "Error al enviar el mensaje de foto.");
    }
  } finally {
    if (setLoading) setLoading(false);
  }
};

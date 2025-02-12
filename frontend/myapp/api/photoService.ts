import { uploadImageToCloudinary } from "./cloudinaryService";
import { savePhotoMessage, saveBotResponseMessage, getCurrentUser } from "./firebaseService";

/**
 * Procesa la imagen a través de una API y devuelve la respuesta del bot.
 * 
 * @param imageUrl - URL de la imagen a procesar.
 * @returns Una promesa que se resuelve con la respuesta del bot.
 * @throws Error si la respuesta de la API no es exitosa.
 */
export const processImageWithAPI = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch("https://proyectomovil-qh8q.onrender.com/process_image", {
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
 * Envía un mensaje de foto realizando las siguientes acciones:
 * 1. Verifica que el usuario esté autenticado.
 * 2. Sube la imagen a Cloudinary.
 * 3. Guarda el mensaje del usuario en Firebase.
 * 4. Procesa la imagen con la API para obtener la respuesta del bot.
 * 5. Guarda la respuesta del bot en Firebase.
 * 6. Cambia a la pantalla de chat.
 * 
 * Se pueden pasar callbacks opcionales para actualizar el estado de carga (loading)
 * y para mostrar mensajes de error, permitiendo una mejor interacción con el usuario.
 * 
 * @param photo - Objeto con la URI de la foto.
 * @param setCurrentScreen - Función para cambiar la pantalla actual.
 * @param setLoading - (Opcional) Función para actualizar el estado de carga.
 * @param setError - (Opcional) Función para actualizar el mensaje de error.
 */
export const sendPhotoMessage = async (
  photo: { uri: string },
  setCurrentScreen: (screen: string) => void,
  setLoading?: (loading: boolean) => void,
  setError?: (message: string) => void
): Promise<void> => {
  try {
    // Inicia el estado de carga si se proporciona la función
    if (setLoading) setLoading(true);

    // Verificar que el usuario esté autenticado
    const user = getCurrentUser();
    if (!user) {
      throw new Error("Usuario no autenticado.");
    }

    // Definir el UID del receptor (por ejemplo, el chatbot)
    const receiverUID = "receiverUID";

    // Subir la imagen a Cloudinary en la carpeta "user_messages"
    const folder = "user_messages";
    const imageUrl = await uploadImageToCloudinary(photo, folder);
    if (!imageUrl) {
      throw new Error("Error al subir la imagen a Cloudinary.");
    }

    // Guardar el mensaje del usuario en Firebase con la URL de la imagen
    await savePhotoMessage(user.uid, receiverUID, imageUrl);

    // Procesar la imagen a través de la API y obtener la respuesta del bot
    const botResponseText = await processImageWithAPI(imageUrl);

    // Guardar la respuesta del bot en Firebase
    await saveBotResponseMessage(user.uid, receiverUID, botResponseText);

    // Cambiar a la pantalla de chat
    setCurrentScreen("ChatScreen");
  } catch (error: any) {
    console.error("Error en sendPhotoMessage:", error);
    // Notificar al usuario el error, utilizando el callback si está disponible,
    // o mediante un alert en caso contrario.
    if (setError) {
      setError(error.message || "Error al enviar el mensaje de foto.");
    } else {
      alert(error.message || "Error al enviar el mensaje de foto.");
    }
  } finally {
    // Finalizar el estado de carga
    if (setLoading) setLoading(false);
  }
};

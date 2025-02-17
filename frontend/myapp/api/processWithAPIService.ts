/**
 * postData:
 * --------------------------
 * Función auxiliar para enviar solicitudes POST a una API con payload JSON.
 *
 * @param url - La URL del endpoint de la API.
 * @param data - Los datos a enviar en formato JSON.
 * @returns Una promesa que se resuelve con la respuesta parseada como JSON.
 * @throws Error si la respuesta no es exitosa.
 */
async function postData<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "Error en la respuesta de la API");
  }
  return responseData;
}

/**
 * processImageWithAPI:
 * --------------------------
 * Envía la URI de una imagen a un endpoint para su procesamiento y retorna la respuesta.
 *
 * @param imageUri - La URI de la imagen a procesar.
 * @param setErrorMessage - Función para actualizar el mensaje de error en la UI.
 * @returns Una promesa que se resuelve con la respuesta del servidor.
 *
 * Nota: En producción, se recomienda mover la URL del endpoint a variables de entorno.
 */
export const processImageWithAPI = async (
  imageUri: string,
  setErrorMessage: (msg: string) => void
): Promise<string> => {
  try {
    // Reinicia el mensaje de error antes de iniciar la solicitud.
    setErrorMessage("");
    
    // URL del endpoint para el procesamiento de imagen.
    const apiUrl = process.env.REACT_APP_IMAGE_PROCESSING_URL || "http://3.84.59.94:5000/process_image";
    
    // Realiza la solicitud POST enviando la URI de la imagen.
    const data = await postData<{ respuesta?: string }>(apiUrl, { image_url: imageUri });
    
    // Retorna la respuesta proporcionada por el servidor o un mensaje por defecto.
    return data.respuesta || "No response from server";
  } catch (error: any) {
    console.error("Error processing image with API:", error);
    setErrorMessage("Error al procesar la imagen en el servidor.");
    throw error;
  }
};

/**
 * processChatWithAPI:
 * --------------------------
 * Envía un mensaje de chat a un endpoint para su procesamiento y retorna la respuesta.
 *
 * @param currentMessageText - El texto del mensaje a procesar.
 * @param userUid - El UID del usuario que envía el mensaje.
 * @param setErrorMessage - Función para actualizar el mensaje de error en la UI.
 * @returns Una promesa que se resuelve con la respuesta del servidor.
 *
 * Nota: En producción, se recomienda mover la URL del endpoint a variables de entorno.
 */
export const processChatWithAPI = async (
  currentMessageText: string,
  userUid: string,
  setErrorMessage: (msg: string) => void
): Promise<string> => {
  try {
    // Reinicia el mensaje de error antes de iniciar la solicitud.
    setErrorMessage("");
    
    // URL del endpoint para el procesamiento del chat.
    const apiUrl = process.env.REACT_APP_CHAT_PROCESSING_URL || "http://3.84.59.94:5000/chat";
    
    // Realiza la solicitud POST enviando el mensaje y el UID del usuario.
    const data = await postData<{ response?: string }>(apiUrl, { message: currentMessageText, user: userUid });
    
    // Retorna la respuesta proporcionada por el servidor o un mensaje por defecto.
    return data.response || "No response from server";
  } catch (error: any) {
    console.error("Error processing chat with API:", error);
    setErrorMessage("Error al procesar el chat en el servidor.");
    throw error;
  }
};

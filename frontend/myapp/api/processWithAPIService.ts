// Por ejemplo, en un archivo utils/api.ts

export const processImageWithAPI = async (
  imageUri: string,
  setErrorMessage: (msg: string) => void
): Promise<string> => {
  try {
    // Reiniciamos el mensaje de error
    setErrorMessage("");
    const response = await fetch("https://proyectomovil-1.onrender.com/process_image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url: imageUri }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error en la respuesta de la API");
    }
    return data.respuesta || "No response from server";
  } catch (error: any) {
    console.error("Error processing image with API:", error);
    setErrorMessage("Error al procesar la imagen en el servidor.");
    throw error;
  }
};

export const processChatWithAPI = async (
  currentMessageText: string,
  userUid: string,
  setErrorMessage: (msg: string) => void
): Promise<string> => {
  try {
    // Reiniciamos el mensaje de error
    setErrorMessage("");
    const response = await fetch("https://proyectomovil-1.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: currentMessageText, user: userUid }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error en la respuesta de la API");
    }
    return data.response || "No response from server";
  } catch (error: any) {
    console.error("Error processing chat with API:", error);
    setErrorMessage("Error al procesar el chat en el servidor.");
    throw error;
  }
};

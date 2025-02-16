/**
 * uploadImageToCloudinary:
 * --------------------------
 * Sube una imagen a Cloudinary y retorna la URL segura de la imagen alojada.
 *
 * Nota de seguridad:
 * - Para mayor seguridad y flexibilidad, reemplaza los valores "upload_preset" y "cloud_name"
 *   por variables de entorno en producción (por ejemplo, process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET).
 *
 * @param imageUri - La URI local de la imagen a subir.
 * @param folder - (Opcional) Carpeta en la que se guardará la imagen en Cloudinary.
 * @returns {Promise<string | null>} - La URL segura de la imagen subida, o `null` si ocurre un error.
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  folder?: string
): Promise<string | null> => {
  try {
    // Se crea un objeto FormData para enviar la imagen a Cloudinary.
    const data = new FormData();

    // Extrae el nombre del archivo de la URI; si no se puede, usa un valor por defecto.
    const fileName = imageUri.split("/").pop() || "upload.jpg";
    // Determina el tipo de imagen según su extensión (png o jpeg).
    const fileType = imageUri.toLowerCase().endsWith("png") ? "image/png" : "image/jpeg";

    // Se agrega el archivo al objeto FormData.
    data.append("file", {
      uri: imageUri,
      type: fileType,
      name: fileName,
    } as any);

    // Se añaden las credenciales de Cloudinary.
    // En producción, sustituir estos valores por variables de entorno.
    data.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "my_upload_preset2");
    data.append("cloud_name", process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dwhl67ka5");

    // Si se especifica una carpeta, se añade al objeto FormData.
    if (folder) {
      data.append("folder", folder);
    }

    // Realiza la solicitud POST a la API de Cloudinary.
    const response = await fetch("https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload", {
      method: "POST",
      body: data,
    });

    // Se parsea la respuesta a formato JSON.
    const json = await response.json();

    // Si la respuesta no es exitosa, se lanza un error con el mensaje proporcionado o uno genérico.
    if (!response.ok) {
      throw new Error(json.error?.message || "Error al subir la imagen");
    }

    // Retorna la URL segura de la imagen subida; si no se encuentra, retorna null.
    return json.secure_url || null;
  } catch (error: any) {
    // Se registra el error en la consola para facilitar la depuración.
    console.error("Error al subir la imagen a Cloudinary:", error);
    return null;
  }
};

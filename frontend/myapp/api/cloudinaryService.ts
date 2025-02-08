/**
 * Sube una imagen a Cloudinary y devuelve la URL segura de la imagen alojada.
 *
 * @param imageUri - URI local de la imagen a subir.
 * @returns {Promise<string | null>} - Retorna la URL de la imagen subida si el proceso es exitoso, o `null` si ocurre un error.
 */
export const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg", // Asegúrate de usar el tipo correcto según la imagen
    name: "upload.jpg",
  } as any);
  data.append("upload_preset", "my_upload_preset"); // Reemplaza con tu upload_preset
  data.append("cloud_name", "dwhl67ka5"); // Reemplaza con tu cloud_name

  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload", {
      method: "POST",
      body: data,
    });
    const json = await response.json();
    return json.secure_url || null;
  } catch (error) {
    console.error("Error al subir la imagen a Cloudinary:", error);
    return null;
  }
};
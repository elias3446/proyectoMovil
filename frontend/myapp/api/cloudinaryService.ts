// services/cloudinaryService.ts
import { Platform } from "react-native";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload";
const CLOUDINARY_CLOUD_NAME = "dwhl67ka5"; // Variable cloud_name
const CLOUDINARY_UPLOAD_PRESET = "my_upload_preset2"; // Reemplaza por tu upload preset

/**
 * Interfaz para representar una foto a subir.
 */
export interface Photo {
  uri: string;
}

/**
 * Sube una imagen a Cloudinary y retorna la URL segura.
 *
 * @param photo - Objeto con la propiedad `uri` que contiene la ruta local o URL de la imagen.
 * @param folder - (Opcional) Nombre de la carpeta en Cloudinary donde se alojará la imagen.
 * @returns Promise<string> con la URL segura de la imagen.
 * @throws Error si ocurre algún problema durante la subida.
 */
export const uploadImageToCloudinary = async (
  photo: Photo,
  folder?: string
): Promise<string> => {
  try {
    // Validar que la imagen es válida
    if (!photo || !photo.uri) {
      throw new Error("No se proporcionó una imagen válida.");
    }

    const formData = new FormData();

    if (Platform.OS === "web") {
      // En web, obtener el blob a partir de la URL
      const response = await fetch(photo.uri);
      if (!response.ok) {
        throw new Error("Error al obtener la imagen para subir en la plataforma web.");
      }
      const blob = await response.blob();
      const fileName = photo.uri.split("/").pop() || "photo.jpg";
      formData.append("file", blob, fileName);
    } else {
      // En dispositivos móviles, se envía directamente el objeto con { uri, type, name }
      const fileName = photo.uri.split("/").pop() || "photo.jpg";
      const fileType = photo.uri.toLowerCase().endsWith("png") ? "image/png" : "image/jpeg";
      formData.append("file", {
        uri: photo.uri,
        type: fileType,
        name: fileName,
      } as any);
    }

    // Agregar los parámetros requeridos por Cloudinary
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
    if (folder) {
      formData.append("folder", folder);
    }

    // Realizar la solicitud de subida a Cloudinary
    const uploadResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const data = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(data.error?.message || "Error al subir la imagen");
    }

    if (!data.secure_url) {
      throw new Error("La respuesta de Cloudinary no contiene una URL segura.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error en uploadImageToCloudinary:", error);
    throw error;
  }
};

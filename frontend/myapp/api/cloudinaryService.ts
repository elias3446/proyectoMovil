import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView } from 'expo-camera';

// URL y parámetros básicos para Cloudinary
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload";
const CLOUDINARY_CLOUD_NAME = "dwhl67ka5"; 
const CLOUDINARY_UPLOAD_PRESET = "my_upload_preset2";

/**
 * Interfaz para representar una foto a subir.
 */
export interface Photo {
  uri: string;
}

/**
 * prepareFormDataForPhoto
 * -------------------------
 * Prepara un objeto FormData con el archivo de imagen a subir.
 * Dependiendo de la plataforma, se obtiene el blob (web) o se envía el objeto
 * con { uri, type, name } (dispositivos móviles).
 *
 * @param photo - Objeto con la propiedad `uri` de la imagen.
 * @returns Promise<FormData> con la imagen agregada.
 * @throws Error si ocurre un problema al obtener la imagen (en web).
 */
const prepareFormDataForPhoto = async (photo: Photo): Promise<FormData> => {
  const formData = new FormData();
  // Extraer nombre de archivo a partir de la URI
  const fileName = photo.uri.split("/").pop() || "photo.jpg";

  if (Platform.OS === "web") {
    // En web, se obtiene un blob a partir de la URL de la imagen
    const response = await fetch(photo.uri);
    if (!response.ok) {
      throw new Error("Error al obtener la imagen para subir en la plataforma web.");
    }
    const blob = await response.blob();
    formData.append("file", blob, fileName);
  } else {
    // En dispositivos móviles, se envía el objeto con { uri, type, name }
    const fileType = photo.uri.toLowerCase().endsWith("png") ? "image/png" : "image/jpeg";
    formData.append("file", {
      uri: photo.uri,
      type: fileType,
      name: fileName,
    } as any);
  }

  return formData;
};

/**
 * uploadImageToCloudinary
 * -------------------------
 * Sube una imagen a Cloudinary y retorna la URL segura de la imagen.
 * La función prepara el objeto FormData, agrega los parámetros requeridos y
 * realiza la solicitud de subida.
 *
 * @param photo - Objeto con la propiedad `uri` que contiene la ruta local o URL de la imagen.
 * @param folder - (Opcional) Nombre de la carpeta en Cloudinary donde se alojará la imagen.
 * @param userName - (Opcional) Nombre del usuario para crear una subcarpeta dentro de `folder`.
 * @returns Promise<string> con la URL segura de la imagen.
 * @throws Error si ocurre algún problema durante la subida o la respuesta no contiene una URL.
 */
export const uploadImageToCloudinary = async (
  photo: Photo,
  folder?: string,
  userName?: string
): Promise<string> => {
  try {
    // Validación de entrada
    if (!photo || !photo.uri) {
      throw new Error("No se proporcionó una imagen válida.");
    }

    // Prepara el FormData con el archivo de imagen
    const formData = await prepareFormDataForPhoto(photo);

    // Agregar parámetros requeridos por Cloudinary
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
    
    // Si se proporciona folder, se añade (opcionalmente creando subcarpeta con userName)
    if (folder) {
      const folderPath = userName ? `${folder}/${userName}` : folder;
      formData.append("folder", folderPath);
    }

    // Realiza la solicitud POST a Cloudinary
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

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView } from 'expo-camera';

/**
 * checkCameraPermissions
 * ------------------------
 * Verifica que se tenga acceso a la cámara.
 * - En web: intenta acceder al stream de video.
 * - En dispositivos móviles: solicita el permiso si aún no ha sido concedido.
 *
 * @param permission - Objeto que indica el estado actual del permiso.
 * @param requestPermission - Función para solicitar el permiso.
 * @param setErrorMessage - Función para actualizar el mensaje de error.
 * @returns Promise<boolean> - Verdadero si se cuenta con el permiso, falso en caso contrario.
 */
export const checkCameraPermissions = async (
  permission: { granted: boolean } | undefined,
  requestPermission: () => Promise<any>,
  setErrorMessage: (msg: string) => void
): Promise<boolean> => {
  if (Platform.OS === 'web') {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch (error) {
      console.error('Error al acceder a la cámara en la web:', error);
      setErrorMessage('No se pudo acceder a la cámara en la web');
      return false;
    }
  } else {
    if (!permission?.granted) {
      try {
        const res = await requestPermission();
        if (!res?.granted) {
          setErrorMessage('Permiso de cámara no concedido');
          return false;
        }
      } catch (error) {
        console.error('Error al solicitar permiso de cámara:', error);
        setErrorMessage('Error al solicitar permiso de cámara');
        return false;
      }
    }
    return true;
  }
};

/**
 * takePicture
 * -----------
 * Toma una foto utilizando la referencia de la cámara.
 *
 * @param cameraRef - Referencia a la cámara (CameraView).
 * @param flash - Modo de flash a utilizar ('off', 'on', 'auto', 'torch').
 * @returns Promise<any> - La foto tomada.
 * @throws Error si la cámara no está lista o si ocurre un fallo durante la captura.
 */
export const takePicture = async (
  cameraRef: React.RefObject<CameraView>,
  flash: 'off' | 'on' | 'auto' | 'torch'
): Promise<any> => {
  if (!cameraRef.current) {
    throw new Error('La cámara no está lista');
  }
  try {
    const options = {
      quality: 1,
      base64: true,
      exif: true,
      flash,
    };
    const photo = await cameraRef.current.takePictureAsync(options);
    return photo;
  } catch (error) {
    console.error('Error al tomar la foto:', error);
    throw new Error('Error al tomar la foto');
  }
};

/**
 * checkGalleryPermissions
 * -------------------------
 * Solicita y verifica permisos para acceder a la galería.
 *
 * @param setErrorMessage - Función para actualizar el mensaje de error.
 * @returns Promise<boolean> - Verdadero si se tienen permisos, falso en caso contrario.
 */
export const checkGalleryPermissions = async (
  setErrorMessage: (msg: string) => void
): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('No se pudo acceder a la galería. Por favor, concede permisos.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error al solicitar permisos de galería:', error);
    setErrorMessage('Error al solicitar permisos de galería');
    return false;
  }
};

/**
 * openGalleryAndProcessImage
 * ----------------------------
 * Abre la galería para seleccionar una imagen, permite editarla y la procesa usando ImageManipulator.
 *
 * @returns Promise<any> - La imagen procesada (manipulada) o null si no se selecciona una imagen.
 * @throws Error si ocurre un fallo durante el procesamiento.
 */
export const openGalleryAndProcessImage = async (): Promise<any> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
    });

    // Retorna null si el usuario cancela la selección o no se obtiene una URI válida
    if (result.canceled || !result.assets || !result.assets[0]?.uri) {
      return null;
    }

    const asset = result.assets[0];
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      asset.uri,
      [], // Sin acciones adicionales de manipulación
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manipulatedImage;
  } catch (error) {
    console.error('Error al procesar la imagen de la galería:', error);
    throw error;
  }
};

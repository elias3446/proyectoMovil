import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView } from 'expo-camera';

/**
 * Verifica que se tenga acceso a la cámara.
 * En web se intenta acceder al stream de video.
 * En dispositivos móviles se solicita el permiso (si aún no ha sido concedido).
 *
 * @param permission - Estado actual de los permisos.
 * @param requestPermission - Función para solicitar el permiso.
 * @param setErrorMessage - Función para actualizar el mensaje de error.
 * @returns Promise<boolean> indicando si se cuenta con el permiso.
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
 * Toma una foto usando la referencia de la cámara.
 *
 * @param cameraRef - Referencia a la cámara.
 * @param flash - Modo de flash a utilizar ('off', 'on', 'auto' o 'torch').
 * @returns La foto tomada.
 * @throws Error si la cámara no está lista o ocurre un fallo durante la captura.
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
 * Verifica y solicita permisos para acceder a la galería.
 *
 * @param setErrorMessage - Función para actualizar el mensaje de error.
 * @returns Promise<boolean> indicando si se tienen permisos para la galería.
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
 * Abre la galería, permite seleccionar y procesa la imagen elegida.
 *
 * @returns La imagen procesada (manipulada).
 * @throws Error si el usuario cancela la selección o ocurre un error durante el procesamiento.
 */
export const openGalleryAndProcessImage = async (): Promise<any> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
    });

    if (result.canceled || !result.assets || !result.assets[0]?.uri) {
      throw new Error('No se seleccionó ninguna imagen');
    }

    const asset = result.assets[0];
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      asset.uri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manipulatedImage;
  } catch (error) {
    console.error('Error al procesar la imagen de la galería:', error);
    throw error;
  }
};

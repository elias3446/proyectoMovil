import {
  CameraView,
  CameraType,
  useCameraPermissions,
  FlashMode,
} from 'expo-camera';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from '@/Components/NotificationBanner';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const CameraCaptureScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Limpia el mensaje de error automáticamente después de 3 segundos
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Verifica los permisos de la cámara al montar el componente
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'web') {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          setErrorMessage('No se pudo acceder a la cámara en la web');
        }
      } else {
        if (!permission?.granted) {
          await requestPermission();
        }
      }
    };

    checkPermissions();
  }, [permission, requestPermission]);

  // Captura la foto sin desmontar la cámara
  const handleTakePhoto = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (cameraRef.current && isCameraReady) {
      try {
        const options = {
          quality: 1,
          base64: true,
          exif: true,
          flash, // Se utiliza el valor actual del estado
        };
        const takenPhoto = await cameraRef.current.takePictureAsync(options);
        if (takenPhoto) {
          setPhoto(takenPhoto);
        } else {
          setErrorMessage('Error al tomar la foto');
        }
      } catch (error) {
        console.error('Error al capturar la foto:', error);
        setErrorMessage('Error al capturar la foto');
      }
    }
  }, [flash, permission, isCameraReady, requestPermission]);

  // Reinicia la toma de foto (se cierra el Modal)
  const handleRetakePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  // Abre la galería y procesa la imagen seleccionada
  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        setPhoto(manipulatedImage);
      }
    } catch (error) {
      console.error('Error al abrir la galería:', error);
      setErrorMessage('Error abriendo la galería');
    }
  };

  // Alterna entre la cámara trasera y frontal, y deshabilita el flash al cambiar a frontal
  const toggleCameraFacing = useCallback(() => {
    setFacing((prev) => {
      if (prev === 'back') {
        setFlash('off'); // Deshabilitar flash al cambiar a cámara frontal
        return 'front';
      } else {
        return 'back';
      }
    });
  }, []);

  // Alterna el flash (solo se muestra en cámara trasera)
  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'auto' : 'off'));
  }, []);

  // Muestra un mensaje si no hay permisos (para plataformas móviles)
  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-center mb-5 text-base text-black">
          Solicitando acceso a la cámara...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center">
      {/* La cámara se monta siempre, de modo que su estado se conserva */}
      <CameraView
        style={{ flex: 1 }}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View className="absolute inset-0 border border-white opacity-60" />
      </CameraView>

      {Platform.OS !== 'web' && (
        <View className="absolute bottom-32 left-0 right-0 flex-row justify-center items-center space-x-1">
          {/* Botón para disminuir zoom */}
          <TouchableOpacity
            onPress={() =>
              setZoom((prev) =>
                Math.max(0, parseFloat((prev - 0.1).toFixed(1)))
              )
            }
            accessibilityLabel="Disminuir zoom"
            accessibilityRole="button"
          >
            <MaterialIcons name="remove-circle" size={40} color="white" />
          </TouchableOpacity>

          <Slider
            style={{ width: '60%', height: 22 }}
            minimumValue={0}
            maximumValue={1}
            value={zoom}
            onValueChange={setZoom}
            thumbTintColor="#FFFFFF"
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#888"
            accessibilityLabel="Control de zoom"
          />

          {/* Botón para aumentar zoom */}
          <TouchableOpacity
            onPress={() =>
              setZoom((prev) =>
                Math.min(1, parseFloat((prev + 0.1).toFixed(1)))
              )
            }
            accessibilityLabel="Aumentar zoom"
            accessibilityRole="button"
          >
            <MaterialIcons name="add-circle" size={40} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de captura */}
      <View className="absolute bottom-0 left-0 right-0 bg-white h-[100px] flex-row justify-center items-center">
        <TouchableOpacity
          className="rounded-full"
          onPress={handleTakePhoto}
          disabled={!permission?.granted || !isCameraReady}
          style={{
            opacity: !permission?.granted || !isCameraReady ? 0.5 : 1,
          }}
          accessibilityLabel="Tomar foto"
          accessibilityRole="button"
        >
          <View className="border-4 border-[#A5D6A7] rounded-full p-1">
            <View className="bg-[#5CB868] rounded-full w-[60px] h-[60px]" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Botón para abrir la galería */}
      <TouchableOpacity
        className="absolute bottom-7 right-7 z-[3]"
        onPress={handleGallery}
        accessibilityLabel="Abrir galería"
        accessibilityRole="button"
      >
        <MaterialIcons name="photo-library" size={50} color="black" />
      </TouchableOpacity>

      {Platform.OS !== 'web' && (
        <View className="absolute top-3 right-3 flex-row justify-start items-center z-[3]">
          {/* Se muestra el botón de flash solo si la cámara es trasera */}
          {facing === 'back' && (
            <TouchableOpacity
              className="bg-transparent p-1 justify-center items-center rounded-xl"
              onPress={toggleFlash}
              accessibilityLabel={
                flash === 'off' ? 'Encender flash' : 'Apagar flash'
              }
              accessibilityRole="button"
            >
              <MaterialIcons
                name={flash === 'off' ? 'flash-off' : 'flash-auto'}
                size={50}
                color="white"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="bg-transparent p-1 justify-center items-center rounded-xl"
            onPress={toggleCameraFacing}
            accessibilityLabel="Cambiar cámara"
            accessibilityRole="button"
          >
            <MaterialIcons name="flip-camera-android" size={50} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Banner de notificaciones para mostrar errores */}
      <NotificationBanner message={errorMessage} type="error" />

      {/* Se muestra la PhotoPreviewSection en un Modal, sin alterar su lugar en la estructura */}
      <Modal
        visible={!!photo}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <PhotoPreviewSection
          photo={photo}
          handleRetakePhoto={handleRetakePhoto}
          setCurrentScreen={setCurrentScreen}
        />
      </Modal>
    </View>
  );
};

export default CameraCaptureScreen;

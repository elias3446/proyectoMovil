// CameraCaptureScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from '@/Components/NotificationBanner';

// Importa las funciones del servicio de cámara
import { checkCameraPermissions, takePicture, openGalleryAndProcessImage } from '@/api/cameraService';

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

  // Verifica los permisos de la cámara al montar el componente usando el servicio
  useEffect(() => {
    if (permission) {
      checkCameraPermissions(permission, requestPermission, setErrorMessage);
    }
  }, [permission, requestPermission]);

  // Captura la foto utilizando el servicio
  const handleTakePhoto = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    if (cameraRef.current && isCameraReady) {
      try {
        const takenPhoto = await takePicture(cameraRef, flash);
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

  // Reinicia la toma de foto
  const handleRetakePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  // Abre la galería y procesa la imagen seleccionada usando el servicio
  const handleGallery = useCallback(async () => {
    try {
      const manipulatedImage = await openGalleryAndProcessImage();
      setPhoto(manipulatedImage);
    } catch (error) {
      console.error('Error al abrir la galería:', error);
      setErrorMessage('Error abriendo la galería');
    }
  }, []);

  // Alterna entre la cámara trasera y frontal
  const toggleCameraFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  // Alterna el flash
  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'auto' : 'off'));
  }, []);

  // Funciones auxiliares para ajustar el zoom
  const handleZoomDecrease = useCallback(() => {
    setZoom((prev) => Math.max(0, prev - 0.1));
  }, []);

  const handleZoomIncrease = useCallback(() => {
    setZoom((prev) => Math.min(1, prev + 0.1));
  }, []);

  // Si no se tienen permisos y no es web, se muestra un mensaje de espera
  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-center mb-5 text-base text-black">
          Solicitando acceso a la cámara...
        </Text>
      </View>
    );
  }

  // Si ya se tomó una foto, se muestra la sección de vista previa
  if (photo) {
    return (
      <PhotoPreviewSection
        photo={photo}
        handleRetakePhoto={handleRetakePhoto}
        setCurrentScreen={setCurrentScreen}
      />
    );
  }

  return (
    <View className="flex-1 bg-white justify-center">
      {/* Cámara: ocupa todo el espacio */}
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
            onPress={handleZoomDecrease}
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
            onPress={handleZoomIncrease}
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
          style={{ opacity: !permission?.granted || !isCameraReady ? 0.5 : 1 }}
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
          <TouchableOpacity
            className="bg-transparent p-1 justify-center items-center rounded-xl"
            onPress={toggleFlash}
            accessibilityLabel={flash === 'off' ? 'Encender flash' : 'Apagar flash'}
            accessibilityRole="button"
          >
            <MaterialIcons name={flash === 'off' ? 'flash-off' : 'flash-auto'} size={50} color="white" />
          </TouchableOpacity>
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
    </View>
  );
};

export default CameraCaptureScreen;

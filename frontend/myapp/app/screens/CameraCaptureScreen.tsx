import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  FlashMode,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import PhotoPreviewSection from "@/Components/PhotoPreviewSection";
import NotificationBanner from "@/Components/NotificationBanner";
import { styles } from "@/assets/styles/CameraCaptureStyles"; // Ajusta la ruta según corresponda

/**
 * Propiedades que recibe el componente de captura de cámara.
 */
interface CameraCaptureScreenProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * Componente que permite capturar fotos utilizando la cámara del dispositivo o seleccionar una imagen de la galería.
 * Incluye controles para cambiar el zoom, el flash y alternar entre la cámara frontal y trasera.
 */
const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  setCurrentScreen,
}) => {
  // Estado para controlar la orientación de la cámara (trasera o frontal)
  const [facing, setFacing] = useState<CameraType>("back");
  // Estado y función para manejar los permisos de la cámara
  const [permission, requestPermission] = useCameraPermissions();
  // Estado para almacenar la foto capturada o seleccionada
  const [photo, setPhoto] = useState<any>(null);
  // Estado para el nivel de zoom de la cámara (valor entre 0 y 1)
  const [zoom, setZoom] = useState(0);
  // Estado para controlar el modo del flash de la cámara
  const [flash, setFlash] = useState<FlashMode>("off");
  // Referencia a la vista de la cámara para acceder a sus métodos
  const cameraRef = useRef<CameraView | null>(null);
  // Estado para mostrar mensajes de error
  const [errorMessage, setErrorMessage] = useState("");
  // Estado para saber si la cámara está lista para capturar fotos
  const [isCameraReady, setIsCameraReady] = useState(false);

  /**
   * Efecto para limpiar automáticamente los mensajes de error después de 3 segundos.
   */
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  /**
   * Efecto para verificar y solicitar los permisos de la cámara al montar el componente.
   * Para web se utiliza getUserMedia de navigator.
   */
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === "web") {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          setErrorMessage("No se pudo acceder a la cámara en la web");
        }
      } else {
        if (!permission?.granted) {
          await requestPermission();
        }
      }
    };

    checkPermissions();
  }, [permission, requestPermission]);

  /**
   * Función para capturar una foto utilizando la cámara.
   * Verifica que existan permisos y que la cámara esté lista antes de tomar la foto.
   */
  const handleTakePhoto = useCallback(async () => {
    // Solicita permisos si aún no se han concedido
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    // Si la cámara está lista, intenta capturar la foto
    if (cameraRef.current && isCameraReady) {
      try {
        const options = {
          quality: 1,
          base64: true,
          exif: true,
          flash, // Utiliza el modo de flash actual
        };
        const takenPhoto = await cameraRef.current.takePictureAsync(options);
        if (takenPhoto) {
          setPhoto(takenPhoto);
        } else {
          setErrorMessage("Error al tomar la foto");
        }
      } catch (error) {
        console.error("Error al capturar la foto:", error);
        setErrorMessage("Error al capturar la foto");
      }
    }
  }, [flash, permission, isCameraReady, requestPermission]);

  /**
   * Función para reiniciar la captura de foto.
   * Permite reintentar la captura o volver a la vista de la cámara.
   */
  const handleRetakePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  /**
   * Función para abrir la galería de imágenes, permitir la selección y procesar la imagen seleccionada.
   */
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
      console.error("Error al abrir la galería:", error);
      setErrorMessage("Error abriendo la galería");
    }
  };

  /**
   * Alterna entre la cámara trasera y la cámara frontal.
   * Al cambiar a cámara frontal se desactiva el flash.
   */
  const toggleCameraFacing = useCallback(() => {
    setFacing((prevFacing) => {
      if (prevFacing === "back") {
        setFlash("off"); // Desactiva el flash cuando se usa la cámara frontal
        return "front";
      }
      return "back";
    });
  }, []);

  /**
   * Alterna el estado del flash entre 'off' y 'auto'.
   */
  const toggleFlash = useCallback(() => {
    setFlash((prevFlash) => (prevFlash === "off" ? "auto" : "off"));
  }, []);

  // Si no se tienen permisos en dispositivos móviles (no web), se muestra un mensaje informativo.
  if (!permission?.granted && Platform.OS !== "web") {
    return (
      <View className={styles.permissionView}>
        <Text className={styles.permissionText}>
          Solicitando acceso a la cámara...
        </Text>
      </View>
    );
  }

  return (
    <View className={styles.rootView}>
      {/* La vista de la cámara se mantiene montada para conservar su estado */}
      <CameraView
        style={{ flex: 1 }}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* Superposición opcional para la cámara */}
        <View className={styles.cameraOverlay} />
      </CameraView>

      {/* Controles de zoom (solo para dispositivos móviles) */}
      {Platform.OS !== "web" && (
        <View className={styles.zoomControls}>
          {/* Botón para disminuir el zoom */}
          <TouchableOpacity
            onPress={() =>
              setZoom((prevZoom) =>
                Math.max(0, parseFloat((prevZoom - 0.1).toFixed(1)))
              )
            }
            accessibilityLabel="Disminuir zoom"
            accessibilityRole="button"
          >
            <MaterialIcons name="remove-circle" size={40} color="white" />
          </TouchableOpacity>

          <Slider
            style={{ width: "60%", height: 22 }}
            minimumValue={0}
            maximumValue={1}
            value={zoom}
            onValueChange={setZoom}
            thumbTintColor="#FFFFFF"
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#888"
            accessibilityLabel="Control de zoom"
          />

          {/* Botón para aumentar el zoom */}
          <TouchableOpacity
            onPress={() =>
              setZoom((prevZoom) =>
                Math.min(1, parseFloat((prevZoom + 0.1).toFixed(1)))
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
      <View className={styles.captureContainer}>
        <TouchableOpacity
          className={styles.captureButton}
          onPress={handleTakePhoto}
          disabled={!permission?.granted || !isCameraReady}
          accessibilityLabel="Tomar foto"
          accessibilityRole="button"
        >
          <View className={styles.captureBorder}>
            <View className={styles.captureInner} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Botón para abrir la galería */}
      <TouchableOpacity
        className={styles.galleryButton}
        onPress={handleGallery}
        accessibilityLabel="Abrir galería"
        accessibilityRole="button"
      >
        <MaterialIcons name="photo-library" size={50} color="black" />
      </TouchableOpacity>

      {/* Controles superiores (flash y cambio de cámara) para dispositivos móviles */}
      {Platform.OS !== "web" && (
        <View className={styles.topControls}>
          {/* Botón de flash (visible solo en cámara trasera) */}
          {facing === "back" && (
            <TouchableOpacity
              className={styles.flashButton}
              onPress={toggleFlash}
              accessibilityLabel={flash === "off" ? "Encender flash" : "Apagar flash"}
              accessibilityRole="button"
            >
              <MaterialIcons
                name={flash === "off" ? "flash-off" : "flash-auto"}
                size={50}
                color="white"
              />
            </TouchableOpacity>
          )}
          {/* Botón para alternar entre cámara frontal y trasera */}
          <TouchableOpacity
            className={styles.cameraToggleButton}
            onPress={toggleCameraFacing}
            accessibilityLabel="Cambiar cámara"
            accessibilityRole="button"
          >
            <MaterialIcons name="flip-camera-android" size={50} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Banner de notificaciones para mostrar mensajes de error */}
      <NotificationBanner message={errorMessage} type="error" />

      {/* Vista previa de la foto en un Modal para confirmar o retomar */}
      <Modal visible={!!photo} animationType="slide" onRequestClose={() => {}}>
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

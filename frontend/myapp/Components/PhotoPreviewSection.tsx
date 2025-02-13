// PhotoPreviewSection.tsx
import Fontisto from "@expo/vector-icons/Fontisto";
import React, { useState, useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  View,
  Text,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import NotificationBanner from "@/Components/NotificationBanner";
// Importa la función del servicio para enviar el mensaje con la imagen
import { sendPhotoMessage } from "@/api/photoService";

interface PhotoPreviewSectionProps {
  photo: { uri: string };
  handleRetakePhoto: () => void;
  setCurrentScreen: (screen: string) => void;
}

/**
 * ImagePreview:
 * Muestra la vista previa de la imagen en un contenedor con estilos definidos.
 * También muestra un banner de notificación en caso de error.
 */
const ImagePreview: React.FC<{ photo: { uri: string }; errorMessage: string }> = ({
  photo,
  errorMessage,
}) => (
  <View className="w-full h-[300px] bg-[#F3F4F6] justify-center items-center rounded-[16px] mb-8">
    <NotificationBanner message={errorMessage} type="error" />
    {photo?.uri ? (
      <Image
        className="w-full h-full rounded-[15px] bg-white"
        source={{ uri: photo.uri }}
        resizeMode="contain"
      />
    ) : (
      <Text className="text-red-500 text-base text-center mt-2">
        No image available
      </Text>
    )}
  </View>
);

/**
 * ActionButtons:
 * Renderiza dos botones para retomar o enviar la foto.
 */
interface ActionButtonsProps {
  onRetake: () => void;
  onSend: () => void;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRetake,
  onSend,
  disabled,
}) => (
  <View className="flex-row justify-center items-center">
    <TouchableOpacity
      className="bg-[#5CB868] rounded-full p-3 m-2.5 justify-center items-center"
      onPress={onRetake}
      accessibilityLabel="Re-take photo"
      accessibilityRole="button"
    >
      <Fontisto name="trash" size={36} color="white" />
    </TouchableOpacity>
    <TouchableOpacity
      className="bg-[#5CB868] rounded-full p-3 m-2.5 justify-center items-center"
      onPress={onSend}
      disabled={disabled}
      accessibilityLabel="Send photo"
      accessibilityRole="button"
    >
      <Fontisto name="check" size={36} color="white" />
    </TouchableOpacity>
  </View>
);

/**
 * PhotoPreviewSection:
 * Componente principal que permite al usuario revisar la imagen tomada,
 * retomar la toma o enviarla. Además, maneja estados de carga y errores.
 */
const PhotoPreviewSection: React.FC<PhotoPreviewSectionProps> = ({
  photo,
  handleRetakePhoto,
  setCurrentScreen,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * handleSendPhoto:
   * Cierra el teclado y envía la imagen mediante el servicio.
   */
  const handleSendPhoto = useCallback(async () => {
    Keyboard.dismiss();
    if (!photo?.uri) {
      setErrorMessage("No hay imagen para enviar.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPhotoMessage(photo, setCurrentScreen);
    } catch (error: any) {
      console.error("Error al enviar la imagen:", error);
      setErrorMessage(error.message || "Error al enviar la imagen.");
    } finally {
      setIsLoading(false);
    }
  }, [photo, setCurrentScreen]);

  // Auto-limpieza del mensaje de error después de 3 segundos
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <SafeAreaView className="flex-1 relative bg-white justify-center items-center p-5">
      {/* Vista previa de la imagen */}
      <ImagePreview photo={photo} errorMessage={errorMessage} />

      {/* Botones para retomar o enviar la imagen */}
      <ActionButtons
        onRetake={handleRetakePhoto}
        onSend={handleSendPhoto}
        disabled={isLoading || !photo?.uri}
      />

      {/* Indicador de carga */}
      {isLoading && (
        <View className="absolute inset-0 justify-center items-center">
          <ActivityIndicator size="large" color="#5CB868" />
        </View>
      )}

      {/* Mensaje de error */}
      {errorMessage ? (
        <Text className="text-red-500 text-base text-center mt-2">
          {errorMessage}
        </Text>
      ) : null}
    </SafeAreaView>
  );
};

export default PhotoPreviewSection;

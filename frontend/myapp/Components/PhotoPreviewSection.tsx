// PhotoPreviewSection.tsx
import Fontisto from "@expo/vector-icons/Fontisto";
import React, { useState, useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  View,
  Text,
  Platform,
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

const PhotoPreviewSection: React.FC<PhotoPreviewSectionProps> = ({
  photo,
  handleRetakePhoto,
  setCurrentScreen,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar el envío de la imagen utilizando el servicio
  const handleSendPhoto = useCallback(async () => {
    // Se cierra el teclado si está abierto
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

      <View className="flex-row justify-center items-center">
        <TouchableOpacity
          className="bg-[#5CB868] rounded-full p-3 m-2.5 justify-center items-center"
          onPress={handleRetakePhoto}
          accessibilityLabel="Re-take photo"
          accessibilityRole="button"
        >
          <Fontisto name="trash" size={36} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#5CB868] rounded-full p-3 m-2.5 justify-center items-center"
          onPress={handleSendPhoto}
          disabled={isLoading || !photo?.uri}
          accessibilityLabel="Send photo"
          accessibilityRole="button"
        >
          <Fontisto name="check" size={36} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="absolute inset-0 justify-center items-center">
          <ActivityIndicator size="large" color="#5CB868" />
        </View>
      )}

      {errorMessage ? (
        <Text className="text-red-500 text-base text-center mt-2">
          {errorMessage}
        </Text>
      ) : null}
    </SafeAreaView>
  );
};

export default PhotoPreviewSection;

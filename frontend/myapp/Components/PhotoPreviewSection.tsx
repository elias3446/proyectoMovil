import Fontisto from "@expo/vector-icons/Fontisto";
import React, { useState } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  View,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
// Se eliminó el import de expo-image-picker porque no se usa en este componente.
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";

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

  const auth = getAuth();
  const db = getFirestore();

  // Constantes de configuración para Cloudinary
  const CLOUDINARY_UPLOAD_URL =
    "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload";
  const CLOUDINARY_UPLOAD_PRESET = "my_upload_preset2";
  const CLOUDINARY_FOLDER = "user_messages";

  // Función para enviar la imagen al API
  const processImageWithAPI = async (imageUri: string): Promise<string> => {
    try {
      setErrorMessage("");
      const response = await fetch(
        "https://proyectomovil-qh8q.onrender.com/process_image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url: imageUri }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error en la respuesta de la API");
      }
      return data.respuesta || "No response from server";
    } catch (error: any) {
      console.error("Error processing image with API:", error);
      setErrorMessage("Error al procesar la imagen en el servidor.");
      throw error;
    }
  };

  // Función para subir la imagen a Cloudinary
  const uploadImageToCloudinary = async (photo: { uri: string }): Promise<string> => {
    try {
      setErrorMessage("");
      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        formData.append("file", blob, "photo.jpg");
      } else {
        formData.append("file", {
          uri: photo.uri,
          type: photo.uri.endsWith("png") ? "image/png" : "image/jpeg",
          name: photo.uri.split("/").pop() || "photo.jpg",
        } as any);
      }
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", CLOUDINARY_FOLDER);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Error al subir la imagen");
      }
      return data.secure_url;
    } catch (error: any) {
      console.error("Error uploading image to Cloudinary:", error);
      setErrorMessage("Error al subir la imagen a Cloudinary.");
      throw error;
    }
  };

  // Función para manejar el envío de la imagen
  const handleSendPhoto = async () => {
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("Usuario no autenticado.");
      return;
    }
    if (!photo?.uri) {
      setErrorMessage("No hay imagen para enviar.");
      return;
    }
    setIsLoading(true);
    try {
      // Se sube la imagen a Cloudinary y se obtiene la URL segura
      const imageUrl = await uploadImageToCloudinary(photo);
      const receiverUID = "receiverUID"; // TODO: Reemplazar por el ID real del receptor
      const userMessagesRef = collection(db, "users", user.uid, "messages");
      const receiverMessagesRef = collection(db, "users", receiverUID, "messages");

      // Se guarda el mensaje del usuario con la URL de la imagen subida
      await addDoc(userMessagesRef, {
        text: imageUrl,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
      });

      // Se envía la imagen al API para que la procese y se obtenga la respuesta del bot
      const botResponseText = await processImageWithAPI(imageUrl);

      const botMessage = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      // Se guarda el mensaje del bot en las colecciones correspondientes
      await addDoc(userMessagesRef, botMessage);
      await addDoc(receiverMessagesRef, botMessage);

      // Solo se navega a la pantalla de chat si todo fue exitoso
      setCurrentScreen("ChatScreen");
    } catch (error) {
      console.error("Error al enviar la imagen:", error);
      // El error ya se muestra mediante NotificationBanner y el mensaje de error.
    } finally {
      setIsLoading(false);
    }
  };

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
        >
          <Fontisto name="trash" size={36} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#5CB868] rounded-full p-3 m-2.5 justify-center items-center"
          onPress={handleSendPhoto}
          disabled={isLoading || !photo?.uri}
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

import Fontisto from "@expo/vector-icons/Fontisto";
import React, { useState } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";
import { processImageWithAPI } from "@/api/processWithAPIService";

interface PhotoPreviewSectionProps {
  photo: { uri: string };
  handleRetakePhoto: () => void;
  setCurrentScreen?: (screen: string) => void;
  onConfirm?: () => void; // Si se define, se usará en lugar de la lógica por defecto
}

const PhotoPreviewSection: React.FC<PhotoPreviewSectionProps> = ({
  photo,
  handleRetakePhoto,
  setCurrentScreen,
  onConfirm,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  const handleSendPhoto = async () => {

    
    // Lógica por defecto (flujo de chat)
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
      const imageUrl = await uploadImageToCloudinary(photo.uri, "user_messages");
      if (!imageUrl) {
        throw new Error("Image URL is null");
      }
      const botResponseText = await processImageWithAPI(
        imageUrl,
        (msg: string) => setErrorMessage(msg)
      );
      if (botResponseText && botResponseText.toLowerCase() === "no hay plantas") {
        Alert.alert(
          "Atención",
          botResponseText,
          [
            {
              text: "OK",
              onPress: handleRetakePhoto,
            },
          ],
          { cancelable: false }
        );
        return;
      }
          // Si se provee onConfirm, simplemente lo llamamos
    if (onConfirm) {
      onConfirm();
      return;
    }
    
      const receiverUID = "receiverUID"; // TODO: Reemplazar por el ID real del receptor
      const userMessagesRef = collection(db, "users", user.uid, "messages");
      const receiverMessagesRef = collection(db, "users", receiverUID, "messages");

      await addDoc(userMessagesRef, {
        text: imageUrl,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
      });

      const botMessage = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      await addDoc(userMessagesRef, botMessage);
      await addDoc(receiverMessagesRef, botMessage);

      if (setCurrentScreen) {
        setCurrentScreen("ChatScreen");
      } else {
        Alert.alert("Éxito", "La imagen ha sido procesada y enviada.");
      }
    } catch (error) {
      console.error("Error al enviar la imagen:", error);
      setErrorMessage("Error al enviar la imagen.");
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

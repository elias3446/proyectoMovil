import Fontisto from "@expo/vector-icons/Fontisto"; // Importación corregida
import React, { useState } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
  photo: { uri: string };
  handleRetakePhoto: () => void;
  setCurrentScreen: (screen: string) => void;
}

const PhotoPreviewSection: React.FC<LoginProps> = ({
  photo,
  handleRetakePhoto,
  setCurrentScreen,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const sendImageToAPI = async (imageUri: string) => {
    try {
        setErrorMessage("");  // Reset error message
        const response = await fetch('https://proyectomovil-qh8q.onrender.com/process_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_url: imageUri }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error en la respuesta de la API');
        }

        return data.respuesta || 'No response from server';
    } catch (error) {
        console.error('Error sending image:', error);
        setErrorMessage(imageUri);
        throw error;
    }
};

  // Subir imagen a Cloudinary
  const uploadImageToCloudinary = async (photo: { uri: string }) => {
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
          name: photo.uri.split("/").pop(),
        } as any);
      }

      formData.append("upload_preset", "my_upload_preset2");
      formData.append("folder", "user_messages");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Error al subir la imagen");
      }

     

      return data.secure_url;
    } catch (error) {
      console.error("Error subiendo la imagen:", error);
      setErrorMessage("Error al subir la imagen a Cloudinary.");
      throw error;
    }
  };

  // Enviar imagen al chat
  const handleSendPhoto = async () => {
    const user = auth.currentUser;
    if (user) {
      setIsLoading(true);
      try {
        const imageUrl = await uploadImageToCloudinary(photo);

        const receiverUID = "receiverUID"; // Cambia esto con el ID del receptor real
        const userMessagesRef = collection(db, "users", user.uid, "messages");
        const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

        await addDoc(userMessagesRef, {
          text: imageUrl,
          sender: user.uid,
          receiver: receiverUID,
          timestamp: new Date(),
        });

        const botResponseText = await sendImageToAPI(imageUrl);

        const botMessage = {
            text: botResponseText,
            sender: receiverUID,
            receiver: user.uid,
            timestamp: new Date(),
        };
        await addDoc(userMessagesRef, botMessage);
        await addDoc(receiverMessagesRef, botMessage);

        setErrorMessage(imageUrl);

      } catch (error) {
        console.error("Error al enviar la imagen:", error);
       // setErrorMessage("Error al enviar la imagen: " + (error as any).message);
      } finally {

        
       // setCurrentScreen("ChatScreen"); // Cambiar a la pantalla de chat
        
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <NotificationBanner message={errorMessage} type="error" />
        {photo?.uri ? (
          <Image
            style={styles.previewContainer}
            source={{ uri: photo.uri }}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.errorText}>No image available</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
          <Fontisto name="trash" size={36} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSendPhoto}
          disabled={isLoading}
        >
          <Fontisto name="check" size={36} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <ActivityIndicator
          size="large"
          color="#5CB868"
          style={styles.loadingIndicator}
        />
      )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderRadius: 16,
    marginBottom: 30,
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#5CB868",
    borderRadius: 25,
    padding: 12,
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});

export default PhotoPreviewSection;

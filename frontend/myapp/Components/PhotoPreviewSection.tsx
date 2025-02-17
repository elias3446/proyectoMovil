import React, { useState, useCallback } from "react";
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import Fontisto from "@expo/vector-icons/Fontisto";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";
import { processImageWithAPI } from "@/api/processWithAPIService";

/**
 * Props para el componente PhotoPreviewSection.
 */
interface PhotoPreviewSectionProps {
  /** Objeto que contiene la URI de la foto a previsualizar */
  photo: { uri: string };
  /** Función para retomar la captura (descartar la imagen actual) */
  handleRetakePhoto: () => void;
  /** (Opcional) Función para cambiar de pantalla después de confirmar el envío */
  setCurrentScreen?: (screen: string) => void;
  /** (Opcional) Función personalizada que se ejecuta al confirmar el envío */
  onConfirm?: () => void;
}

/**
 * PhotoPreviewSection:
 * Componente para previsualizar una imagen capturada o seleccionada, y proceder a enviarla.
 * Permite retomar la captura o enviar la imagen, procesándola con una API externa y actualizando
 * los mensajes en Firestore.
 */
const PhotoPreviewSection: React.FC<PhotoPreviewSectionProps> = ({
  photo,
  handleRetakePhoto,
  setCurrentScreen,
  onConfirm,
}) => {
  // Estado para almacenar mensajes de error e indicar carga
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Instancias de autenticación y Firestore
  const auth = getAuth();
  const db = getFirestore();

  /**
   * handleSendPhoto:
   * Función asíncrona que gestiona el envío de la imagen:
   * - Verifica que el usuario esté autenticado y que exista una imagen.
   * - Sube la imagen a Cloudinary en la carpeta "user_messages".
   * - Procesa la imagen mediante una API externa para obtener una respuesta del bot.
   * - Si la respuesta es "no hay plantas", muestra una alerta y permite retomar la foto.
   * - Si se proporciona la función onConfirm, se ejecuta esa lógica.
   * - De lo contrario, almacena los mensajes en Firestore y cambia a la pantalla "ChatScreen".
   */
  const handleSendPhoto = useCallback(async () => {
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
      // Sube la imagen a Cloudinary en la carpeta "user_messages"
      const imageUrl = await uploadImageToCloudinary(photo.uri, "user_messages");
      if (!imageUrl) throw new Error("Image URL is null");

      // Procesa la imagen y obtiene la respuesta del bot
      const botResponseText = await processImageWithAPI(
        imageUrl,
        (msg: string) => setErrorMessage(msg)
      );

      // Si la respuesta es "no hay plantas", muestra alerta y permite retomar la imagen
      if (botResponseText && botResponseText.toLowerCase() === "no hay plantas") {
        Alert.alert(
          "Atención",
          botResponseText,
          [{ text: "OK", onPress: handleRetakePhoto }],
          { cancelable: false }
        );
        return;
      }

      // Si se ha definido onConfirm, se ejecuta y se omite el flujo por defecto
      if (onConfirm) {
        onConfirm();
        return;
      }

      // Define el ID del receptor (reemplazar "receiverUID" por el valor real en producción)
      const receiverUID = "receiverUID";

      // Referencias a las colecciones de mensajes para el usuario y el receptor
      const userMessagesRef = collection(db, "users", user.uid, "messages");
      const receiverMessagesRef = collection(db, "users", receiverUID, "messages");

      // Agrega el mensaje del usuario con la imagen subida
      await addDoc(userMessagesRef, {
        text: imageUrl,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
      });

      // Prepara el mensaje de respuesta del bot
      const botMessage = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      // Agrega el mensaje del bot en ambas colecciones
      await addDoc(userMessagesRef, botMessage);
      await addDoc(receiverMessagesRef, botMessage);

      // Cambia la pantalla a "ChatScreen" o muestra un mensaje de éxito
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
  }, [auth, photo, onConfirm, setCurrentScreen, handleRetakePhoto, db]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Muestra el banner de notificación en caso de error */}
        <NotificationBanner message={errorMessage} type="error" />
        {photo?.uri ? (
          <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.noImageText}>No image available</Text>
        )}
      </View>

      {/* Botones para retomar la foto o enviarla */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
          <Fontisto name="trash" size={36} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, (isLoading || !photo?.uri) && styles.disabledButton]}
          onPress={handleSendPhoto}
          disabled={isLoading || !photo?.uri}
        >
          <Fontisto name="check" size={36} color="white" />
        </TouchableOpacity>
      </View>

      {/* Indicador de carga superpuesto */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5CB868" />
        </View>
      )}

      {/* Muestra mensaje de error debajo de los botones, si existe */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#ffffff",
  },
  noImageText: {
    color: "#ff4d4f",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#5CB868",
    borderRadius: 50,
    padding: 12,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
});

export default PhotoPreviewSection;

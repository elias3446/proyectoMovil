import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/Config/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";

interface AccountRecoveryScreenProps {
  setCurrentScreen: (screen: string) => void;
}

const AccountRecoveryScreen: React.FC<AccountRecoveryScreenProps> = ({ setCurrentScreen }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = emailOrPhone.trim();
    if (trimmedEmail === "") {
      setErrorMessage("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage("Correo de recuperación enviado exitosamente.");
      // Redirige al login después de 1.5 segundos
      setTimeout(() => setCurrentScreen("LoginScreen"), 1500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Error al enviar el correo de recuperación.");
      } else {
        setErrorMessage("Error al enviar el correo de recuperación.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Limpia los mensajes de error o éxito después de 3 segundos
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View className="flex-1 w-full max-w-[25rem] bg-white justify-center items-center px-5 mt-10">
          <Text className="text-3xl font-bold text-center text-black mb-3">
            Recupera tu cuenta
          </Text>
          <Text className="text-lg text-[#666] text-center mb-5">
            Ingresa tu correo electrónico para buscar tu cuenta.
          </Text>

          {/* Campo de correo electrónico */}
          <View className="w-full mb-5">
            <Text className="text-black text-base mb-2 text-left font-bold">
              Correo Electrónico
            </Text>
            <View className="flex-row items-center bg-[#F3F4F6] rounded-xl relative w-full">
              <Ionicons
                name="mail-outline"
                size={24}
                color="black"
                className="absolute z-20 left-3"
              />
              <TextInput
                className="flex-1 h-11 pl-11 pr-4 text-lg text-black bg-[#F3F4F6] rounded-xl"
                placeholder="Ingresa tu correo"
                placeholderTextColor="gray"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoFocus
              />
            </View>
          </View>

          {/* Botones de Cancelar y Buscar */}
          <View className="flex-row w-full mt-5 justify-between">
            <TouchableOpacity
              className="bg-[#CCCCCC] py-3 px-5 rounded-xl w-[48%] items-center"
              onPress={() => setCurrentScreen("LoginScreen")}
              disabled={loading}
              accessibilityLabel="Cancelar"
            >
              <Text className="text-white font-bold text-lg">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#5CB868] py-3 px-5 rounded-xl w-[48%] items-center"
              onPress={handleSubmit}
              disabled={loading}
              accessibilityLabel="Buscar"
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Cargando..." : "Buscar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default AccountRecoveryScreen;

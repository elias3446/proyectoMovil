import React, { useState, useEffect, useCallback } from "react"; 
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/Config/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";
import { styles } from "@/assets/styles/AccountRecoveryStyles"; // Asegúrate de ajustar la ruta según corresponda

interface AccountRecoveryScreenProps {
  setCurrentScreen: (screen: string) => void;
}

const AccountRecoveryScreen: React.FC<AccountRecoveryScreenProps> = ({
  setCurrentScreen,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    Keyboard.dismiss();

    const trimmedEmail = emailOrPhone.trim();
    if (trimmedEmail === "") {
      setErrorMessage("Por favor, ingresa tu correo electrónico.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage("Correo de recuperación enviado exitosamente.");
      setTimeout(() => setCurrentScreen("LoginScreen"), 1500);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setErrorMessage("No se encontró un usuario con ese correo electrónico.");
      } else {
        setErrorMessage(
          error.message || "Error al enviar el correo de recuperación."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [emailOrPhone, setCurrentScreen, validateEmail]);

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
      className={styles.keyboardAvoidingView}
    >
      <ScrollView
        className={styles.scrollView}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View className={styles.container}>
          <Text className={styles.title}>
            Recupera tu cuenta
          </Text>
          <Text className={styles.subtitle}>
            Ingresa tu correo electrónico para buscar tu cuenta.
          </Text>

          {/* Campo de correo electrónico */}
          <View className={styles.emailContainer}>
            <Text className={styles.emailLabel}>
              Correo Electrónico
            </Text>
            <View className={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={24}
                color="black"
                className={styles.emailIcon}
              />
              <TextInput
                className={styles.emailInput}
                placeholder="Ingresa tu correo"
                placeholderTextColor="gray"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
          </View>

          {/* Botones de Cancelar y Buscar */}
          <View className={styles.buttonsContainer}>
            <TouchableOpacity
              className={styles.cancelButton}
              onPress={() => setCurrentScreen("LoginScreen")}
              disabled={loading}
              accessibilityLabel="Cancelar"
            >
              <Text className={styles.buttonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={styles.searchButton}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityLabel="Buscar"
            >
              <Text className={styles.buttonText}>
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

export default AccountRecoveryScreen;

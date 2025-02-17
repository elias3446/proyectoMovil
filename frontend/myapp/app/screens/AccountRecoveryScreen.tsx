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
import { styles } from "@/assets/styles/AccountRecoveryStyles";

// Definición de propiedades para la pantalla de recuperación de cuenta
interface AccountRecoveryScreenProps {
  setCurrentScreen: (screen: string) => void;
}

// Propiedades para el componente de entrada de correo
interface EmailInputProps {
  email: string;
  onChangeEmail: (text: string) => void;
}

/**
 * Componente de entrada de correo electrónico.
 */
const EmailInput: React.FC<EmailInputProps> = ({ email, onChangeEmail }) => {
  return (
    <View className={styles.emailContainer}>
      <Text className={styles.emailLabel}>Correo Electrónico</Text>
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
          value={email}
          onChangeText={onChangeEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
      </View>
    </View>
  );
};

// Propiedades para el componente de botones de acción
interface ActionButtonsProps {
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * Componente que renderiza los botones de acción: Cancelar y Buscar.
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  isLoading,
  onCancel,
  onSubmit,
}) => {
  return (
    <View className={styles.buttonsContainer}>
      <TouchableOpacity
        className={styles.cancelButton}
        onPress={onCancel}
        disabled={isLoading}
        accessibilityLabel="Cancelar"
      >
        <Text className={styles.buttonText}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={styles.searchButton}
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel="Buscar"
      >
        <Text className={styles.buttonText}>
          {isLoading ? "Cargando..." : "Buscar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Componente que permite a los usuarios recuperar su cuenta ingresando su correo electrónico.
 * Realiza la validación del correo, envía la solicitud de recuperación a Firebase y muestra notificaciones.
 */
const AccountRecoveryScreen: React.FC<AccountRecoveryScreenProps> = ({
  setCurrentScreen,
}) => {
  // Estados para almacenar el correo, el estado de carga y los mensajes de error/exito.
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /**
   * Valida que el formato del correo electrónico sea correcto.
   * @param email - Correo electrónico a validar.
   * @returns {boolean} - True si el formato es válido, de lo contrario false.
   */
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  /**
   * Maneja el envío del correo de recuperación.
   * Realiza las validaciones correspondientes y utiliza Firebase para enviar el correo.
   */
  const handleSubmit = useCallback(async () => {
    // Reinicia los mensajes de error y éxito y oculta el teclado
    setErrorMessage("");
    setSuccessMessage("");
    Keyboard.dismiss();

    const trimmedEmail = email.trim();

    // Verifica que se haya ingresado un correo
    if (trimmedEmail === "") {
      setErrorMessage("Por favor, ingresa tu correo electrónico.");
      return;
    }

    // Verifica que el formato del correo sea correcto
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage("Ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);
    try {
      // Envía el correo de recuperación a través de Firebase
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage("Correo de recuperación enviado exitosamente.");
      // Redirige a la pantalla de login después de un breve retraso
      setTimeout(() => setCurrentScreen("LoginScreen"), 1500);
    } catch (error: any) {
      // Maneja los errores específicos y generales
      if (error.code === "auth/user-not-found") {
        setErrorMessage("No se encontró un usuario con ese correo electrónico.");
      } else {
        setErrorMessage(
          error.message || "Error al enviar el correo de recuperación."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, setCurrentScreen, validateEmail]);

  /**
   * Limpia los mensajes de error y éxito después de 3 segundos.
   */
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
          {/* Título y subtítulo de la pantalla */}
          <Text className={styles.title}>Recupera tu cuenta</Text>
          <Text className={styles.subtitle}>
            Ingresa tu correo electrónico para buscar tu cuenta.
          </Text>

          {/* Campo de entrada para el correo electrónico */}
          <EmailInput email={email} onChangeEmail={setEmail} />

          {/* Botones de acción: Cancelar y Buscar */}
          <ActionButtons
            isLoading={isLoading}
            onCancel={() => setCurrentScreen("LoginScreen")}
            onSubmit={handleSubmit}
          />
        </View>
      </ScrollView>

      {/* Notificaciones para mostrar mensajes de error y éxito */}
      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </KeyboardAvoidingView>
  );
};

export default AccountRecoveryScreen;

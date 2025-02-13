// AccountRecoveryScreen.tsx
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
import NotificationBanner from "@/Components/NotificationBanner";
// Importa la función del servicio de recuperación de cuenta
import { sendRecoveryEmail } from "@/api/firebaseService";

interface AccountRecoveryScreenProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * LabeledInput:
 * Componente reutilizable para renderizar un campo de entrada con etiqueta e ícono.
 */
interface LabeledInputProps {
  label: string;
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoFocus?: boolean;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  autoFocus = false,
}) => (
  <View className="w-full mb-5">
    <Text className="text-black text-base mb-2 text-left font-bold">
      {label}
    </Text>
    <View className="flex-row items-center bg-[#F3F4F6] rounded-xl relative w-full">
      <Ionicons
        name={iconName as any}
        size={24}
        color="black"
        className="absolute z-20 left-3"
      />
      <TextInput
        className="flex-1 h-11 pl-11 pr-4 text-lg text-black bg-[#F3F4F6] rounded-xl"
        placeholder={placeholder}
        placeholderTextColor="gray"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
      />
    </View>
  </View>
);

/**
 * ActionButtons:
 * Componente para renderizar dos botones: Cancelar y Buscar.
 */
interface ActionButtonsProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSubmit,
  loading,
}) => (
  <View className="flex-row w-full mt-5 justify-between">
    <TouchableOpacity
      className="bg-[#CCCCCC] py-3 px-5 rounded-xl w-[48%] items-center"
      onPress={onCancel}
      disabled={loading}
      accessibilityLabel="Cancelar"
    >
      <Text className="text-white font-bold text-lg text-center">
        Cancelar
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      className="bg-[#5CB868] py-3 px-5 rounded-xl w-[48%] items-center"
      onPress={onSubmit}
      disabled={loading}
      accessibilityLabel="Buscar"
    >
      <Text className="text-white font-bold text-lg text-center">
        {loading ? "Cargando..." : "Buscar"}
      </Text>
    </TouchableOpacity>
  </View>
);

/**
 * AccountRecoveryScreen:
 * Permite al usuario ingresar su correo electrónico para recuperar su cuenta.
 */
const AccountRecoveryScreen: React.FC<AccountRecoveryScreenProps> = ({
  setCurrentScreen,
}) => {
  // Estados para el correo, carga y mensajes de error/éxito
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /**
   * validateEmail: Valida el formato del correo electrónico.
   */
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  /**
   * handleSubmit: Envía el correo de recuperación y, en caso de éxito, redirige al login.
   */
  const handleSubmit = useCallback(async () => {
    // Limpia mensajes previos y cierra el teclado
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
      await sendRecoveryEmail(trimmedEmail);
      setSuccessMessage("Correo de recuperación enviado exitosamente.");
      // Redirige al login después de 1.5 segundos
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

  // Limpia automáticamente los mensajes de error o éxito después de 3 segundos
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
      className="flex-1 bg-white justify-center items-center"
    >
      <ScrollView
        className="bg-white w-full"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full bg-white rounded-xl relative max-w-[25rem] px-5 mt-10">
          <Text className="font-bold text-3xl text-center text-black mb-3">
            Recupera tu cuenta
          </Text>
          <Text className="text-lg text-[#666] text-center mb-5">
            Ingresa tu correo electrónico para buscar tu cuenta.
          </Text>
          {/* Campo de correo electrónico */}
          <LabeledInput
            label="Correo Electrónico"
            iconName="mail-outline"
            placeholder="Ingresa tu correo"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          {/* Botones de Cancelar y Buscar */}
          <ActionButtons
            onCancel={() => setCurrentScreen("LoginScreen")}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
      {/* Notificaciones de error y éxito */}
      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </KeyboardAvoidingView>
  );
};

export default AccountRecoveryScreen;

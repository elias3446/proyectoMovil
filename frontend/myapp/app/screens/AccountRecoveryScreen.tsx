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

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const AccountRecoveryScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (emailOrPhone === "") {
      setErrorMessage("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailOrPhone);
      setSuccessMessage("Correo de recuperación enviado exitosamente.");
      setTimeout(() => setCurrentScreen("LoginScreen"), 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "Error al enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contenedor}>
          <Text style={styles.title}>Recupera tu cuenta</Text>
          <Text style={styles.instruction}>
            Ingresa tu correo electrónico para buscar tu cuenta.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={24} color="black" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu correo"
                placeholderTextColor="gray"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoFocus={true}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCurrentScreen("LoginScreen")}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contenedor: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "black",
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "black",
    marginBottom: 5,
    textAlign: "left",
    fontWeight: "bold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    position: "relative",
    width: "100%",
  },
  input: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    color: "black",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 0,
  },
  icon: {
    position: "absolute",
    left: 10,
    zIndex: 2,
  },
  footer: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#CCCCCC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#5CB868",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AccountRecoveryScreen;

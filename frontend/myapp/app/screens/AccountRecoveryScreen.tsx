import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { auth } from "@/Config/firebaseConfig";  // Asegúrate de importar correctamente
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Recupera tu cuenta</Text>
        <Text style={styles.instruction}>
          Ingresa tu correo electrónico para buscar tu cuenta.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoFocus={true}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentScreen("LoginScreen")}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? "Cargando..." : "Buscar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#1877f2",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AccountRecoveryScreen;
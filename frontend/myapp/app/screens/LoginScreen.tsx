import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { auth } from "@/Config/firebaseConfig";  // Importar auth desde el archivo firebaseConfig
import { signInWithEmailAndPassword } from "firebase/auth";
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (email === "" || password === "") {
      setErrorMessage("Por favor, completa ambos campos.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage("Inicio de sesión exitoso");
      setCurrentScreen("ProfileScreen")
      //setTimeout(() => setCurrentScreen("CameraCapture"), 150);  // Cambiar pantalla después de éxito
    } catch (error: any) {
      setErrorMessage(error.message || "Credenciales incorrectas o problema de red.");
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar sesión</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico o número de teléfono"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => setEmail(text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
            >
            <Text style={styles.loginButtonText}>
              {loading ? "Cargando..." : "Iniciar sesión"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCurrentScreen("AccountRecoveryScreen")}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCurrentScreen("RegisterScreen")}>
            <Text style={styles.linkText}>Crear cuenta nueva</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", backgroundColor: "#f0f2f5" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
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
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
  inputContainer: { width: "100%", marginBottom: 15 },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
  },
  loginButton: {
    backgroundColor: "#1877f2",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkText: {
    color: "#1877f2",
    textAlign: "center",
    marginBottom: 15,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
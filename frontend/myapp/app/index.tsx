import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";

// Importa las pantallas de la aplicación
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";

// Componente de navegación inferior
import MyTab from "@/Components/MyTab";

// Registro de token para notificaciones push
import registerNNPushToken from "native-notify";
import { APP_ID, APP_TOKEN } from "@/api/notificationService";

// Estilos globales (si son necesarios)
import "../global.css";

// Función para suscribirse a los cambios de autenticación en Firebase
import { subscribeToAuthChanges } from "@/api/firebaseService";

/**
 * Mapeo de nombres de pantalla a sus respectivos componentes.
 * Permite seleccionar el componente a renderizar según el estado de la aplicación.
 */
const SCREENS: { [key: string]: React.FC<{ setCurrentScreen: (screen: string) => void }> } = {
  LoginScreen,
  RegisterScreen,
  AccountRecoveryScreen,
  CameraCaptureScreen,
  ChatScreen,
  SocialNetScreen,
  ProfileScreen,
};

/**
 * Componente principal de la aplicación.
 * Se encarga de gestionar el flujo inicial de autenticación, mostrar el splash y determinar
 * qué pantalla renderizar en función del estado de la autenticación.
 */
export default function Index() {
  // Registra el token para notificaciones push
  registerNNPushToken(APP_ID, APP_TOKEN);

  // Estados de autenticación y temporización del splash
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [simulatedDelayCompleted, setSimulatedDelayCompleted] = useState(false);

  // Estado para determinar la pantalla actual. Inicialmente es null para esperar la verificación.
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  /**
   * useEffect: Escucha los cambios en la autenticación.
   * Actualiza isAuthenticated y marca que la verificación se ha completado.
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  /**
   * useEffect: Simula una demora (splash) de 2 segundos.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedDelayCompleted(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * useEffect: Una vez completados la verificación de autenticación y la demora del splash,
   * se establece la pantalla inicial: "CameraCaptureScreen" si el usuario está autenticado,
   * o "LoginScreen" en caso contrario.
   */
  useEffect(() => {
    if (authChecked && simulatedDelayCompleted) {
      setCurrentScreen(isAuthenticated ? "CameraCaptureScreen" : "LoginScreen");
    }
  }, [authChecked, simulatedDelayCompleted, isAuthenticated]);

  // Mientras no se defina la pantalla actual, se muestra el splash.
  if (currentScreen === null) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png")}
          style={styles.splashImage}
        />
      </View>
    );
  }

  // Selecciona el componente de pantalla correspondiente según el estado actual.
  const ScreenComponent = SCREENS[currentScreen] || SCREENS["LoginScreen"];

  // Define si se debe mostrar la barra de pestañas según la pantalla actual.
  const shouldShowTab = [
    "CameraCaptureScreen",
    "ChatScreen",
    "SocialNetScreen",
    "ProfileScreen",
  ].includes(currentScreen);

  return (
    <View style={{ flex: 1 }}>
      {/* Renderiza la pantalla principal */}
      <View style={{ flex: 1 }}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </View>
      {/* Renderiza la barra de navegación inferior si corresponde */}
      {shouldShowTab && (
        <MyTab setCurrentScreen={setCurrentScreen} currentScreen={currentScreen} />
      )}
    </View>
  );
}

/**
 * Estilos para el Splash Screen.
 */
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  splashImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MyTab from "@/Components/MyTab";
import registerNNPushToken from "native-notify";
import "../global.css";
import { subscribeToAuthChanges } from "@/api/firebaseService";

/**
 * Mapeo de nombres de pantalla a sus respectivos componentes.
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

export default function Index() {
  // Registro de notificaciones push
  registerNNPushToken(27248, "g7bm81eIUEY0Mmtod4FmYb");

  // Estados para autenticación y verificación de recursos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [simulatedDelayCompleted, setSimulatedDelayCompleted] = useState(false);

  // Estado para controlar la pantalla actual; se inicia en null para no renderizar ninguna pantalla hasta tener la información
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  /**
   * useEffect: Escucha cambios en la autenticación.
   * Cuando se detecta el estado del usuario, se actualizan isAuthenticated y authChecked.
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  /**
   * useEffect: Simula una demora de 2 segundos para mostrar el splash.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedDelayCompleted(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * useEffect: Una vez completada la verificación de autenticación y la simulación,
   * se establece la pantalla inicial de forma definitiva.
   */
  useEffect(() => {
    if (authChecked && simulatedDelayCompleted) {
      setCurrentScreen(isAuthenticated ? "CameraCaptureScreen" : "LoginScreen");
    }
  }, [authChecked, simulatedDelayCompleted, isAuthenticated]);

  // Mientras currentScreen sea null (es decir, antes de que se complete la verificación y la simulación), se muestra el splash.
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

  // Selecciona el componente de pantalla según el estado actual.
  const ScreenComponent = SCREENS[currentScreen] || SCREENS["LoginScreen"];

  // Determina si se debe mostrar la barra de pestañas.
  const shouldShowTab = [
    "CameraCaptureScreen",
    "ChatScreen",
    "SocialNetScreen",
    "ProfileScreen",
  ].includes(currentScreen);

  return (
    <View style={{ flex: 1 }}>
      {/* Renderiza la pantalla actual */}
      <View style={{ flex: 1 }}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </View>
      {/* Muestra la barra de pestañas si corresponde */}
      {shouldShowTab && (
        <MyTab setCurrentScreen={setCurrentScreen} currentScreen={currentScreen} />
      )}
    </View>
  );
}

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

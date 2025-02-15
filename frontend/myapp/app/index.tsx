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
 * SCREENS
 * -------
 * Mapeo de nombres de pantalla a sus respectivos componentes.
 * Esto permite agregar o modificar pantallas fácilmente sin duplicar la lógica de renderizado.
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
  // Registro de notificaciones push usando Native Notify
  registerNNPushToken(27248, "g7bm81eIUEY0Mmtod4FmYb");

  // Estado para controlar el splash screen
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar la pantalla actual. Se inicia en "LoginScreen" como valor por defecto.
  const [currentScreen, setCurrentScreen] = useState("LoginScreen");

  // Estado que indica si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * useEffect - onAuthStateChanged
   * ------------------------------
   * Escucha los cambios en la autenticación.
   * Si hay un usuario autenticado, se cambia la pantalla a "CameraCaptureScreen".
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

   /**
   * Simula una carga inicial (o inicialización de recursos) durante 2 segundos.
   * Al finalizar, se oculta el splash y se muestra la app.
   */
    useEffect(() => {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          setCurrentScreen("CameraCaptureScreen");
        }
        setIsLoading(false);
      }, 2000); // 2 segundos de splash
      return () => clearTimeout(timer);
    }, [isAuthenticated]);

    // Mientras isLoading es true, se muestra el splash personalizado.
    if (isLoading) {
      return (
        <View style={styles.splashContainer}>
          <Image
            source={require("@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png")}
            style={styles.splashImage}
          />
        </View>
      );
    }

  /**
   * renderScreen
   * ------------
   * Selecciona el componente de pantalla basado en el estado actual.
   * Si currentScreen no se corresponde a ninguna clave en SCREENS, se renderiza LoginScreen.
   */
  const ScreenComponent =
    SCREENS[currentScreen] || SCREENS["LoginScreen"];

  /**
   * shouldShowTab
   * -------------
   * Determina si se debe mostrar la barra de pestañas.
   * Solo se muestra en pantallas específicas.
   */
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
      {/* Muestra la barra de pestañas si la pantalla actual lo permite */}
      {shouldShowTab && (
        <MyTab
          setCurrentScreen={setCurrentScreen}
          currentScreen={currentScreen}
        />
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
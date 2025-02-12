import React, { useEffect, useState } from "react";
import { View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MyTab from "@/Components/MyTab";
import registerNNPushToken from "native-notify";
import { auth } from "@/Config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import "../global.css";

export default function Index() {
  // Registro de push notifications (Native Notify)
  registerNNPushToken(27248, "g7bm81eIUEY0Mmtod4FmYb");

  // Estado para la pantalla actual
  const [currentScreen, setCurrentScreen] = useState("");

  // Hook para detectar cambios en el estado de autenticación.
  // Si el usuario está autenticado, se establece la pantalla de cámara como inicial.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentScreen("CameraCaptureScreen");
      }
    });
    return () => unsubscribe();
  }, []);

  // Función que renderiza la pantalla según el estado actual
  const renderScreen = () => {
    switch (currentScreen) {
      case "LoginScreen":
        return <LoginScreen setCurrentScreen={setCurrentScreen} />;
      case "RegisterScreen":
        return <RegisterScreen setCurrentScreen={setCurrentScreen} />;
      case "AccountRecoveryScreen":
        return <AccountRecoveryScreen setCurrentScreen={setCurrentScreen} />;
      case "CameraCaptureScreen":
        return <CameraCaptureScreen setCurrentScreen={setCurrentScreen} />;
      case "ChatScreen":
        return <ChatScreen setCurrentScreen={setCurrentScreen} />;
      case "SocialNetScreen":
        return <SocialNetScreen setCurrentScreen={setCurrentScreen} />;
      case "ProfileScreen":
        return <ProfileScreen setCurrentScreen={setCurrentScreen} />;
      default:
        return <LoginScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  // La barra de pestañas se muestra solo en ciertas pantallas
  const shouldShowTab = [
    "CameraCaptureScreen",
    "ChatScreen",
    "SocialNetScreen",
    "ProfileScreen",
  ].includes(currentScreen);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {shouldShowTab && (
        <MyTab
          setCurrentScreen={setCurrentScreen}
          currentScreen={currentScreen}
        />
      )}
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import { auth } from '@/Config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";
import "../global.css";
import MyTab from "@/Components/MyTab"; // Importamos MyTab
import registerNNPushToken from 'native-notify'; // for push notifications
import "../global.css"
import SocialNet from "./screens/SocialNetScreen";

export default function Index() {
  registerNNPushToken(27248, 'g7bm81eIUEY0Mmtod4FmYb'); // Native Notify appId & appToken
  const [currentScreen, setCurrentScreen] = useState("LoginScreen");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setIsAuthenticated(true);
          setCurrentScreen('CameraCaptureScreen');
        }
      } catch (error) {
        console.error("Error al recuperar la sesión:", error);
      }
      setCheckingAuth(false);
    };

    checkSession();

    // Verifica si hay una sesión activa en Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentScreen('CameraCaptureScreen');
        await AsyncStorage.setItem('user', JSON.stringify(user)); // Guardar sesión
      } else {
        setIsAuthenticated(false);
        setCurrentScreen("LoginScreen");
        await AsyncStorage.removeItem('user'); // Eliminar sesión
      }
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  const renderScreen = () => {
    if (!isAuthenticated) {
      switch (currentScreen) {
        case "LoginScreen":
          return <LoginScreen setCurrentScreen={setCurrentScreen} />;
        case "RegisterScreen":
          return <RegisterScreen setCurrentScreen={setCurrentScreen} />;
        case "AccountRecoveryScreen":
          return <AccountRecoveryScreen setCurrentScreen={setCurrentScreen} />;
        default:
          return <LoginScreen setCurrentScreen={setCurrentScreen} />;
      }
    } else {
      switch (currentScreen) {
        case "CameraCaptureScreen":
          return <CameraCaptureScreen setCurrentScreen={setCurrentScreen} />;
        case "ChatScreen":
          return <ChatScreen setCurrentScreen={setCurrentScreen} />;
        case "SocialNetScreen":
          return <SocialNetScreen setCurrentScreen={setCurrentScreen} />;
        case "ProfileScreen":
          return <ProfileScreen setCurrentScreen={setCurrentScreen} />;
        default:
          return <CameraCaptureScreen setCurrentScreen={setCurrentScreen} />;
      }
    }
  };

  // Solo mostrar MyTab si hay una sesión activa y estamos en ciertas pantallas
  const shouldShowTab = isAuthenticated && ["CameraCaptureScreen", "ChatScreen", "SocialNetScreen", "ProfileScreen"].includes(currentScreen);

  if (checkingAuth) {
    return <View />; // Se podría agregar un indicador de carga aquí
  }


  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      {/* Renderizamos MyTab solo si debe mostrarse */}
      {shouldShowTab && <MyTab setCurrentScreen={setCurrentScreen} currentScreen={currentScreen} />}
    </View>
  );
}

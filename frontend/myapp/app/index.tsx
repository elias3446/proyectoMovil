import React, { useState } from "react";
import { View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import MyTab from "@/Components/MyTab"; // Importamos MyTab
import registerNNPushToken from 'native-notify'; // for push notifications
import "../global.css"
import SocialNet from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";

export default function Index() {
  registerNNPushToken(27248, 'g7bm81eIUEY0Mmtod4FmYb'); // Native Notify appId & appToken
  const [currentScreen, setCurrentScreen] = useState("LoginScreen");

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
        return <SocialNet setCurrentScreen={setCurrentScreen} />;
      case "ProfileScreen":
        return <ProfileScreen setCurrentScreen={setCurrentScreen} />;
      default:
        return <LoginScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  // Solo mostrar MyTab si estamos en las pantallas correctas (CameraCaptureScreen y ChatScreen)
  const shouldShowTab = ["CameraCaptureScreen", "ChatScreen", "SocialNetScreen", "ProfileScreen"].includes(currentScreen);

  return (
    <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      {/* Renderizamos MyTab solo si debe mostrarse */}
      {shouldShowTab && <MyTab setCurrentScreen={setCurrentScreen} currentScreen={currentScreen} />}
      {/* Renderizamos la pantalla activa */}
  
    </View>
  );
}

import React, { useState } from "react";
import { View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";

import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";
import "../global.css";
import MyTab from "@/Components/MyTab"; // Importamos MyTab


export default function Index() {
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

        return <ChatScreen setCurrentScreen={setCurrentScreen}/>;
      case "SocialNetScreen":
        return <SocialNetScreen setCurrentScreen={setCurrentScreen} />;
        case "ProfileScreen":
          return <ProfileScreen setCurrentScreen={setCurrentScreen}/>;

      default:
        return <LoginScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  // Solo mostrar MyTab si estamos en las pantallas correctas (CameraCaptureScreen y ChatScreen)
  const shouldShowTab = ["CameraCaptureScreen", "ChatScreen"].includes(currentScreen);

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

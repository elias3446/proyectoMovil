import React, { useState } from "react";
import { View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AccountRecoveryScreen from "./screens/AccountRecoveryScreen";
import CameraCaptureScreen from "./screens/CameraCaptureScreen";
import ChatScreen from "./screens/ChatScreen";
import SocialNetScreen from "./screens/SocialNetScreen";
import ProfileScreen from "./screens/ProfileScreen";

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState("LoginScreen");
  const [userId, setUserId] = useState(""); // Estado para guardar el ID del usuario

  const renderScreen = () => {
    switch (currentScreen) {
      case "LoginScreen":
        return <LoginScreen setCurrentScreen={setCurrentScreen}/>;
      case "RegisterScreen":
        return <RegisterScreen setCurrentScreen={setCurrentScreen} />;
      case "AccountRecoveryScreen":
        return <AccountRecoveryScreen setCurrentScreen={setCurrentScreen} />;
      case "CameraCaptureScreen":
        return <CameraCaptureScreen setCurrentScreen={setCurrentScreen}/>;
      case "ChatScreen":
        return <ChatScreen setCurrentScreen={setCurrentScreen}/>;
      case "SocialNetScreen":
        return <SocialNetScreen setCurrentScreen={setCurrentScreen} />;
        case "ProfileScreen":
        return <ProfileScreen setCurrentScreen={setCurrentScreen}/>;
      default:
        return <LoginScreen setCurrentScreen={setCurrentScreen}/>;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}

import React, { useState } from "react";
import { View, Text } from "react-native";
import Login from "./screens/Login";
import Register from "./screens/Register";
import AccountRecovery from "./screens/AccountRecovery";
import CameraCapture from "./screens/CameraCapture";
import Chat from "./screens/Chat";

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState("Login");

  const renderScreen = () => {
    switch (currentScreen) {
      case "Login":
        return <Login setCurrentScreen={setCurrentScreen} />;
      case "Register":
        return <Register setCurrentScreen={setCurrentScreen} />;
      case "AccountRecovery":
        return <AccountRecovery setCurrentScreen={setCurrentScreen} />;
      case "CameraCapture":
        return <CameraCapture setCurrentScreen={setCurrentScreen} />;
      case "Chat":
        return <Chat setCurrentScreen={setCurrentScreen} />;
      default:
        return <Login setCurrentScreen={setCurrentScreen} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
    </View>
  );
}

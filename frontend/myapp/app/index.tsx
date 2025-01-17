import React, { useEffect } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import LoginScreen from "./screens/LoginScreen";  // Importa tu pantalla de login
import RegisterScreen from "./screens/RegisterScreen";  // Importa tu pantalla de registro

export default function Index() {
  useEffect(() => {
    async function prepare() {
      try {
        // Mantén la pantalla de bienvenida visible mientras se carga la aplicación
        await SplashScreen.preventAutoHideAsync();
        // Simula una tarea de carga (por ejemplo, cargar datos)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Oculta la pantalla de bienvenida una vez que la aplicación esté lista
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Puedes mostrar la pantalla de Login o Register directamente aquí */}
      <LoginScreen />
      {/* O mostrar RegisterScreen según la lógica de tu aplicación */}
      {/* <RegisterScreen /> */}
    </View>
  );
}

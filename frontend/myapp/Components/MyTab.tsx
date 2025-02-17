import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

/**
 * Props para el componente MyTab.
 */
interface MyTabProps {
  /** Función para cambiar la pantalla actual */
  setCurrentScreen: (screen: string) => void;
  /** Pantalla actualmente activa */
  currentScreen: string;
}

/**
 * MyTab:
 * Componente que renderiza una barra de navegación inferior con íconos.
 * Cada ícono cambia de color cuando la pantalla asociada está activa.
 */
const MyTab: React.FC<MyTabProps> = ({ setCurrentScreen, currentScreen }) => {
  // Arreglo de pestañas con sus propiedades: nombre de pantalla, ícono y etiqueta de accesibilidad.
  const tabs = [
    { screen: "CameraCaptureScreen", icon: "camera", accessibilityLabel: "Cámara" },
    { screen: "ChatScreen", icon: "robot", accessibilityLabel: "Chat" },
    { screen: "SocialNetScreen", icon: "earth", accessibilityLabel: "Red Social" },
    { screen: "ProfileScreen", icon: "account-circle", accessibilityLabel: "Perfil" },
  ];

  /**
   * handleTabPress:
   * Cambia la pantalla actual al presionar un botón.
   * @param screen - Nombre de la pantalla a activar.
   */
  const handleTabPress = (screen: string): void => {
    setCurrentScreen(screen);
  };

  /**
   * getIconColor:
   * Retorna el color del ícono dependiendo de si la pantalla está activa.
   * @param screen - Nombre de la pantalla asociada al ícono.
   * @returns Color en formato hexadecimal.
   */
  const getIconColor = (screen: string): string => {
    return currentScreen === screen ? "#5cb868" : "#616161";
  };

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.screen}
          style={styles.tabButton}
          onPress={() => handleTabPress(tab.screen)}
          accessible
          accessibilityLabel={tab.accessibilityLabel}
          accessibilityRole="button"
        >
          <Icon name={tab.icon} size={30} color={getIconColor(tab.screen)} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Estilos para el componente MyTab.
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
  },
  tabButton: {
    alignItems: "center",
    padding: 12,
  },
});

export default memo(MyTab);

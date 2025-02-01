import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MyTabProps {
  setCurrentScreen: (screen: string) => void;
  currentScreen: string;
}

const MyTab: React.FC<MyTabProps> = ({ setCurrentScreen, currentScreen }) => {

  // Cambiar pantalla al presionar un ícono
  const handleTabPress = (screen: string) => {
    setCurrentScreen(screen);  // Cambiar la pantalla activa
  };

  // Función para determinar el color del ícono basado en la pantalla activa
  const getIconColor = (screen: string) => {
    return currentScreen === screen ? '#5cb868' : '#616161'; // Verde si está activo, neutro 600 si no
  };

  return (
    <View style={styles.tabContainer}>
      {/* Icono de la cámara */}
      <TouchableOpacity onPress={() => handleTabPress('CameraCaptureScreen')} style={styles.tab}>
        <Icon name="camera" size={30} color={getIconColor('CameraCaptureScreen')} />
      </TouchableOpacity>

      {/* Icono del bot */}
      <TouchableOpacity onPress={() => handleTabPress('ChatScreen')} style={styles.tab}>
        <Icon name="robot" size={30} color={getIconColor('ChatScreen')} />
      </TouchableOpacity>

      {/* Icono del mundo */}
      <TouchableOpacity onPress={() => handleTabPress('WorldScreen')} style={styles.tab}>
        <Icon name="earth" size={30} color={getIconColor('WorldScreen')} />
      </TouchableOpacity>

      {/* Icono del usuario */}
      <TouchableOpacity onPress={() => handleTabPress('ProfileScreen')} style={styles.tab}>
        <Icon name="account-circle" size={30} color={getIconColor('ProfileScreen')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#FFFFFF', // Cambiado al fondo del LoginScreen
    paddingTop: 10, 
    paddingBottom: 10,
  },
  tab: {
    alignItems: 'center', // Centra los íconos
    padding: 10,
  },
});

export default MyTab;

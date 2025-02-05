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
    <View className='flex-row justify-around bg-white py-3'>
      {/* Icono de la cámara */}
      <TouchableOpacity className='items-center p-3' onPress={() => handleTabPress('CameraCaptureScreen')}>
        <Icon name="camera" size={30} color={getIconColor('CameraCaptureScreen')} />
      </TouchableOpacity>

      {/* Icono del bot */}
      <TouchableOpacity className='items-center p-3' onPress={() => handleTabPress('ChatScreen')}>
        <Icon name="robot" size={30} color={getIconColor('ChatScreen')} />
      </TouchableOpacity>

      {/* Icono del mundo */}
      <TouchableOpacity className='items-center p-3' onPress={() => handleTabPress('WorldScreen')}>
        <Icon name="earth" size={30} color={getIconColor('WorldScreen')} />
      </TouchableOpacity>

      {/* Icono del usuario */}
      <TouchableOpacity className='items-center p-3' onPress={() => handleTabPress('ProfileScreen')}>
        <Icon name="account-circle" size={30} color={getIconColor('ProfileScreen')} />
      </TouchableOpacity>
    </View>
  );
};

export default MyTab;

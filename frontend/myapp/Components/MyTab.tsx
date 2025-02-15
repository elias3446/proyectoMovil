import React, { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MyTabProps {
  setCurrentScreen: (screen: string) => void;
  currentScreen: string;
}

const MyTab: React.FC<MyTabProps> = ({ setCurrentScreen, currentScreen }) => {
  // Arreglo de pestañas con sus propiedades
  const tabs = [
    {
      screen: 'CameraCaptureScreen',
      icon: 'camera',
      accessibilityLabel: 'Cámara',
    },
    {
      screen: 'ChatScreen',
      icon: 'robot',
      accessibilityLabel: 'Chat',
    },
    {
      screen: 'SocialNetScreen',
      icon: 'earth',
      accessibilityLabel: 'Red Social',
    },
    {
      screen: 'ProfileScreen',
      icon: 'account-circle',
      accessibilityLabel: 'Perfil',
    },
  ];

  // Cambia la pantalla actual al presionar un ícono
  const handleTabPress = (screen: string) => {
    setCurrentScreen(screen);
  };

  // Determina el color del ícono según si es la pantalla activa
  const getIconColor = (screen: string) => {
    return currentScreen === screen ? '#5cb868' : '#616161';
  };

  return (
    <View className="flex-row justify-around bg-white py-3">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.screen}
          className="items-center p-3"
          onPress={() => handleTabPress(tab.screen)}
          accessible={true}
          accessibilityLabel={tab.accessibilityLabel}
          accessibilityRole="button"
        >
          <Icon name={tab.icon} size={30} color={getIconColor(tab.screen)} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(MyTab);

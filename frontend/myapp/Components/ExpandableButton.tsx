import React, { useRef, useEffect } from "react";
import { TouchableOpacity, Animated, View, Text } from "react-native";

/**
 * Props para el componente ExpandableButton.
 */
interface ExpandableButtonProps {
  /** Identificador único del botón */
  id: number;
  /** Texto que se muestra cuando el botón está activo */
  text: string;
  /** Componente de ícono a renderizar */
  IconComponent: React.ElementType;
  /** Nombre del ícono a usar en el componente de ícono */
  iconName: string;
  /** Identificador del botón activo actualmente */
  activeId: number | null;
  /** Función para establecer el botón activo */
  setActiveId: (id: number) => void;
  /** Función a ejecutar al presionar el botón */
  onPress: (id: number) => void;
}

/**
 * ExpandableButton:
 * Componente que muestra un botón animado que expande su ancho cuando está activo para mostrar texto adicional.
 * Se utiliza para opciones de navegación o acciones en la interfaz.
 */
const ExpandableButton: React.FC<ExpandableButtonProps> = ({
  id,
  text,
  IconComponent,
  iconName,
  activeId,
  setActiveId,
  onPress,
}) => {
  // Determina si este botón está activo comparando su id con el activeId.
  const isActive = activeId === id;

  // Valor animado para el ancho del botón: 175 si activo, 55 si no.
  const widthAnim = useRef(new Animated.Value(isActive ? 175 : 55)).current;

  /**
   * useEffect: Anima el ancho del botón cada vez que cambia el estado activo.
   * Se utiliza Animated.timing para suavizar la transición.
   */
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isActive ? 175 : 55,
      duration: 300,
      useNativeDriver: false, // El ancho no es soportado por el native driver.
    }).start();
  }, [isActive, widthAnim]);

  /**
   * handlePress:
   * Maneja el evento de presionar el botón. Si el botón no está activo, lo establece como activo
   * y luego ejecuta la función onPress pasada como prop.
   */
  const handlePress = () => {
    if (!isActive) {
      setActiveId(id);
    }
    onPress(id);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 16,
            height: 48,
            overflow: "hidden",
            width: widthAnim,
            backgroundColor: isActive ? "#5CB868" : "#F3F4F6",
          },
        ]}
      >
        {/* Contenedor del ícono */}
        <View style={{ width: 32, justifyContent: "flex-start" }}>
          <IconComponent name={iconName} size={24} color={isActive ? "#fff" : "#5CB868"} />
        </View>
        {/* Se muestra el texto solo si el botón está activo */}
        {isActive && (
          <Animated.Text
            style={{
              color: "#fff",
              fontSize: 16,
              marginLeft: 16,
              position: "absolute",
              left: 40,
              opacity: widthAnim.interpolate({
                inputRange: [50, 180],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            {text}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ExpandableButton;

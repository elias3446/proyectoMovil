import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Propiedades que recibe el componente NotificationBanner.
 * @property {string} message - El mensaje a mostrar en la notificación.
 * @property {'error' | 'success' | 'info' | 'warning'} [type] - Tipo de notificación, que determina el estilo. Valor por defecto es 'info'.
 */
interface NotificationBannerProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
}

/**
 * NotificationBanner:
 * Componente funcional que muestra un banner de notificación en la parte inferior de la pantalla.
 * Se utiliza para informar al usuario de errores, éxitos, avisos o información.
 *
 * @param {NotificationBannerProps} props - Propiedades del componente.
 * @returns {JSX.Element | null} - Renderiza el banner si hay un mensaje; de lo contrario, no renderiza nada.
 */
const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, type = 'info' }) => {
  // Si no hay mensaje, no se renderiza nada.
  if (!message) return null;

  // Se definen estilos específicos para cada tipo de notificación.
  const typeStyles = {
    error: styles.error,
    success: styles.success,
    info: styles.info,
    warning: styles.warning,
  };

  return (
    <View style={[styles.notification, typeStyles[type]]}>
      <Text style={styles.notificationText}>{message}</Text>
    </View>
  );
};

/**
 * Estilos del componente NotificationBanner.
 */
const styles = StyleSheet.create({
  // Contenedor del banner, posicionado de forma absoluta en la parte inferior de la pantalla.
  notification: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  // Estilo para el tipo de notificación "error".
  error: {
    backgroundColor: "#ff4d4f",
  },
  // Estilo para el tipo de notificación "success".
  success: {
    backgroundColor: "#52c41a",
  },
  // Estilo para el tipo de notificación "info".
  info: {
    backgroundColor: "#1890ff",
  },
  // Estilo para el tipo de notificación "warning".
  warning: {
    backgroundColor: "#faad14",
  },
  // Estilo del texto del banner.
  notificationText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

export default NotificationBanner;

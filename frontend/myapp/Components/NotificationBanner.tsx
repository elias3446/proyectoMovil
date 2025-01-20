import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBanner {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
}

const NotificationBanner: React.FC<NotificationBanner> = ({ message, type = 'info' }) => {
  if (!message) return null;

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

const styles = StyleSheet.create({
  notification: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  error: {
    backgroundColor: "#ff4d4f",
  },
  success: {
    backgroundColor: "#52c41a",
  },
  info: {
    backgroundColor: "#1890ff",
  },
  warning: {
    backgroundColor: "#faad14",
  },
  notificationText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

export default NotificationBanner;
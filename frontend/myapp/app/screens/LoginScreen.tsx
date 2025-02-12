// LoginScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBanner from '@/Components/NotificationBanner';
// Importamos la función loginUser del servicio
import { loginUser } from "@/api/firebaseService";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

type NotificationType = 'error' | 'success';

interface NotificationState {
  message: string;
  type: NotificationType | null;
}

const LoginScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: null,
  });
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  // Ref para el input de contraseña (para gestionar el enfoque)
  const passwordInputRef = useRef<TextInput>(null);

  // Función para limpiar notificaciones después de 3 segundos
  const clearNotification = useCallback(() => {
    setNotification({ message: '', type: null });
  }, []);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(clearNotification, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Validación básica del formato de correo
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Alterna la visibilidad de la contraseña
  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((prev) => !prev);
  }, []);

  // Función para mapear el código de error a un mensaje legible
  const getErrorMessage = useCallback((error: any): string => {
    let message = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.';
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'El formato del correo electrónico es incorrecto.';
          break;
        case 'auth/user-disabled':
          message = 'Esta cuenta ha sido deshabilitada. Contacta con soporte si crees que es un error.';
          break;
        case 'auth/user-not-found':
          message = 'No encontramos una cuenta con ese correo. ¿Deseas registrarte?';
          break;
        case 'auth/wrong-password':
          message = 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.';
          break;
        default:
          message = 'Ocurrió un error inesperado. Por favor, revisa tus datos o inténtalo de nuevo más tarde.';
      }
    }
    return message;
  }, []);

  // Función para iniciar sesión
  const handleLogin = useCallback(async () => {
    // Oculta el teclado
    Keyboard.dismiss();
    clearNotification();

    if (!email.trim() || !password) {
      setNotification({ message: 'Por favor, completa ambos campos.', type: 'error' });
      return;
    }

    if (!validateEmail(email)) {
      setNotification({ message: 'Por favor, ingresa un correo válido.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      setNotification({ message: 'Inicio de sesión exitoso', type: 'success' });
      // Se espera un instante para mostrar el mensaje de éxito antes de cambiar de pantalla
      setTimeout(() => {
        setCurrentScreen('CameraCaptureScreen');
      }, 500);
    } catch (error: any) {
      setNotification({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [email, password, clearNotification, validateEmail, getErrorMessage, setCurrentScreen]);

  // Permite pasar del input de correo al de contraseña
  const onEmailSubmitEditing = useCallback(() => {
    passwordInputRef.current?.focus();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View className="flex-1 w-full max-w-[25rem] bg-white justify-center items-center mt-10 px-5">
            <Image
              source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

            {/* Campo de correo electrónico */}
            <View className="w-full mb-4">
              <Text className="font-bold text-left mb-1 text-black text-lg">Correo Electrónico</Text>
              <View className="w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative">
                <Ionicons className="absolute left-3 z-20" name="mail-outline" size={24} color="black" />
                <TextInput
                  className="flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0"
                  placeholder="Ingresa tu correo"
                  placeholderTextColor="gray"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                  onSubmitEditing={onEmailSubmitEditing}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Campo de contraseña */}
            <View className="w-full mb-4">
              <Text className="font-bold text-left mb-1 text-black text-lg">Contraseña</Text>
              <View className="w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative">
                <Ionicons className="absolute left-3 z-20" name="lock-closed-outline" size={24} color="black" />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0"
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="gray"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  className="absolute items-center right-4 z-20"
                  onPress={togglePasswordVisibility}
                  accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Enlace para recuperar contraseña */}
            <View className="w-full items-end mb-5">
              <TouchableOpacity onPress={() => setCurrentScreen('AccountRecoveryScreen')}>
                <Text className="text-[#5CB868]">¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón para iniciar sesión */}
            <TouchableOpacity
              className="w-full h-12 bg-[#5CB868] justify-center items-center rounded-xl mb-5"
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="font-bold text-white text-lg">Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            {/* Enlace para registrarse */}
            <TouchableOpacity onPress={() => setCurrentScreen('RegisterScreen')}>
              <Text className="text-base text-center mt-7 text-black">
                ¿No tienes cuenta? <Text className="font-bold text-[#5CB868]">Registrarse</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notificaciones */}
          {notification.message !== '' && notification.type && (
            <NotificationBanner message={notification.message} type={notification.type} />
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoImage: {
    width: '60%',
    aspectRatio: 1,
    marginBottom: -30,
  },
});

export default LoginScreen;

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
// Importamos la función loginUser del servicio de Firebase
import { loginUser } from "@/api/firebaseService";

/* =====================================================
   =============== COMPONENTE REUTILIZABLE ==============
   ===================================================== */

/**
 * Props para el componente IconInputField.
 */
interface IconInputFieldProps {
  label: string;
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
  rightComponent?: React.ReactNode;
}

/**
 * Componente de entrada con ícono (usado para correo y contraseña).
 * Renderiza una etiqueta, un ícono a la izquierda y un TextInput.
 * Permite inyectar un componente adicional (por ejemplo, para alternar la visibilidad de la contraseña).
 */
const IconInputField: React.FC<IconInputFieldProps> = ({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = true,
  secureTextEntry = false,
  returnKeyType = 'done',
  onSubmitEditing,
  inputRef,
  rightComponent,
}) => {
  return (
    <View className="w-full mb-4">
      <Text className="font-bold text-left mb-1 text-black text-lg">{label}</Text>
      <View className="w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative">
        <Ionicons className="absolute left-3 z-20" name={iconName as keyof typeof Ionicons.glyphMap} size={24} color="black" />
        <TextInput
          ref={inputRef}
          className="flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0"
          placeholder={placeholder}
          placeholderTextColor="gray"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          value={value}
          onChangeText={onChangeText}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={false}
        />
        {rightComponent}
      </View>
    </View>
  );
};

/* =====================================================
   =============== PANTALLA DE LOGIN ===================
   ===================================================== */

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

type NotificationType = 'error' | 'success';

interface NotificationState {
  message: string;
  type: NotificationType | null;
}

const LoginScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  /*** Estados para datos de formulario y carga ***/
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

  // Limpia la notificación después de 3 segundos
  const clearNotification = useCallback(() => {
    setNotification({ message: '', type: null });
  }, []);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(clearNotification, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Valida el formato del correo electrónico
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Alterna la visibilidad de la contraseña
  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible(prev => !prev);
  }, []);

  // Mapea el código de error a un mensaje legible
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

  /**
   * Función que se ejecuta al presionar el botón de iniciar sesión.
   * Realiza validaciones básicas y llama al servicio loginUser.
   */
  const handleLogin = useCallback(async () => {
    // Oculta el teclado y limpia notificaciones previas
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
      // Espera un instante para mostrar el mensaje de éxito antes de cambiar de pantalla
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

            {/* Campo para correo electrónico */}
            <IconInputField
              label="Correo Electrónico"
              iconName="mail-outline"
              placeholder="Ingresa tu correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={onEmailSubmitEditing}
            />

            {/* Campo para contraseña con botón para alternar visibilidad */}
            <IconInputField
              label="Contraseña"
              iconName="lock-closed-outline"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              inputRef={passwordInputRef}
              // Componente derecho: botón para mostrar/ocultar contraseña
              rightComponent={
                <TouchableOpacity
                  className="absolute items-center right-4 z-20"
                  onPress={togglePasswordVisibility}
                  accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
                </TouchableOpacity>
              }
            />

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

            {/* Enlace para ir a la pantalla de registro */}
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

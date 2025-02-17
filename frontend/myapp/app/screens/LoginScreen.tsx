import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/Config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import NotificationBanner from '@/Components/NotificationBanner';
import { registerIndieID } from 'native-notify';
import { APP_ID, APP_TOKEN } from '@/api/notificationService';
import { styles } from '@/assets/styles/LoginStyles'; // Asegúrate de ajustar la ruta según corresponda

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
    let timer: NodeJS.Timeout;
    if (notification.message) {
      timer = setTimeout(clearNotification, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification, clearNotification]);

  // Validación básica del formato de correo
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Alterna la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async () => {
    // Oculta el teclado (en web no afecta)
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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setNotification({ message: 'Inicio de sesión exitoso', type: 'success' });

      // Registro para notificaciones solo en dispositivos móviles (Android/iOS)
      if (Platform.OS !== 'web') {
        registerIndieID(userCredential.user.uid, APP_ID, APP_TOKEN);
      } else {
        console.log('Registro de notificaciones omitido en web');
      }

      // Se espera un instante para mostrar el mensaje de éxito antes de cambiar de pantalla
      setTimeout(() => {
        setCurrentScreen('CameraCaptureScreen');
      }, 500);
    } catch (error: any) {
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
      setNotification({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Permite pasar del input de correo al de contraseña
  const onEmailSubmitEditing = () => {
    passwordInputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View className={styles.mainContainer}>
          <Image
            source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
            style={localStyles.logoImage}
            resizeMode="contain"
          />

          {/* Campo de correo electrónico */}
          <View className={styles.emailFieldContainer}>
            <Text className={styles.emailLabel}>Correo Electrónico</Text>
            <View className={styles.emailInputContainer}>
              <Ionicons className={styles.emailIcon} name="mail-outline" size={24} color="black" />
              <TextInput
                className={styles.emailInput}
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
          <View className={styles.passwordFieldContainer}>
            <Text className={styles.passwordLabel}>Contraseña</Text>
            <View className={styles.passwordInputContainer}>
              <Ionicons className={styles.passwordIcon} name="lock-closed-outline" size={24} color="black" />
              <TextInput
                ref={passwordInputRef}
                className={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="gray"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                className={styles.passwordToggleButton}
                onPress={togglePasswordVisibility}
                accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Enlace para recuperar contraseña */}
          <View className={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => setCurrentScreen('AccountRecoveryScreen')}>
              <Text className={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Botón para iniciar sesión */}
          <TouchableOpacity
            className={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text className={styles.loginButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Enlace para registrarse */}
          <TouchableOpacity onPress={() => setCurrentScreen('RegisterScreen')}>
            <Text className={styles.registerText}>
              ¿No tienes cuenta? <Text className={styles.registerTextHighlight}>Registrarse</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notificaciones */}
      {notification.message !== '' && notification.type && (
        <NotificationBanner message={notification.message} type={notification.type} />
      )}
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
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

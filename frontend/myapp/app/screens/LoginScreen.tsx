import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/Config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import NotificationBanner from '@/Components/NotificationBanner';
import { registerIndieID } from 'native-notify';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  // Alterna la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor, completa ambos campos.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage('Inicio de sesión exitoso');
      // Registro para notificaciones
      registerIndieID(userCredential.user.uid, 27248, 'g7bm81eIUEY0Mmtod4FmYb');
      setCurrentScreen('CameraCaptureScreen');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message || 'Credenciales incorrectas o problema de red.');
      } else {
        setErrorMessage('Credenciales incorrectas o problema de red.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Limpia los mensajes de error/exito después de 3 segundos
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Campo de contraseña */}
          <View className="w-full mb-4">
            <Text className="font-bold text-left mb-1 text-black text-lg">Contraseña</Text>
            <View className="w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative">
              <Ionicons className="absolute left-3 z-20" name="lock-closed-outline" size={24} color="black" />
              <TextInput
                className="flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0"
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="gray"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
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
          >
            <Text className="font-bold text-white text-lg">
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          {/* Enlace para registrarse */}
          <TouchableOpacity onPress={() => setCurrentScreen('RegisterScreen')}>
            <Text className="text-base text-center mt-7 text-black">
              ¿No tienes cuenta? <Text className="font-bold text-[#5CB868]">Registrarse</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notificaciones */}
      {errorMessage !== '' && <NotificationBanner message={errorMessage} type="error" />}
      {successMessage !== '' && <NotificationBanner message={successMessage} type="success" />}
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

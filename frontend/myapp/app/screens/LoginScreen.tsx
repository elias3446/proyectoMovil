import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/Config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import NotificationBanner from '@/Components/NotificationBanner';
import { registerIndieID } from 'native-notify';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (email === '' || password === '') {
      setErrorMessage('Por favor, completa ambos campos.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage('Inicio de sesión exitoso');
      registerIndieID(userCredential.user.uid, 27248, 'g7bm81eIUEY0Mmtod4FmYb');
      setCurrentScreen('CameraCaptureScreen');
    } catch (error: any) {
      setErrorMessage(error.message || 'Credenciales incorrectas o problema de red.');
    } finally {
      setLoading(false);
    }
  };

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
      className='flex-1 bg-white'
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View className='flex-1 w-full max-w-[25rem] bg-wihte justify-center items-center mt-10 px-5'>
        <Image
            source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <View className='w-full mb-4'>
            <Text className='font-bold text-left mb-1 text-black text-lg'>Correo Electrónico</Text>
            <View className='w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative'>
              <Ionicons className='absolute left-3 z-20' name="mail-outline" size={24} color="black" />
              <TextInput
                className='flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0'
                placeholder="Ingresa tu correo"
                placeholderTextColor="gray"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
          </View>

          <View className='w-full mb-4'>
            <Text className='font-bold text-left mb-1 text-black text-lg'>Contraseña</Text>
            <View className='w-full flex-row items-center bg-[#F3F4F6] rounded-xl relative'>
              <Ionicons className='absolute left-3 z-20' name="lock-closed-outline" size={24} color="black" />
              <TextInput
                className='flex-1 h-12 pl-11 pr-12 text-base text-black bg-[#F3F4F6] rounded-xl border-0'
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="gray"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity className='absolute items-center right-4 z-20' onPress={togglePasswordVisibility}>
                <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={24} color="gray" />
              </TouchableOpacity>
            </View>
          </View>

          <View className='w-full items-end mb-5'>
            <TouchableOpacity onPress={() => setCurrentScreen('AccountRecoveryScreen')}>
              <Text className='text-[#5CB868]'>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className='w-full h-12 bg-[#5CB868] justify-center items-center rounded-xl mb-5' onPress={handleLogin} disabled={loading}>
            <Text className='font-bold text-white text-lg'>
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCurrentScreen('RegisterScreen')}>
            <Text className='text-base text-center mt-7 text-black'>
              ¿No tienes cuenta? <Text className='font-bold text-[#5CB868]'>Registrarse</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contenedor: {
    flex: 1,
    width: '100%',
    maxWidth: 401,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
    borderRadius: 16,
  },
  logoImage: {
    width: '60%',
    aspectRatio: 1,
    marginBottom: -30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: 'black',
    marginBottom: 5,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    position: 'relative',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    color: 'black',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 0,
  },
  passwordInput: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 50,
    fontSize: 16,
    color: 'black',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 0,
  },
  icon: {
    position: 'absolute',
    left: 10,
    zIndex: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 10,
    zIndex: 2,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#5CB868',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#5CB868',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 30,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerPrompt: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 30,
  },
  registerText: {
    color: '#5CB868',
    fontWeight: 'bold',
  },
});


export default LoginScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import NotificationBanner from "@/Components/NotificationBanner";
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';  // Importamos los iconos

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const RegisterScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState((new Date()).getFullYear().toString());
  const [gender, setGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [customGender, setCustomGender] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // Estado para mostrar/ocultar la contraseña

  const { width } = Dimensions.get("window");

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !birthDay || !birthMonth || !birthYear || !gender) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }

    if (gender === "O" && !pronoun) {
      setErrorMessage("Por favor, selecciona un pronombre para el género personalizado.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Debes aceptar los Términos y Condiciones.");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const db = getFirestore();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firstName,
        lastName,
        email,
        birthDay,
        birthMonth,
        birthYear,
        gender,
        pronoun: pronoun || (gender === "F" ? "Femenino" : gender === "M" ? "Masculino" : ""),
        customGender,
      };

      await setDoc(doc(db, "users", user.uid), userData);

      setSuccessMessage("Usuario registrado exitosamente.");
      setCurrentScreen("LoginScreen");
    } catch (error: any) {
      setErrorMessage(`Error al registrar: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View className={`w-full p-5 bg-white rounded-xl relative ${width > 400 ? 'max-w-[25rem]' : 'max-w-[calc(100%-40px)]'}`}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
          className="w-3/5 aspect-[1] -mb-10 self-center"
          resizeMode="contain"
        />
        <Text className="font-bold text-2xl text-center mb-5">Crea una cuenta</Text>

        {/* firstname & lastname */}
        <View className="flex-row justify-between mb-3">
          <TextInput
            className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${firstName ? 'text-back' : 'text-[#9CA3AF]'}`}
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${lastName ? 'text-back' : 'text-[#9CA3AF]'}`}
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* birthdate */}
        <Text className="text-base text-black mb-2 font-bold">Fecha de nacimiento</Text>
        <View className="flex-row justify-between mb-3">
          <Picker
            selectedValue={birthDay}
            style={[styles.picker, { borderWidth: 0, width: "33.33%" }]}
            onValueChange={(itemValue) => setBirthDay(itemValue)}
          >
            {[...Array(31).keys()].map((day) => (
              <Picker.Item key={day + 1} label={(day + 1).toString()} value={(day + 1).toString()} />
            ))}
          </Picker>
          <Picker
            selectedValue={birthMonth}
            style={[styles.picker, { borderWidth: 0, width: "33.33%" }]}
            onValueChange={(itemValue) => setBirthMonth(itemValue)}
          >
            {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(
              (month, index) => (
                <Picker.Item key={index} label={month} value={(index + 1).toString()} />
              )
            )}
          </Picker>
          <Picker
            selectedValue={birthYear}
            style={[styles.picker, { borderWidth: 0, width: "33.33%" }]}
            onValueChange={(itemValue) => setBirthYear(itemValue)}
          >
            {[...Array(100).keys()]
              .map((year) => new Date().getFullYear() - year)
              .map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year.toString()} />
              ))}
          </Picker>
        </View>

        {/* Gender */}
        <Text className="text-base text-black mb-2 font-bold">Género</Text>
        <Picker
          selectedValue={gender}
          style={[styles.picker, { borderWidth: 0, width: "100%" }]}
          onValueChange={(itemValue) => {
            setGender(itemValue);
            if (itemValue !== "O") setPronoun(""); // Clear pronoun if not 'Personalizado'
          }}
        >
          <Picker.Item label="Selecciona tu género" value="" />
          <Picker.Item label="Mujer" value="F" />
          <Picker.Item label="Hombre" value="M" />
          <Picker.Item label="Personalizado" value="O" />
        </Picker>

        {gender === "O" && (
          <>
            <Text className="text-base text-black mb-2 font-bold">Selecciona tu pronombre</Text>
            <Picker
              selectedValue={pronoun}
              style={[styles.picker, { borderWidth: 0 }]}
              onValueChange={(itemValue) => setPronoun(itemValue)}
            >
              <Picker.Item label="Selecciona tu pronombre" value="" />
              <Picker.Item label='Femenino: "Salúdala por su cumpleaños"' value="Femenino" />
              <Picker.Item label='Masculino: "Salúdalo por su cumpleaños"' value="Masculino" />
              <Picker.Item label='Neutro: "Salúdalo(a) por su cumpleaños"' value="Neutro" />
            </Picker>
            <Text className="text-xs text-[#666] mb-3">Tu pronombre será visible para todos.</Text>

            <Text className="text-base text-black mb-2 font-bold">Género (opcional)</Text>
            <TextInput
              className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${customGender ? 'text-back' : 'text-[#9CA3AF]'}`}
              placeholder="Escribe tu género"
              value={customGender}
              onChangeText={setCustomGender}
            />
          </>
        )}

        {/* email */}
        <TextInput
          className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${email ? 'text-back' : 'text-[#9CA3AF]'}`}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {/* password */}
        <View className="relative">
          <TextInput
            className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${password ? 'text-back' : 'text-[#9CA3AF]'}`}
            placeholder="Contraseña nueva"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          {/* Contenedor centrado */}
          <View className="absolute z-20 right-4 top-3">
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {/* terms & conditions */}
        <View className="flex-row items-center mb-3">
          <Checkbox
            value={acceptTerms}
            onValueChange={setAcceptTerms}
            className="mr-2"
          />
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-base text-black">
              Acepto los{" "}
              <Text className="text-[#5CB868]" onPress={() => {}}>
                Términos & Condiciones
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="items-center my-3 p-4 rounded-xl bg-[#5CB868]" onPress={handleRegister} disabled={loading}>
          <Text className="text-white font-bold text-lg">{loading ? "Cargando..." : "Registrar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCurrentScreen("LoginScreen")}>
          <Text className="text-black text-center mt-3 text-base">
            <Text className="text-black">¿Ya tienes cuenta?</Text>
            <Text className="text-[#5CB868]"> Iniciar sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginTop: -50, // Ajuste para subir todos los elementos internos
  },
  picker: {
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    color: "#000",
  },
});


export default RegisterScreen;

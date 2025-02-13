// RegisterScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import NotificationBanner from "@/Components/NotificationBanner";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";

// Servicio para registrar usuario en Firebase
import { registerUser } from "@/api/firebaseService";

// Props del componente de registro
interface RegisterScreenProps {
  setCurrentScreen: (screen: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ setCurrentScreen }) => {
  /*** Estados para datos del usuario ***/
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear().toString());
  const [gender, setGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [customGender, setCustomGender] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /*** Estados para mensajes y carga ***/
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { width } = Dimensions.get("window");

  // Limpia mensajes de error o éxito después de 3 segundos
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Helper: Valida formato de correo electrónico
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Función que maneja el registro del usuario
  const handleRegister = useCallback(async () => {
    // Validaciones de campos obligatorios
    if (
      !email.trim() ||
      !password.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !birthDay ||
      !birthMonth ||
      !birthYear ||
      !gender
    ) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage("Ingresa un correo electrónico válido.");
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
      // Llamada al servicio de registro en Firebase
      await registerUser({
        firstName,
        lastName,
        email,
        password,
        birthDay,
        birthMonth,
        birthYear,
        gender,
        pronoun,
        customGender,
      });
      setSuccessMessage("Usuario registrado exitosamente.");
      setCurrentScreen("LoginScreen");
    } catch (error: any) {
      setErrorMessage(error.message || "Error al registrar el usuario.");
      setLoading(false);
    }
  }, [
    email,
    password,
    firstName,
    lastName,
    birthDay,
    birthMonth,
    birthYear,
    gender,
    pronoun,
    customGender,
    acceptTerms,
    setCurrentScreen,
    validateEmail,
  ]);

  /***********************
   * Componentes Modulares
   ***********************/

  /**
   * DateOfBirthPicker: Componente que renderiza los selectores de día, mes y año.
   */
  const DateOfBirthPicker: React.FC = () => {
    // Funciones para generar los ítems de los Pickers
    const renderDayItems = useCallback(() => {
      return [...Array(31).keys()].map((day) => (
        <Picker.Item key={day + 1} label={(day + 1).toString()} value={(day + 1).toString()} />
      ));
    }, []);

    const renderMonthItems = useCallback(() => {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return months.map((month, index) => (
        <Picker.Item key={index} label={month} value={(index + 1).toString()} />
      ));
    }, []);

    const renderYearItems = useCallback(() => {
      const currentYear = new Date().getFullYear();
      return [...Array(100).keys()].map((year) => {
        const y = currentYear - year;
        return <Picker.Item key={y} label={y.toString()} value={y.toString()} />;
      });
    }, []);

    // Estilo base para los Pickers
    const basePickerStyle = {
      height: 50,
      paddingHorizontal: 15,
      marginBottom: 12,
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
      color: "#000",
    };

    return (
      <>
        <Text className="text-base text-black mb-2 font-bold">Fecha de nacimiento</Text>
        <View className="flex-row justify-between mb-3">
          <Picker
            selectedValue={birthDay}
            style={{ width: "33.33%", ...basePickerStyle }}
            onValueChange={setBirthDay}
            accessibilityLabel="Día de nacimiento"
          >
            {renderDayItems()}
          </Picker>
          <Picker
            selectedValue={birthMonth}
            style={{ width: "33.33%", ...basePickerStyle }}
            onValueChange={setBirthMonth}
            accessibilityLabel="Mes de nacimiento"
          >
            {renderMonthItems()}
          </Picker>
          <Picker
            selectedValue={birthYear}
            style={{ width: "33.33%", ...basePickerStyle }}
            onValueChange={setBirthYear}
            accessibilityLabel="Año de nacimiento"
          >
            {renderYearItems()}
          </Picker>
        </View>
      </>
    );
  };

  /**
   * GenderSection: Componente que renderiza la selección de género y, en caso de ser "Personalizado",
   * muestra opciones adicionales para pronombre y género personalizado.
   */
  const GenderSection: React.FC = () => {
    const basePickerStyle = {
      height: 50,
      paddingHorizontal: 15,
      marginBottom: 12,
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
      color: "#000",
    };

    return (
      <>
        <Text className="text-base text-black mb-2 font-bold">Género</Text>
        <Picker
          selectedValue={gender}
          style={{ width: "100%", ...basePickerStyle }}
          onValueChange={(itemValue) => {
            setGender(itemValue);
            if (itemValue !== "O") setPronoun("");
          }}
          accessibilityLabel="Género"
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
              style={{ height: 50, paddingHorizontal: 15, marginBottom: 12, backgroundColor: "#F3F4F6", borderRadius: 12, color: "#000" }}
              onValueChange={setPronoun}
              accessibilityLabel="Pronombre"
            >
              <Picker.Item label="Selecciona tu pronombre" value="" />
              <Picker.Item label='Femenino: "Salúdala por su cumpleaños"' value="Femenino" />
              <Picker.Item label='Masculino: "Salúdalo por su cumpleaños"' value="Masculino" />
              <Picker.Item label='Neutro: "Salúdalo(a) por su cumpleaños"' value="Neutro" />
            </Picker>
            <Text className="text-xs text-[#666] mb-3">Tu pronombre será visible para todos.</Text>
            <Text className="text-base text-black mb-2 font-bold">Género (opcional)</Text>
            <TextInput
              className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${
                customGender ? "text-black" : "text-[#9CA3AF]"
              }`}
              placeholder="Escribe tu género"
              value={customGender}
              onChangeText={setCustomGender}
              accessibilityLabel="Género personalizado"
            />
          </>
        )}
      </>
    );
  };

  /**
   * PasswordInput: Componente que muestra la entrada de contraseña con opción de mostrar u ocultar.
   */
  const PasswordInput: React.FC = () => (
    <View className="relative">
      <TextInput
        className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${
          password ? "text-black" : "text-[#9CA3AF]"
        }`}
        placeholder="Contraseña nueva"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        accessibilityLabel="Contraseña nueva"
      />
      <View className="absolute z-20 right-4 top-3">
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          accessibilityLabel="Mostrar u ocultar contraseña"
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * TermsAndConditions: Componente que muestra el checkbox y el enlace para ver los Términos y Condiciones.
   */
  const TermsAndConditions: React.FC = () => (
    <View className="flex-row items-center mb-3">
      <Checkbox
        value={acceptTerms}
        onValueChange={setAcceptTerms}
        className="mr-2"
        accessibilityLabel="Aceptar Términos y Condiciones"
      />
      <TouchableOpacity onPress={handleShowTerms}>
        <Text className="text-base text-black">
          Acepto los{" "}
          <Text className="text-[#5CB868]" accessibilityLabel="Ver Términos y Condiciones">
            Términos &amp; Condiciones
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Función para abrir la URL de Términos y Condiciones
  const handleShowTerms = useCallback(() => {
    const url = "https://example.com/terms"; // Reemplaza con la URL real
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "No se puede abrir la URL de Términos y Condiciones.");
        }
      })
      .catch((err) => console.error("Error al abrir URL:", err));
  }, []);

  /***********************
   * Renderizado del Componente
   ***********************/
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
        className="bg-white mt-[-50px] p-5 flex-grow"
      >
        <View
          className={`w-full bg-white rounded-xl relative ${
            width > 400 ? "max-w-[25rem]" : "max-w-[calc(100%-40px)]"
          }`}
        >
          {/* Logo */}
          <Image
            source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
            className="w-3/5 aspect-square self-center mb-[-40px]"
            resizeMode="contain"
          />
          <Text className="font-bold text-2xl text-center mb-5">Crea una cuenta</Text>
          {/* Nombre y Apellido */}
          <View className="flex-row justify-between mb-3">
            <TextInput
              className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${
                firstName ? "text-black" : "text-[#9CA3AF]"
              }`}
              placeholder="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              accessibilityLabel="Nombre"
            />
            <TextInput
              className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${
                lastName ? "text-black" : "text-[#9CA3AF]"
              }`}
              placeholder="Apellido"
              value={lastName}
              onChangeText={setLastName}
              accessibilityLabel="Apellido"
            />
          </View>
          {/* Fecha de Nacimiento */}
          <DateOfBirthPicker />
          {/* Sección de Género */}
          <GenderSection />
          {/* Correo Electrónico */}
          <TextInput
            className={`h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${
              email ? "text-black" : "text-[#9CA3AF]"
            }`}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            accessibilityLabel="Correo electrónico"
          />
          {/* Contraseña */}
          <PasswordInput />
          {/* Términos y Condiciones */}
          <TermsAndConditions />
          {/* Botón de Registro */}
          <TouchableOpacity
            className="items-center my-3 p-4 rounded-xl bg-[#5CB868]"
            onPress={handleRegister}
            disabled={loading}
            accessibilityLabel="Registrar cuenta"
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? "Cargando..." : "Registrar"}
            </Text>
          </TouchableOpacity>
          {/* Enlace para ir a Iniciar Sesión */}
          <TouchableOpacity onPress={() => setCurrentScreen("LoginScreen")}>
            <Text className="text-black text-center mt-3 text-base">
              <Text className="text-black">¿Ya tienes cuenta?</Text>
              <Text className="text-[#5CB868]"> Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
        {/* Banners para notificaciones de error y éxito */}
        <NotificationBanner message={errorMessage} type="error" />
        <NotificationBanner message={successMessage} type="success" />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default RegisterScreen;

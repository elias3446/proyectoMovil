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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import NotificationBanner from "@/Components/NotificationBanner";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/assets/styles/RegisterStyles"; // Ajusta la ruta según corresponda

/**
 * Propiedades del componente RegisterScreen.
 */
interface RegisterScreenProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * Componente RegisterScreen:
 * Permite al usuario crear una cuenta proporcionando datos personales, fecha de nacimiento, género,
 * correo, contraseña y aceptando los Términos y Condiciones. Realiza validaciones y registra al usuario
 * en Firebase Authentication y Firestore.
 */
const RegisterScreen: React.FC<RegisterScreenProps> = ({ setCurrentScreen }) => {
  // Estados para los datos del usuario
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estados para mensajes y carga
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Dimensiones de la pantalla (se pueden usar para ajustar diseños responsivos)
  const { width } = Dimensions.get("window");

  /**
   * Efecto para limpiar los mensajes de error y éxito automáticamente después de 3 segundos.
   */
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  /**
   * Función para validar el formato del correo electrónico.
   * @param email - Correo electrónico a validar.
   * @returns {boolean} - Devuelve true si el formato es válido.
   */
  const validateEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  /**
   * Función para registrar al usuario.
   * Realiza validaciones de campos, valida el formato del correo y verifica que se hayan aceptado
   * los Términos y Condiciones. Luego crea el usuario en Firebase Authentication y almacena los datos
   * en Firestore.
   */
  const handleRegister = useCallback(async () => {
    // Validaciones iniciales
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
      const auth = getAuth();
      const db = getFirestore();

      // Registra al usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const user = userCredential.user;

      // Crea el objeto con los datos del usuario
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        birthDay,
        birthMonth,
        birthYear,
        gender,
        pronoun:
          pronoun ||
          (gender === "F" ? "Femenino" : gender === "M" ? "Masculino" : ""),
        customGender: customGender.trim(),
        profileImage: profileImage || null,
      };

      // Guarda los datos del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      setSuccessMessage("Usuario registrado exitosamente.");
      setCurrentScreen("LoginScreen");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(`Error al registrar: ${error.message}`);
      } else {
        setErrorMessage("Error al registrar el usuario.");
      }
    } finally {
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
    profileImage,
    setCurrentScreen,
    validateEmail,
  ]);

  /**
   * Función para renderizar los elementos del Picker para el día (1-31).
   */
  const renderDayItems = useCallback(() => {
    return [...Array(31).keys()].map((day) => (
      <Picker.Item
        key={day + 1}
        label={(day + 1).toString()}
        value={(day + 1).toString()}
      />
    ));
  }, []);

  /**
   * Función para renderizar los elementos del Picker para el mes.
   */
  const renderMonthItems = useCallback(() => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return months.map((month, index) => (
      <Picker.Item
        key={index}
        label={month}
        value={(index + 1).toString()}
      />
    ));
  }, []);

  /**
   * Función para renderizar los elementos del Picker para el año (últimos 100 años).
   */
  const renderYearItems = useCallback(() => {
    const currentYear = new Date().getFullYear();
    return [...Array(100).keys()].map((year) => {
      const y = currentYear - year;
      return <Picker.Item key={y} label={y.toString()} value={y.toString()} />;
    });
  }, []);

  return (
    <View className={styles.registerScreenRoot}>
      {/* Encabezado fijo: toca en cualquier parte para cerrar el teclado */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={styles.headerContainer}>
          <Image
            source={require('@/assets/images/2a2cb89c-eb6b-46c2-a235-3f5ab59d888e-removebg-preview.png')}
            className={styles.headerImage}
            resizeMode="contain"
          />
          <Text className={styles.headerTitle}>Crea una cuenta</Text>
        </View>
      </TouchableWithoutFeedback>

      {/* Contenido scrollable: formulario de registro */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
        className={styles.scrollView}
      >
        <View className={styles.formContainer}>
          {/* Nombre y Apellido */}
          <View className={styles.rowInputContainer}>
            <TextInput
              className={styles.inputFirstName}
              placeholder="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              accessibilityLabel="Nombre"
            />
            <TextInput
              className={styles.inputLastName}
              placeholder="Apellido"
              value={lastName}
              onChangeText={setLastName}
              accessibilityLabel="Apellido"
            />
          </View>

          {/* Fecha de Nacimiento */}
          <Text className={styles.birthDateLabel}>Fecha de nacimiento</Text>
          <View className={styles.birthDateContainer}>
            <Picker
              selectedValue={birthDay}
              style={{
                width: "33.33%",
                height: 50,
                paddingHorizontal: 15,
                marginBottom: 12,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                color: "#000",
              }}
              onValueChange={(itemValue) => setBirthDay(itemValue)}
              accessibilityLabel="Día de nacimiento"
            >
              {renderDayItems()}
            </Picker>
            <Picker
              selectedValue={birthMonth}
              style={{
                width: "33.33%",
                height: 50,
                paddingHorizontal: 15,
                marginBottom: 12,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                color: "#000",
              }}
              onValueChange={(itemValue) => setBirthMonth(itemValue)}
              accessibilityLabel="Mes de nacimiento"
            >
              {renderMonthItems()}
            </Picker>
            <Picker
              selectedValue={birthYear}
              style={{
                width: "33.33%",
                height: 50,
                paddingHorizontal: 15,
                marginBottom: 12,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                color: "#000",
              }}
              onValueChange={(itemValue) => setBirthYear(itemValue)}
              accessibilityLabel="Año de nacimiento"
            >
              {renderYearItems()}
            </Picker>
          </View>

          {/* Género */}
          <Text className={styles.genderLabel}>Género</Text>
          <Picker
            selectedValue={gender}
            style={{
              width: "100%",
              height: 50,
              paddingHorizontal: 15,
              marginBottom: 12,
              backgroundColor: "#F3F4F6",
              borderRadius: 12,
              color: "#000",
            }}
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
              <Text className={styles.pronounLabel}>Selecciona tu pronombre</Text>
              <Picker
                selectedValue={pronoun}
                style={{
                  height: 50,
                  paddingHorizontal: 15,
                  marginBottom: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 12,
                  color: "#000",
                }}
                onValueChange={(itemValue) => setPronoun(itemValue)}
                accessibilityLabel="Pronombre"
              >
                <Picker.Item label="Selecciona tu pronombre" value="" />
                <Picker.Item
                  label='Femenino: "Salúdala por su cumpleaños"'
                  value="Femenino"
                />
                <Picker.Item
                  label='Masculino: "Salúdalo por su cumpleaños"'
                  value="Masculino"
                />
                <Picker.Item
                  label='Neutro: "Salúdalo(a) por su cumpleaños"'
                  value="Neutro"
                />
              </Picker>
              <Text className={styles.pronounDescription}>
                Tu pronombre será visible para todos.
              </Text>
              <Text className={styles.customGenderLabel}>Género (opcional)</Text>
              <TextInput
                className={styles.inputCustomGender}
                placeholder="Escribe tu género"
                value={customGender}
                onChangeText={setCustomGender}
                accessibilityLabel="Género personalizado"
              />
            </>
          )}

          {/* Correo Electrónico */}
          <TextInput
            className={styles.inputEmail}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            accessibilityLabel="Correo electrónico"
          />

          {/* Contraseña */}
          <View className={styles.passwordContainer}>
            <TextInput
              className={styles.inputPassword}
              placeholder="Contraseña nueva"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              accessibilityLabel="Contraseña nueva"
            />
            <View className={styles.passwordToggleContainer}>
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityLabel="Mostrar u ocultar contraseña"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pie de página fijo: incluye términos y botón de registro */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={styles.footerContainer}>
          <View className={styles.termsContainer}>
            <Checkbox
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              className={styles.checkboxMargin}
              accessibilityLabel="Aceptar Términos y Condiciones"
            />
            <TouchableOpacity onPress={() => {}}>
              <Text className={styles.termsText}>
                Acepto los{" "}
                <Text
                  className={styles.termsLink}
                  onPress={() => {}}
                  accessibilityLabel="Ver Términos y Condiciones"
                >
                  Términos &amp; Condiciones
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
            accessibilityLabel="Registrar cuenta"
            accessibilityRole="button"
          >
            <Text className={styles.registerButtonText}>
              {loading ? "Cargando..." : "Registrar"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen("LoginScreen")}>
            <Text className={styles.loginLinkContainer}>
              <Text className={styles.loginLinkText}>¿Ya tienes cuenta?</Text>
              <Text className={styles.loginLinkHighlight}> Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {/* Notificaciones para mensajes de error y éxito */}
      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </View>
  );
};

export default RegisterScreen;

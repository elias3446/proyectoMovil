import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  signOut,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import NotificationBanner from "@/Components/NotificationBanner";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";
import { unregisterIndieDevice } from "native-notify";
import { APP_ID, APP_TOKEN } from "@/api/notificationService";
import { styles } from "@/assets/styles/ProfileStyles"; // Ajusta la ruta según corresponda

interface CustomModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onRequestClose,
  children,
}) => {
  if (!visible) return null;
  if (Platform.OS === "web") {
    return (
      <Pressable
        className={styles.customModalWebPressable}
        onPress={onRequestClose}
      >
        <TouchableWithoutFeedback>
          <View className={styles.customModalWebView}>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    );
  }
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onPress={onRequestClose}
      >
        <TouchableWithoutFeedback>
          <View
            style={{
              width: "90%",
              backgroundColor: "white",
              padding: 20,
              borderRadius: 20,
            }}
          >
            {children}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
};

interface ProfileScreenProps {
  setCurrentScreen: (screen: string) => void;
}

interface IUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  pronoun: string;
  customGender: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentScreen }) => {
  // Estados básicos
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Imagen de perfil
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  // Fecha de nacimiento y género
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear().toString());
  const [gender, setGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [customGender, setCustomGender] = useState("");
  // Contraseña
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  // Modal imagen de perfil y mensajes
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Datos originales para comparar cambios
  const [originalUserData, setOriginalUserData] = useState<IUserData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profileImage: null,
    birthDay: "1",
    birthMonth: "1",
    birthYear: new Date().getFullYear().toString(),
    gender: "",
    pronoun: "",
    customGender: "",
  });

  const [currentUser, setCurrentUser] = useState(getAuth().currentUser);
  const auth = getAuth();
  const db = getFirestore();
  const { width } = Dimensions.get("window");

  const showError = useCallback((msg: string, timeout = 1500) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), timeout);
  }, []);

  const showSuccess = useCallback((msg: string, timeout = 2000) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), timeout);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const unsubscribe = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setEmail(data.email || "");
            setPhoneNumber(data.phoneNumber || "");
            setProfileImage(data.profileImage || null);
            setBirthDay(data.birthDay || "1");
            setBirthMonth(data.birthMonth || "1");
            setBirthYear(data.birthYear || new Date().getFullYear().toString());
            setGender(data.gender || "");
            setPronoun(data.pronoun || "");
            setCustomGender(data.customGender || "");
            setOriginalUserData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phoneNumber: data.phoneNumber || "",
              profileImage: data.profileImage || null,
              birthDay: data.birthDay || "1",
              birthMonth: data.birthMonth || "1",
              birthYear: data.birthYear || new Date().getFullYear().toString(),
              gender: data.gender || "",
              pronoun: data.pronoun || "",
              customGender: data.customGender || "",
            });
            AsyncStorage.setItem("userData", JSON.stringify(data));
          }
        },
        (error) => {
          showError("Error al escuchar los cambios del usuario: " + error.message);
        }
      );
      return () => unsubscribe();
    } else {
      showError("No estás autenticado. Por favor, inicia sesión.");
    }
  }, [currentUser, db, showError]);

  const handleImagePick = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        setNewProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      showError("Error al seleccionar la imagen: " + error.message);
    }
  }, [showError]);

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

  const handleSaveChanges = useCallback(async () => {
    if (!currentUser) {
      showError("No estás autenticado. Por favor, inicia sesión.");
      return;
    }
    setLoading(true);
    try {
      const isEmailChanged = email !== originalUserData.email;
      const isPasswordChanged = password !== "";
      const needReauth = isEmailChanged || isPasswordChanged;
      if (needReauth) {
        if (!currentPassword) {
          showError("Debes ingresar tu contraseña actual para actualizar el correo o la contraseña.");
          setLoading(false);
          return;
        }
        try {
          const credential = EmailAuthProvider.credential(
            currentUser.email!,
            currentPassword
          );
          await reauthenticateWithCredential(currentUser, credential);
        } catch (error: any) {
          if (error.code === "auth/wrong-password") {
            showError("La contraseña actual no coincide.");
          } else {
            showError("Error al verificar la contraseña actual.");
          }
          setLoading(false);
          return;
        }
        if (isEmailChanged) {
          try {
            await updateEmail(currentUser, email);
          } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
              showError("El correo electrónico ya está en uso por otro usuario.");
            } else {
              showError("Error al actualizar el correo electrónico: " + error.message);
            }
            setLoading(false);
            return;
          }
        }
        if (isPasswordChanged) {
          if (password === currentPassword) {
            showError("La nueva contraseña debe ser diferente a la actual.");
            setLoading(false);
            return;
          }
          try {
            await updatePassword(currentUser, password);
            showSuccess("Contraseña actualizada con éxito");
          } catch (error: any) {
            showError("Error al actualizar la contraseña: " + error.message);
            setLoading(false);
            return;
          }
        }
      }

      let finalProfileImage = profileImage;
      if (newProfileImage) {
        try {
          finalProfileImage = await uploadImageToCloudinary(newProfileImage);
        } catch (uploadError: any) {
          showError(uploadError.message);
          setLoading(false);
          return;
        }
      }

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage: finalProfileImage || null,
        birthDay,
        birthMonth,
        birthYear,
        gender,
        pronoun,
        customGender,
      });

      const updatedUserData: IUserData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage: finalProfileImage || null,
        birthDay,
        birthMonth,
        birthYear,
        gender,
        pronoun,
        customGender,
      };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      setOriginalUserData(updatedUserData);
      setProfileImage(finalProfileImage);
      setNewProfileImage(null);
      showSuccess("Cambios guardados exitosamente");
      setPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      showError("No se han podido guardar los cambios: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentUser,
    email,
    firstName,
    lastName,
    password,
    currentPassword,
    originalUserData,
    phoneNumber,
    profileImage,
    newProfileImage,
    birthDay,
    birthMonth,
    birthYear,
    gender,
    pronoun,
    customGender,
    db,
    showError,
    showSuccess,
  ]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      unregisterIndieDevice(auth.currentUser?.uid, APP_ID, APP_TOKEN);
      showSuccess("Sesión cerrada correctamente");
      setTimeout(() => {
        setCurrentScreen("LoginScreen");
      }, 2000);
    } catch (error) {
      showError("Error al cerrar sesión.");
    }
  }, [auth, setCurrentScreen, showError, showSuccess]);

  return (
    <View className={styles.profileScreenRoot}>
      {/* Encabezado fijo: toca en cualquier parte para descartar el teclado */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={styles.headerContainer}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 16,
              color: "#5CB868",
            }}
          >
            Editar Perfil
          </Text>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#F3F4F6",
              alignSelf: "center",
              marginBottom: 12,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            {newProfileImage || profileImage ? (
              <TouchableOpacity onPress={() => setShowProfileImageModal(true)}>
                <Image
                  source={{
                    uri: newProfileImage ? newProfileImage : profileImage!,
                  }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              </TouchableOpacity>
            ) : (
              <Text style={{ color: "#9CA3AF" }}>Sin Imagen</Text>
            )}
            <TouchableOpacity
              onPress={handleImagePick}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                padding: 8,
              }}
            >
              <FontAwesome
                name="camera"
                size={18}
                color="#fff"
                style={{
                  backgroundColor: "#5CB868",
                  borderRadius: 20,
                  padding: 4,
                }}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              color: "black",
            }}
          >
            {`${firstName} ${lastName}`.trim()}
          </Text>
          {/* Botón Cerrar Sesión: icono arriba, leyenda debajo; sin fondo */}
          <TouchableOpacity
            onPress={() => setShowSignOutModal(true)}
            style={{
              position: "absolute",
              right: 20,
              top: 110,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="sign-out" size={30} color="#5CB868" />
              <Text style={{ color: "#5CB868", fontSize: 16 }}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {/* Contenido scrollable */}
      <ScrollView
        className={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <Text
          className={styles.labelSmall}
          style={{ color: "#5CB868" }}
        >
          Nombre
        </Text>
        <TextInput
          className={styles.inputName}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#9CA3AF"
        />
        <Text
          className={styles.labelSmall}
          style={{ color: "#5CB868" }}
        >
          Apellido
        </Text>
        <TextInput
          className={styles.inputName}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor="#9CA3AF"
        />
        <Text
          className={styles.labelSmall}
          style={{ color: "#5CB868" }}
        >
          Correo Electrónico
        </Text>
        <TextInput
          className={styles.inputEmail}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#9CA3AF"
        />

        <Text className={styles.birthDateLabel}>Fecha de nacimiento</Text>
        <View className={styles.pickerContainer}>
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

        <Text
          className={styles.genderLabel}
          style={{ color: "#5CB868" }}
        >
          Género
        </Text>
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
            <Text
              className={styles.pronounLabel}
              style={{ color: "#5CB868" }}
            >
              Selecciona tu pronombre
            </Text>
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
            <Text
              className={styles.customGenderLabel}
              style={{ color: "#5CB868" }}
            >
              Género (opcional)
            </Text>
            <TextInput
              className={styles.customGenderInput}
              placeholder="Escribe tu género"
              value={customGender}
              onChangeText={setCustomGender}
              accessibilityLabel="Género personalizado"
            />
          </>
        )}

        <Text
          className={styles.passwordLabel}
          style={{ color: "#5CB868" }}
        >
          Modificar contraseña:
        </Text>
        <TextInput
          className={styles.passwordInput}
          placeholder="Ingresa tu contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          className={styles.passwordInput}
          placeholder="Ingresa la nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
      </ScrollView>

      {/* Pie de página fijo */}
      <View className={styles.footerContainer}>
        <TouchableOpacity
          className={styles.saveButton}
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <Text className={styles.saveButtonText}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View className={styles.modalContainer}>
          <Text className={styles.modalTitle}>
            ¿Seguro que deseas cerrar sesión?
          </Text>
          <View className={styles.modalButtonContainer}>
            <TouchableOpacity
              className={styles.modalCancelButton}
              onPress={() => setShowSignOutModal(false)}
              style={{ marginBottom: 10 }}
            >
              <Text className={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={styles.modalSignOutButton}
              onPress={handleSignOut}
            >
              <Text className={styles.modalButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>

      <CustomModal
        visible={showProfileImageModal}
        onRequestClose={() => setShowProfileImageModal(false)}
      >
        {newProfileImage || profileImage ? (
          <Image
            source={{ uri: newProfileImage ? newProfileImage : profileImage! }}
            className={styles.profileImageModal}
          />
        ) : (
          <Text className={styles.textCenter}>No hay imagen disponible</Text>
        )}
      </CustomModal>

      {errorMessage !== "" && (
        <NotificationBanner message={errorMessage} type="error" />
      )}
      {successMessage !== "" && (
        <NotificationBanner message={successMessage} type="success" />
      )}
    </View>
  );
};

export default ProfileScreen;

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

// ===================== COMPONENTE MODAL PERSONALIZADO =====================

/**
 * CustomModal
 * Componente modal reutilizable que adapta su comportamiento para web y dispositivos nativos.
 */
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
      <Pressable className={styles.customModalWebPressable} onPress={onRequestClose}>
        <TouchableWithoutFeedback>
          <View className={styles.customModalWebView}>{children}</View>
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

// ===================== INTERFAZ DE DATOS DEL USUARIO =====================

interface IUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
}

// ===================== SUBCOMPONENTES =====================

/**
 * ProfileHeader
 * Muestra el encabezado del perfil con título, imagen de perfil y botón para cerrar sesión.
 */
interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  profileImage: string | null;
  newProfileImage: string | null;
  onProfileImagePress: () => void;
  onCameraPress: () => void;
  onSignOutPress: () => void;
}
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  profileImage,
  newProfileImage,
  onProfileImagePress,
  onCameraPress,
  onSignOutPress,
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className={styles.headerContainer}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 16,
            color: "black",
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
            <TouchableOpacity onPress={onProfileImagePress}>
              <Image
                source={{ uri: newProfileImage ? newProfileImage : profileImage! }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "#9CA3AF" }}>Sin Imagen</Text>
          )}
          <TouchableOpacity
            onPress={onCameraPress}
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
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center",
            color: "#9E9E9E",
          }}
        >
          {`${firstName} ${lastName}`.trim()}
        </Text>
        <TouchableOpacity
          onPress={onSignOutPress}
          style={{
            position: "absolute",
            right: 20,
            top: 100,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <FontAwesome name="sign-out" size={30} color="#5CB868" />
            <Text style={{ color: "#5CB868", fontSize: 16 }}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

/**
 * UserInfoForm
 * Formulario para editar los datos básicos del usuario: nombre, apellido y correo.
 */
interface UserInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
}
const UserInfoForm: React.FC<UserInfoFormProps> = ({
  firstName,
  lastName,
  email,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
}) => (
  <>
    <Text className={styles.labelSmall}
          style={{ color: "#5CB868" }}>Nombre</Text>
    <TextInput
      className={styles.inputName}
      placeholder="Nombre"
      value={firstName}
      onChangeText={onFirstNameChange}
      placeholderTextColor="#9CA3AF"
    />
    <Text className={styles.labelSmall}
          style={{ color: "#5CB868" }}>Apellido</Text>
    <TextInput
      className={styles.inputName}
      placeholder="Apellido"
      value={lastName}
      onChangeText={onLastNameChange}
      placeholderTextColor="#9CA3AF"
    />
    <Text className={styles.labelSmall}
          style={{ color: "#5CB868" }}>Correo Electrónico</Text>
    <TextInput
      className={styles.inputEmail}
      placeholder="Correo Electrónico"
      value={email}
      onChangeText={onEmailChange}
      keyboardType="email-address"
      placeholderTextColor="#9CA3AF"
    />
  </>
);

/**
 * BirthDatePicker
 * Permite seleccionar la fecha de nacimiento utilizando tres Pickers (día, mes y año).
 */
interface BirthDatePickerProps {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  onBirthDayChange: (value: string) => void;
  onBirthMonthChange: (value: string) => void;
  onBirthYearChange: (value: string) => void;
}
const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
  birthDay,
  birthMonth,
  birthYear,
  onBirthDayChange,
  onBirthMonthChange,
  onBirthYearChange,
}) => {
  // Renderiza los ítems para los días
  const renderDayItems = () =>
    [...Array(31).keys()].map((day) => (
      <Picker.Item key={day + 1} label={(day + 1).toString()} value={(day + 1).toString()} />
    ));
  // Renderiza los ítems para los meses
  const renderMonthItems = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months.map((month, index) => (
      <Picker.Item key={index} label={month} value={(index + 1).toString()} />
    ));
  };
  // Renderiza los ítems para los años
  const renderYearItems = () => {
    const currentYear = new Date().getFullYear();
    return [...Array(100).keys()].map((year) => {
      const y = currentYear - year;
      return <Picker.Item key={y} label={y.toString()} value={y.toString()} />;
    });
  };

  return (
    <>
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
          onValueChange={onBirthDayChange}
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
          onValueChange={onBirthMonthChange}
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
          onValueChange={onBirthYearChange}
          accessibilityLabel="Año de nacimiento"
        >
          {renderYearItems()}
        </Picker>
      </View>
    </>
  );
};

/**
 * PasswordChangeSection
 * Sección para actualizar la contraseña, mostrando inputs para la contraseña actual y la nueva.
 */
interface PasswordChangeSectionProps {
  currentPassword: string;
  password: string;
  onCurrentPasswordChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
}
const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  currentPassword,
  password,
  onCurrentPasswordChange,
  onPasswordChange,
}) => (
  <>
    <Text className={styles.labelSmall}
          style={{ color: "#5CB868" }}>Modificar contraseña:</Text>
    <TextInput
      className={styles.passwordInput}
      placeholder="Ingresa tu contraseña actual"
      value={currentPassword}
      onChangeText={onCurrentPasswordChange}
      secureTextEntry
      placeholderTextColor="#9CA3AF"
    />
    <TextInput
      className={styles.passwordInput}
      placeholder="Ingresa la nueva contraseña"
      value={password}
      onChangeText={onPasswordChange}
      secureTextEntry
      placeholderTextColor="#9CA3AF"
    />
  </>
);

/**
 * SaveButton
 * Botón para guardar los cambios realizados en el perfil.
 */
interface SaveButtonProps {
  onPress: () => void;
  loading: boolean;
}
const SaveButton: React.FC<SaveButtonProps> = ({ onPress, loading }) => (
  <TouchableOpacity className={styles.saveButton} onPress={onPress} disabled={loading}>
    <Text className={styles.saveButtonText}>{loading ? "Guardando..." : "Guardar Cambios"}</Text>
  </TouchableOpacity>
);

/**
 * SignOutModal
 * Modal que solicita confirmación para cerrar sesión.
 */
interface SignOutModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
const SignOutModal: React.FC<SignOutModalProps> = ({ visible, onCancel, onConfirm }) => (
  <CustomModal visible={visible} onRequestClose={onCancel}>
    <View className={styles.modalContainer}>
      <Text className={styles.modalTitle}>¿Seguro que deseas cerrar sesión?</Text>
      <View className={styles.modalButtonContainer}>
        <TouchableOpacity
          className={styles.modalCancelButton}
          onPress={onCancel}
        >
          <Text className={styles.modalButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity className={styles.modalSignOutButton} onPress={onConfirm}>
          <Text className={styles.modalButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  </CustomModal>
);

/**
 * ProfileImageModal
 * Modal para mostrar la imagen de perfil en grande.
 */
interface ProfileImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onRequestClose: () => void;
}
const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  visible,
  imageUri,
  onRequestClose,
}) => (
  <CustomModal visible={visible} onRequestClose={onRequestClose}>
    {imageUri ? (
      <Image source={{ uri: imageUri }} className={styles.profileImageModal} />
    ) : (
      <Text className={styles.textCenter}>No hay imagen disponible</Text>
    )}
  </CustomModal>
);

// ===================== COMPONENTE PRINCIPAL: ProfileScreen =====================

interface ProfileScreenProps {
  setCurrentScreen: (screen: string) => void;
}
const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentScreen }) => {
  // Estados de datos básicos del usuario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Estados para imagen de perfil
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);

  // Estados para fecha de nacimiento y género
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear().toString());

  // Estados para contraseña y reautenticación
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  // Estados para manejo de modales y mensajes
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Guarda los datos originales para detectar cambios
  const [originalUserData, setOriginalUserData] = useState<IUserData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profileImage: null,
    birthDay: "1",
    birthMonth: "1",
    birthYear: new Date().getFullYear().toString(),
  });

  const auth = getAuth();
  const db = getFirestore();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const { width } = Dimensions.get("window");

  // Funciones para mostrar mensajes temporales
  const showError = useCallback((msg: string, timeout = 1500) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), timeout);
  }, []);
  const showSuccess = useCallback((msg: string, timeout = 2000) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), timeout);
  }, []);

  // Escucha los cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  // Escucha en tiempo real los cambios de datos del usuario en Firestore
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
            setOriginalUserData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phoneNumber: data.phoneNumber || "",
              profileImage: data.profileImage || null,
              birthDay: data.birthDay || "1",
              birthMonth: data.birthMonth || "1",
              birthYear: data.birthYear || new Date().getFullYear().toString(),
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

  // Función para seleccionar imagen de perfil mediante la galería
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

  // Función para guardar los cambios en el perfil
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
          const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
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
    db,
    showError,
    showSuccess,
  ]);

  // Función para cerrar sesión
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
      {/* Encabezado del perfil */}
      <ProfileHeader
        firstName={firstName}
        lastName={lastName}
        profileImage={profileImage}
        newProfileImage={newProfileImage}
        onProfileImagePress={() => setShowProfileImageModal(true)}
        onCameraPress={handleImagePick}
        onSignOutPress={() => setShowSignOutModal(true)}
      />

      {/* Contenido Scrollable */}
      <ScrollView
        className={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <UserInfoForm
          firstName={firstName}
          lastName={lastName}
          email={email}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onEmailChange={setEmail}
        />

        <BirthDatePicker
          birthDay={birthDay}
          birthMonth={birthMonth}
          birthYear={birthYear}
          onBirthDayChange={setBirthDay}
          onBirthMonthChange={setBirthMonth}
          onBirthYearChange={setBirthYear}
        />

        <PasswordChangeSection
          currentPassword={currentPassword}
          password={password}
          onCurrentPasswordChange={setCurrentPassword}
          onPasswordChange={setPassword}
        />
      </ScrollView>

      {/* Botón de Guardar Cambios */}
      <View className={styles.footerContainer}>
        <SaveButton onPress={handleSaveChanges} loading={loading} />
      </View>

      {/* Modal para Confirmar Cierre de Sesión */}
      <SignOutModal
        visible={showSignOutModal}
        onCancel={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
      />

      {/* Modal para Visualizar Imagen de Perfil */}
      <ProfileImageModal
        visible={showProfileImageModal}
        imageUri={newProfileImage ? newProfileImage : profileImage}
        onRequestClose={() => setShowProfileImageModal(false)}
      />

      {/* Notificaciones */}
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

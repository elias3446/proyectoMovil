// ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import NotificationBanner from "@/Components/NotificationBanner";
import { FontAwesome } from "@expo/vector-icons";

// Importa funciones del servicio de Firebase
import {
  updateUserCredentials,
  updateUserProfileData,
  signOutUser,
  uploadProfileImage,
  useFirebaseProfile,
  IUserData,
} from "@/api/firebaseService";

/**
 * Componente CustomModal
 * Se utiliza para mostrar modales tanto en web como en dispositivos móviles.
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
      <View className="flex-1 justify-center items-center bg-black/50 fixed inset-0 z-[999]">
        <View className="w-11/12 bg-white p-5 rounded-2xl shadow">{children}</View>
      </View>
    );
  }
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-11/12 bg-white p-5 rounded-2xl shadow">{children}</View>
      </View>
    </Modal>
  );
};

/**
 * Componente ProfileImagePicker
 * Muestra la imagen de perfil actual (o un placeholder) y permite seleccionar una nueva imagen.
 */
interface ProfileImagePickerProps {
  profileImage: string | null;
  newProfileImage: string | null;
  onPickImage: () => void;
}

const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  profileImage,
  newProfileImage,
  onPickImage,
}) => {
  const imageUri = newProfileImage ? newProfileImage : profileImage;
  return (
    <View className="w-[100px] h-[100px] rounded-full bg-[#F3F4F6] self-center mb-3 justify-center items-center relative">
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-[100px] h-[100px] rounded-full" />
      ) : (
        <Text className="text-[#9CA3AF]">Sin Imagen</Text>
      )}
      <TouchableOpacity
        onPress={onPickImage}
        className="absolute bottom-0 right-0 bg-[#5CB868] p-2 rounded-[20px]"
        accessibilityLabel="Seleccionar imagen de perfil"
      >
        <FontAwesome name="camera" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Componente SignOutModal
 * Muestra un modal de confirmación para el cierre de sesión.
 */
interface SignOutModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => (
  <CustomModal visible={visible} onRequestClose={onCancel}>
    <View className="p-5">
      <Text className="text-lg font-bold mb-5 text-center">
        ¿Seguro que deseas cerrar sesión?
      </Text>
      <View className="flex-row justify-center space-x-6">
        <TouchableOpacity
          className="w-[140px] p-3 rounded-[25px] items-center bg-gray-300"
          onPress={onCancel}
          accessibilityLabel="Cancelar cerrar sesión"
        >
          <Text className="w-full text-white text-base font-bold text-center">
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[140px] p-3 rounded-[25px] items-center bg-[#E53935]"
          onPress={onConfirm}
          accessibilityLabel="Confirmar cerrar sesión"
        >
          <Text className="w-full text-white text-base font-bold text-center">
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </CustomModal>
);

/**
 * Props del componente ProfileScreen.
 */
interface ProfileScreenProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * Componente ProfileScreen
 * Permite editar los datos del perfil del usuario, actualizar credenciales y cerrar sesión.
 */
const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentScreen }) => {
  /*** Estados para los datos del usuario ***/
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);

  /*** Estados para la actualización de contraseña ***/
  const [password, setPassword] = useState(""); // Nueva contraseña
  const [currentPassword, setCurrentPassword] = useState(""); // Para reautenticación

  /*** Estados para mensajes, carga y modal ***/
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Guarda los datos originales para comparar cambios
  const [originalUserData, setOriginalUserData] = useState<IUserData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profileImage: null,
  });

  // Obtiene el usuario y sus datos desde el hook de Firebase
  const { currentUser, userData } = useFirebaseProfile();
  const { width } = Dimensions.get("window");

  // Actualiza los estados locales cuando cambian los datos del usuario
  useEffect(() => {
    setFirstName(userData.firstName);
    setLastName(userData.lastName);
    setEmail(userData.email);
    setPhoneNumber(userData.phoneNumber);
    setProfileImage(userData.profileImage);
    setOriginalUserData(userData);
    // Guarda los datos actualizados en AsyncStorage si se requiere
    AsyncStorage.setItem("userData", JSON.stringify(userData));
  }, [userData]);

  /*** Funciones Helper ***/

  // Muestra un mensaje de error y lo oculta después de un tiempo determinado
  const showError = useCallback((msg: string, timeout = 1500) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), timeout);
  }, []);

  // Muestra un mensaje de éxito y lo oculta después de un tiempo determinado
  const showSuccess = useCallback((msg: string, timeout = 2000) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), timeout);
  }, []);

  // Valida el formato del correo electrónico
  const isValidEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  /**
   * Permite seleccionar una imagen de perfil usando expo-image-picker.
   */
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

  /**
   * Guarda los cambios del perfil, actualiza credenciales y datos en Firebase.
   */
  const handleSaveChanges = useCallback(async () => {
    if (!currentUser) {
      showError("No estás autenticado. Por favor, inicia sesión.");
      return;
    }
    setLoading(true);
    try {
      const emailChanged = email !== originalUserData.email;
      if (emailChanged && !isValidEmail(email)) {
        showError("Ingresa un correo electrónico válido.");
        setLoading(false);
        return;
      }
      const passwordChanged = password.trim() !== "";
      const requiresReauth = emailChanged || passwordChanged;
      if (requiresReauth && !currentPassword.trim()) {
        showError("Debes ingresar tu contraseña actual para actualizar el correo o la contraseña.");
        setLoading(false);
        return;
      }
      if (requiresReauth) {
        try {
          await updateUserCredentials(
            currentUser,
            emailChanged ? email : undefined,
            passwordChanged ? password : undefined,
            currentPassword
          );
          if (passwordChanged) {
            showSuccess("Contraseña actualizada con éxito");
          }
        } catch (error: any) {
          if (error.code === "auth/wrong-password") {
            showError("La contraseña actual no coincide.");
          } else {
            showError("Error al actualizar: " + error.message);
          }
          setLoading(false);
          return;
        }
      }
      let finalProfileImage = profileImage;
      if (newProfileImage) {
        try {
          finalProfileImage = await uploadProfileImage(newProfileImage);
        } catch (uploadError: any) {
          showError(uploadError.message);
          setLoading(false);
          return;
        }
      }
      await updateUserProfileData(currentUser.uid, {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage: finalProfileImage || null,
      });
      const updatedUserData: IUserData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage: finalProfileImage || null,
      };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      setOriginalUserData(updatedUserData);
      setProfileImage(finalProfileImage);
      setNewProfileImage(null);
      showSuccess("Cambios guardados exitosamente");
      // Limpia los campos de contraseña tras la actualización
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
    phoneNumber,
    password,
    currentPassword,
    originalUserData,
    profileImage,
    newProfileImage,
    isValidEmail,
    showError,
    showSuccess,
  ]);

  /**
   * Maneja el cierre de sesión.
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      showSuccess("Sesión cerrada correctamente");
      setTimeout(() => {
        setCurrentScreen("LoginScreen");
      }, 2000);
    } catch (error: any) {
      showError("Error al cerrar sesión: " + error.message);
    }
  }, [setCurrentScreen, showError, showSuccess]);

  /***********************
   * Renderizado del Componente
   ***********************/
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView
        className="flex-grow bg-white mt-[-20px] py-5"
        contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          className="w-full p-5 bg-white self-center"
          style={{ maxWidth: width > 400 ? 400 : width - 40 }}
        >
          <Text className="text-2xl font-bold text-center mb-5">
            Editar Perfil
          </Text>
          {/* Componente para imagen de perfil */}
          <ProfileImagePicker
            profileImage={profileImage}
            newProfileImage={newProfileImage}
            onPickImage={handleImagePick}
          />
          <Text className="text-sm text-black font-bold text-center mb-5">
            {`${firstName} ${lastName}`.trim()}
          </Text>
          {/* Campos de entrada */}
          <TextInput
            className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Nombre"
          />
          <TextInput
            className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Apellido"
          />
          <TextInput
            className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
            placeholder="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Correo Electrónico"
          />
          <Text className="text-sm text-black font-bold mb-[6px]">
            Modificar contraseña:
          </Text>
          <TextInput
            className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
            placeholder="Ingresa tu contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Contraseña actual"
          />
          <TextInput
            className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
            placeholder="Ingresa la nueva contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Nueva contraseña"
          />
          <TouchableOpacity
            className="p-[15px] rounded-[25px] items-center my-1 bg-[#5CB868]"
            onPress={handleSaveChanges}
            disabled={loading}
            accessibilityLabel="Guardar cambios"
          >
            <Text className="text-white text-base font-bold">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-[15px] rounded-[25px] items-center my-1 bg-[#5CB868]"
            onPress={() => setShowSignOutModal(true)}
            accessibilityLabel="Cerrar sesión"
          >
            <View className="flex-row items-center">
              <FontAwesome name="sign-out" size={20} color="#fff" className="mr-2" />
              <Text className="text-white text-base font-bold">Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* Notificaciones */}
        {errorMessage !== "" && (
          <NotificationBanner message={errorMessage} type="error" />
        )}
        {successMessage !== "" && (
          <NotificationBanner message={successMessage} type="success" />
        )}
        {/* Modal de confirmación de cierre de sesión */}
        <SignOutModal
          visible={showSignOutModal}
          onCancel={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ProfileScreen;

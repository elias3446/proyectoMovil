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
import NotificationBanner from "@/Components/NotificationBanner";
import { FontAwesome } from "@expo/vector-icons";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";

// Componente Modal personalizado para compatibilidad en web y native
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
  // Para web
  if (Platform.OS === "web") {
    return (
      <Pressable
        className="flex-1 justify-center items-center bg-black/50 fixed inset-0 z-[999]"
        onPress={onRequestClose}
      >
        <TouchableWithoutFeedback>
          <View className="w-11/12 bg-white p-5 rounded-2xl shadow">
            {children}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    );
  }
  // Para native
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
          <View style={{ width: "90%", backgroundColor: "white", padding: 20, borderRadius: 20 }}>
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
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentScreen }) => {
  // Estados para los datos del usuario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Imagen actual y nueva (para previsualización)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);

  // Estado para mostrar el modal de imagen de usuario
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);

  // Estados para la modificación de contraseña
  const [password, setPassword] = useState(""); // Nueva contraseña
  const [currentPassword, setCurrentPassword] = useState(""); // Para reautenticación

  // Estados para mensajes y carga
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Datos originales del usuario (para comparar cambios)
  const [originalUserData, setOriginalUserData] = useState<IUserData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profileImage: null,
  });

  const [currentUser, setCurrentUser] = useState(getAuth().currentUser);
  const auth = getAuth();
  const db = getFirestore();

  // Helper para mostrar mensajes de error que se limpian automáticamente
  const showError = useCallback((msg: string, timeout = 1500) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), timeout);
  }, []);

  // Helper para mostrar mensajes de éxito
  const showSuccess = useCallback((msg: string, timeout = 2000) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), timeout);
  }, []);

  // Escucha en tiempo real el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  // Listener en tiempo real del documento del usuario en Firestore
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
            setOriginalUserData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phoneNumber: data.phoneNumber || "",
              profileImage: data.profileImage || null,
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

  // Función para seleccionar imagen usando expo-image-picker
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

  // Función para guardar los cambios del perfil
  const handleSaveChanges = useCallback(async () => {
    if (!currentUser) {
      showError("No estás autenticado. Por favor, inicia sesión.");
      return;
    }
    setLoading(true);
    try {
      const isEmailChanged = email !== originalUserData.email;
      if (isEmailChanged) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showError("Ingresa un correo electrónico válido.");
          setLoading(false);
          return;
        }
      }
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
        profileImage: finalProfileImage || null,
        phoneNumber,
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
      // Limpiar campos de contraseña
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
    db,
    uploadImageToCloudinary,
    showError,
    showSuccess,
  ]);

  // Función para cerrar sesión
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      showSuccess("Sesión cerrada correctamente");
      setTimeout(() => {
        setCurrentScreen("LoginScreen");
      }, 2000);
    } catch (error) {
      showError("Error al cerrar sesión.");
    }
  }, [auth, setCurrentScreen, showError, showSuccess]);

  const { width } = Dimensions.get("window");

  return (
    <ScrollView
      className="flex-grow bg-white mt-[-20px] py-5"
      contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
    >
      {/* Contenedor externo sin bordes, centrado y con maxWidth definido */}
      <View
        className="w-full p-5 bg-white self-center"
        style={{ maxWidth: width > 400 ? 400 : width - 40 }}
      >
        <Text className="text-2xl font-bold text-center mb-5">Editar Perfil</Text>

        <View className="w-[100px] h-[100px] rounded-full bg-[#F3F4F6] self-center mb-3 justify-center items-center relative">
          {newProfileImage || profileImage ? (
            <TouchableOpacity onPress={() => setShowProfileImageModal(true)}>
              <Image
                source={{ uri: newProfileImage ? newProfileImage : profileImage! }}
                className="w-[100px] h-[100px] rounded-full"
              />
            </TouchableOpacity>
          ) : (
            <Text className="text-[#9CA3AF]">Sin Imagen</Text>
          )}
          <TouchableOpacity
            onPress={handleImagePick}
            className="absolute bottom-0 right-0 bg-[#5CB868] p-2 rounded-[20px]"
          >
            <FontAwesome name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-black font-bold text-center mb-5">
          {`${firstName} ${lastName}`.trim()}
        </Text>

        <TextInput
          className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#9CA3AF"
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
        />
        <TextInput
          className="w-full h-[50px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black"
          placeholder="Ingresa la nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          className="p-[15px] rounded-[25px] items-center my-1 bg-[#5CB868]"
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <Text className="text-white text-base font-bold">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-[15px] rounded-[25px] items-center my-1 bg-[#5CB868]"
          onPress={() => setShowSignOutModal(true)}
        >
          <View className="flex-row items-center">
            <FontAwesome name="sign-out" size={20} color="#fff" className="mr-2" />
            <Text className="text-white text-base font-bold">Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>

      {errorMessage !== "" && (
        <NotificationBanner message={errorMessage} type="error" />
      )}
      {successMessage !== "" && (
        <NotificationBanner message={successMessage} type="success" />
      )}

      <CustomModal
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View className="p-5">
          <Text className="text-lg font-bold mb-5 text-center">
            ¿Seguro que deseas cerrar sesión?
          </Text>
          {/* Botones alineados verticalmente con separación */}
          <View className="flex flex-col items-center">
            <TouchableOpacity
              className="w-[140px] p-3 rounded-[25px] items-center bg-gray-300"
              onPress={() => setShowSignOutModal(false)}
              style={{ marginBottom: 10 }}  // Separación entre botones
            >
              <Text className="w-full text-white text-base font-bold text-center">
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-[140px] p-3 rounded-[25px] items-center bg-[#E53935]"
              onPress={handleSignOut}
            >
              <Text className="w-full text-white text-base font-bold text-center">
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>

      {/* Modal para mostrar la imagen del usuario en pantalla completa */}
      <CustomModal
        visible={showProfileImageModal}
        onRequestClose={() => setShowProfileImageModal(false)}
      >
        {newProfileImage || profileImage ? (
          <Image
            source={{ uri: newProfileImage ? newProfileImage : profileImage! }}
            className="w-full aspect-square rounded-lg" 
          />
        ) : (
          <Text className="text-center">No hay imagen disponible</Text>
        )}
      </CustomModal>
    </ScrollView>
  );
};

export default ProfileScreen;

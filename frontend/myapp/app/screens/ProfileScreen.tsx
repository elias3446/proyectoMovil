import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
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

// Componente Modal personalizado para compatibilidad en web
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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>{children}</View>
      </View>
    );
  }
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      {children}
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

  // Estados para la modificación de contraseña
  const [password, setPassword] = useState(""); // Nueva contraseña
  const [currentPassword, setCurrentPassword] = useState(""); // Contraseña para reautenticación

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

  // Escucha en tiempo real el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

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
          setErrorMessage("Error al escuchar los cambios del usuario: " + error.message);
        }
      );
      return () => unsubscribe();
    } else {
      setErrorMessage("No estás autenticado. Por favor, inicia sesión.");
    }
  }, [currentUser, db]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setNewProfileImage(result.assets[0].uri);
    }
  };

  // Guardar cambios: actualiza datos sensibles (correo/contraseña) y demás datos del perfil
  const handleSaveChanges = async () => {
    if (!currentUser) {
      setErrorMessage("No estás autenticado. Por favor, inicia sesión.");
      return;
    }
    setLoading(true);
    try {
      // Determinar si se ha modificado el correo
      const isEmailChanged = email !== originalUserData.email;
      
      // Validar formato del correo en caso de modificación
      if (isEmailChanged) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setErrorMessage("Ingresa un correo electrónico válido.");
          setLoading(false);
          return;
        }
      }
      
      // Determinar si se ha modificado la contraseña
      const isPasswordChanged = password !== "";
      const needReauth = isEmailChanged || isPasswordChanged;
      
      if (needReauth) {
        if (!currentPassword) {
          setErrorMessage("Debes ingresar tu contraseña actual para actualizar el correo o la contraseña.");
          setTimeout(() => setErrorMessage(""), 1500);
          setLoading(false);
          return;
        }
        // Reautenticación
        try {
          const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (error: any) {
          if (error.code === "auth/wrong-password") {
            setErrorMessage("La contraseña actual no coincide.");
          } else {
            setErrorMessage("Error al verificar la contraseña actual.");
          }
          setTimeout(() => setErrorMessage(""), 1500);
          setLoading(false);
          return;
        }
        // Actualización del correo si fue modificado
        if (isEmailChanged) {
          try {
            await updateEmail(currentUser, email);
          } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
              setErrorMessage("El correo electrónico ya está en uso por otro usuario.");
            } else {
              setErrorMessage("Error al actualizar el correo electrónico: " + error.message);
            }
            setTimeout(() => setErrorMessage(""), 1500);
            setLoading(false);
            return;
          }
        }
        // Actualización de la contraseña si se proporcionó una nueva
        if (isPasswordChanged) {
          if (password === currentPassword) {
            setErrorMessage("La nueva contraseña debe ser diferente a la actual.");
            setTimeout(() => setErrorMessage(""), 1500);
            setLoading(false);
            return;
          }
          try {
            await updatePassword(currentUser, password);
            setSuccessMessage("Contraseña actualizada con éxito");
            setTimeout(() => setSuccessMessage(""), 2000);
          } catch (error: any) {
            setErrorMessage("Error al actualizar la contraseña: " + error.message);
            setTimeout(() => setErrorMessage(""), 1500);
            setLoading(false);
            return;
          }
        }
      }

      // Manejo de imagen de perfil: si se seleccionó una nueva imagen se sube a Cloudinary
      let finalProfileImage = profileImage;
      if (newProfileImage) {
        const formData = new FormData();
        if (Platform.OS === "web") {
          const response = await fetch(newProfileImage);
          const blob = await response.blob();
          formData.append("file", blob, "profile.jpg");
        } else {
          formData.append("file", {
            uri: newProfileImage,
            type: "image/jpeg",
            name: "profile.jpg",
          } as any);
        }
        formData.append("upload_preset", "my_upload_preset2");
        formData.append("folder", "profile_images");

        const cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await cloudinaryResponse.json();
        if (data.secure_url) {
          finalProfileImage = data.secure_url;
        } else {
          setErrorMessage("Error al obtener la URL de la imagen.");
          setLoading(false);
          return;
        }
      }

      // Actualización de datos en Firestore
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        profileImage: finalProfileImage || null,
        phoneNumber,
      });

      // Actualización de AsyncStorage y de los estados originales
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

      setSuccessMessage("Cambios guardados exitosamente");
      setTimeout(() => setSuccessMessage(""), 2000);

      // Limpiar campos de contraseña
      setPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      setErrorMessage("No se han podido guardar los cambios: " + error.message);
      setTimeout(() => setErrorMessage(""), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      setSuccessMessage("Sesión cerrada correctamente");
      setTimeout(() => {
        setSuccessMessage("");
        setCurrentScreen("LoginScreen");
      }, 2000);
    } catch (error) {
      setErrorMessage("Error al cerrar sesión.");
    }
  };

  const { width } = Dimensions.get("window");

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View
        style={[
          styles.formContainer,
          { maxWidth: width > 400 ? 400 : width - 40 },
        ]}
      >
        <Text style={styles.title}>Editar Perfil</Text>

        <View style={styles.profileImageContainer}>
          {newProfileImage || profileImage ? (
            <Image
              source={{ uri: newProfileImage ? newProfileImage : profileImage! }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={styles.noImageText}>Sin Imagen</Text>
          )}
          <TouchableOpacity onPress={handleImagePick} style={styles.cameraButton}>
            <FontAwesome name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {/*
          Se concatena el nombre y el apellido en un solo nodo para evitar conflictos en el DOM.
        */}
        <Text style={[styles.label, { textAlign: "center", marginBottom: 20 }]}>
          {`${firstName} ${lastName}`.trim()}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Modificar contraseña:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa tu contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Ingresa la nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => setShowSignOutModal(true)}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FontAwesome name="sign-out" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>¿Seguro que deseas cerrar sesión?</Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowSignOutModal(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSignOutButton]}
              onPress={handleSignOut}
            >
              <Text style={styles.buttonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginTop: -20,
  },
  formContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    position: "relative",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    fontSize: 16,
    color: "#000",
  },
  label: {
    fontSize: 14,
    color: "black",
    marginBottom: 6,
    fontWeight: "bold",
  },
  button: {
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 5,
  },
  primaryButton: {
    backgroundColor: "#5CB868",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  noImageText: {
    color: "#9CA3AF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#5CB868",
    padding: 8,
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    position: Platform.OS === "web" ? "fixed" : "relative",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#ccc",
    marginRight: 10,
  },
  modalSignOutButton: {
    backgroundColor: "#E53935",
    marginLeft: 10,
  },
});

export default ProfileScreen;

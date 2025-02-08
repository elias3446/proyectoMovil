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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import NotificationBanner from "@/Components/NotificationBanner";
import { FontAwesome } from "@expo/vector-icons";

interface ProfileScreenProps {
  setCurrentScreen: (screen: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentScreen }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Nueva contraseña
  const [currentPassword, setCurrentPassword] = useState(""); // Contraseña actual para reautenticación
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser; // Usuario autenticado actual

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setErrorMessage("No estás autenticado. Por favor, inicia sesión.");
        return;
      }
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setFirstName(parsedData.firstName || "");
          setLastName(parsedData.lastName || "");
          setEmail(parsedData.email || "");
          setProfileImage(parsedData.profileImage || null);
          setPhoneNumber(parsedData.phoneNumber || "");
        } else {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setEmail(data.email || "");
            setProfileImage(data.profileImage || null);
            setPhoneNumber(data.phoneNumber || "");
            // Guardar en AsyncStorage
            await AsyncStorage.setItem("userData", JSON.stringify(data));
          }
        }
      } catch (error) {
        setErrorMessage("Error al cargar datos del usuario.");
      }
    };

    fetchUserData();
  }, [user]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      try {
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
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
        setProfileImage(data.secure_url);

        // Actualizar AsyncStorage
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          parsedData.profileImage = data.secure_url;
          await AsyncStorage.setItem("userData", JSON.stringify(parsedData));
        }
      } catch (error) {
        console.log(error);
        setErrorMessage("Error al subir la imagen.");
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      setErrorMessage("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    setLoading(true);
    try {
      // Actualización de contraseña (si se ingresó una nueva)
      if (password) {
        if (!currentPassword) {
          setErrorMessage("Debes ingresar tu contraseña actual.");
          setTimeout(() => setErrorMessage(""), 1500);
          return;
        }
        const credential = EmailAuthProvider.credential(
          user.email!,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, password);
        setSuccessMessage("Contraseña actualizada con éxito");
        setTimeout(() => setSuccessMessage(""), 2000);
      }

      // Actualización de datos del perfil
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        profileImage: profileImage || null,
        phoneNumber,
      });

      // Actualización de AsyncStorage
      const userData = {
        firstName,
        lastName,
        email,
        profileImage: profileImage || null,
        phoneNumber,
      };
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      setSuccessMessage("Cambios guardados exitosamente");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error: any) {
      setErrorMessage("No se ha podido guardar los cambios.");
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
      {/* Contenedor principal con ancho máximo similar al de RegisterScreen */}
      <View style={[styles.formContainer, { maxWidth: width > 400 ? 400 : width - 40 }]}>
        <Text style={styles.title}>Editar Perfil</Text>

        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.noImageText}>Sin Imagen</Text>
          )}
          <TouchableOpacity onPress={handleImagePick} style={styles.cameraButton}>
            <FontAwesome name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { textAlign: "center", marginBottom: 20 }]}>
          {firstName} {lastName}
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
          placeholder="Contraseña Actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Nueva Contraseña"
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
            <FontAwesome
              name="sign-out"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
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

      <Modal
        transparent={true}
        visible={showSignOutModal}
        animationType="slide"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ¿Seguro que deseas cerrar sesión?
            </Text>
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
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    //padding: 20,
    backgroundColor: "#FFFFFF",
    // Se modifica el marginTop para que los componentes internos estén más abajo
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

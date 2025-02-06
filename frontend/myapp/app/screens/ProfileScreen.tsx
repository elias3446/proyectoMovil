import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
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
import { useTailwind } from "tailwind-rn";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const ProfileScreen: React.FC<{ setCurrentScreen: (screen: string) => void }> = ({ setCurrentScreen }) => {
  const tailwind = useTailwind();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // Contraseña actual para reautenticación
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setFirstName(parsedData.firstName || "");
          setLastName(parsedData.lastName || "");
          setEmail(parsedData.email || "");
          setProfileImage(parsedData.profileImage || null);
          setPhoneNumber(parsedData.phoneNumber || "");
        } else if (user) {
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
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append("file", blob, "profile.jpg");
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
        setErrorMessage("Error al subir la imagen.");
      }
    }
  };
  
  const handleUpdateProfile = async () => {
    const isPasswordStrong = (password: string): boolean => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return regex.test(password);
    };    

    if (!user || !currentPassword) {
      setErrorMessage("Debes ingresar tu contraseña actual para realizar cambios.");
      setTimeout(() => setErrorMessage(""), 1500);
      return;
    }

    setLoading(true);
    try {
      // Reautenticación
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Actualización de contraseña
      if (password) await updatePassword(user, password);

      // Actualización de Firestore
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
    } catch (error: any) {
      setErrorMessage('No se ha podido guardar los cambios, contraseña actual no coincide.');
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
        setCurrentScreen("LoginScreen"); // Cambiar la pantalla al inicio de sesión
      }, 2000);
    } catch (error) {
      setErrorMessage("Error al cerrar sesión.");
    }
  };
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Editar Perfil</Text>

          <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Sin Imagen</Text>
              </View>
            )}
          </TouchableOpacity>


          <TextInput style={styles.input} placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Apellido" value={lastName} onChangeText={setLastName} />
          <Text style={styles.sectionHeader}>Modificar contraseña</Text>
          <TextInput style={styles.input} placeholder="Contraseña actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Nueva Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.saveButton} onPress={async () => {
            if (!user || !currentPassword) {
              setErrorMessage("Debes ingresar tu contraseña actual para realizar cambios.");
              setTimeout(() => setErrorMessage(""), 1500);
              return;
            }
            setLoading(true);
            try {
              const credential = EmailAuthProvider.credential(user.email!, currentPassword);
              await reauthenticateWithCredential(user, credential);
              if (password) await updatePassword(user, password);
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, { firstName, lastName, email, profileImage: profileImage || null });
              setSuccessMessage("Cambios guardados exitosamente");
              setTimeout(() => setSuccessMessage(""), 2000);
            } catch (error) {
              setErrorMessage("Contraseña actual no coincide. No se pudo guardar los cambios.");
              setTimeout(() => setErrorMessage(""), 1500);
            } finally {
              setLoading(false);
            }
          }} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? "Guardando..." : "Guardar Cambios"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={async () => {
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
              setTimeout(() => setErrorMessage(""), 1500);
            }
          }}>

            <FontAwesome name="sign-out" size={20} color="white" style={styles.iconRight} />
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Estás seguro?</Text>
            <Text style={styles.modalText}>¿Deseas cerrar sesión?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSignOutModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSignOut}>
                <Text style={styles.confirmButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
  saveButton: {
    backgroundColor: "#1877f2",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },  
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  icon: { marginRight: 8 },
  imageContainer: { alignItems: "center", marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { color: "#9e9e9e" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  signOutButton: {
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    width: "50%",
    alignSelf: "center",
  },
  signOutButtonText: { color: "#fff", fontWeight: "bold" },
  iconRight: { marginRight: 8 },

  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  cancelButtonText: { color: "#fff", fontSize: 16 },
  confirmButton: {
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  confirmButtonText: { color: "#fff", fontSize: 16 },
});


export default ProfileScreen;
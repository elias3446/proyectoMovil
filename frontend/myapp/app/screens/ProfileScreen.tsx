import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import {
  getAuth,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import NotificationBanner from "@/Components/NotificationBanner";

interface ProfileProps {
  setCurrentScreen: (screen: string) => void;
}

const ProfileScreen: React.FC<ProfileProps> = ({ setCurrentScreen }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // Para reautenticación
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // Nuevo estado para número de teléfono

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || "");
          setProfileImage(data.profileImage || null);
          setPhoneNumber(data.phoneNumber || ""); // Recuperar número de teléfono
        }
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
      setImageLoading(true);

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
      } catch (error) {
        setErrorMessage("Error al subir la imagen.");
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Reautenticación
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      } else {
        throw new Error("Debes ingresar tu contraseña actual para realizar cambios.");
      }

      // Actualización contraseña
      if (password) await updatePassword(user, password);

      // Actualización en Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        profileImage: profileImage || null,
        phoneNumber, // Guardar número de teléfono
      });

      setSuccessMessage("Perfil actualizado exitosamente");
      setCurrentScreen("ProfileScreen");
    } catch (error: any) {
      setErrorMessage(`Error al actualizar el perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Editar Perfil</Text>

        <TouchableOpacity onPress={handleImagePick} style={styles.imagePicker}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImageFallback}>
              <Text style={styles.profileImageFallbackText}>Sin Imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña Actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Nueva Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Guardando..." : "Guardar Cambios"}</Text>
        </TouchableOpacity>
      </View>

      <NotificationBanner message={errorMessage} type="error" />
      <NotificationBanner message={successMessage} type="success" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  imagePicker: {
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImageFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#000", // Círculo negro
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageFallbackText: {
    color: "#fff", // Texto blanco sobre el fondo negro
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProfileScreen;

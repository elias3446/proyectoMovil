import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
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

const ProfileScreen: React.FC<{ setCurrentScreen: (screen: string) => void }> = ({ setCurrentScreen }) => {
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
      setTimeout(() => setSuccessMessage(""), 2000); // Mensaje desaparece después de 2 segundos
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
    <ScrollView style={{ padding: 16 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 8, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 16 }}>Editar Perfil</Text>

        <TouchableOpacity onPress={handleImagePick} style={{ alignItems: "center", marginBottom: 16 }}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#9e9e9e" }}>Sin Imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 16 }}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 16 }}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 16 }}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Modificar contraseña:</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 16 }}
          placeholder="Contraseña Actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 16 }}
          placeholder="Nueva Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={{ backgroundColor: "#A5D5A7", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 16 }}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>{loading ? "Guardando..." : "Guardar Cambios"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#1C1B17",
            padding: 10,
            borderRadius: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 40, // Espaciado adicional hacia abajo
            width: "50%", // Más pequeño horizontalmente
            alignSelf: "center", // Centrar horizontalmente
          }}
          onPress={() => setShowSignOutModal(true)}
        >

          <FontAwesome name="sign-out" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? <NotificationBanner message={errorMessage} type="error" /> : null}
      {successMessage ? <NotificationBanner message={successMessage} type="success" /> : null}

      <Modal
        transparent={true}
        visible={showSignOutModal}
        animationType="slide"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <View style={{ width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>¿Estás seguro?</Text>
            <Text style={{ marginBottom: 20 }}>¿Deseas cerrar sesión?</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                style={{ backgroundColor: "#A5D5A7", padding: 10, borderRadius: 8, flex: 1, alignItems: "center", marginRight: 10 }}
                onPress={handleSignOut}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Sí</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: "#f44336", padding: 10, borderRadius: 8, flex: 1, alignItems: "center" }}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;

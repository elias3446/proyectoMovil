import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
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
import { unregisterIndieDevice } from 'native-notify';

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
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser; // Obtén el usuario autenticado actual

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
      // Verificar si la contraseña fue cambiada
      if (password) {
        // Si hay una nueva contraseña, debemos reautenticar y luego actualizar la contraseña
        if (!currentPassword) {
          setErrorMessage("Debes ingresar tu contraseña actual.");
          setTimeout(() => setErrorMessage(""), 1500);
          return;
        }

        // Reautenticación
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Actualización de contraseña
        await updatePassword(user, password);
        setSuccessMessage("Contraseña actualizada con éxito");
        setTimeout(() => setSuccessMessage(""), 2000);
      }

      // Actualización de perfil (nombre, apellido, correo, teléfono, imagen)
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
      setErrorMessage("No se ha podido guardar los cambios.");
      setTimeout(() => setErrorMessage(""), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      unregisterIndieDevice(auth.currentUser?.uid, 27248, 'g7bm81eIUEY0Mmtod4FmYb');
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
    <ScrollView className="p-4">
      <View className="bg-white rounded-xl p-4 shadow-md">
        <Text className="text-2xl font-bold text-center mb-4">Editar Perfil</Text>

        <View className="items-center mb-4 relative">
          {profileImage ? (
            <Image source={{ uri: profileImage }} className="w-24 h-24 rounded-full" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-gray-500">Sin Imagen</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleImagePick}
            className="absolute bottom-0 right-28 bg-green-500 p-2 rounded-full"
          >
            <FontAwesome name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text className="text-center text-lg font-semibold mb-4">{firstName} {lastName}</Text>

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        
        <Text className="text-lg font-semibold mb-2">Modificar contraseña:</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Contraseña Actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Nueva Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-[#A5D6A7] p-3 rounded-lg items-center mb-4"
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <Text className="text-[#142C15] font-bold">{loading ? "Guardando..." : "Guardar Cambios"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-black p-3 rounded-lg items-center flex-row justify-center mt-10 w-1/2 self-center"
          onPress={() => setShowSignOutModal(true)}
        >
          <FontAwesome name="sign-out" size={20} color="#fff" className="mr-2" />
          <Text className="text-white font-bold">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && <NotificationBanner message={errorMessage} type="error" />}
      {successMessage && <NotificationBanner message={successMessage} type="success" />}
      
      <Modal
        transparent={true}
        visible={showSignOutModal}
        animationType="slide"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 bg-white p-5 rounded-xl">
            <Text className="text-lg font-semibold mb-4">¿Seguro que deseas cerrar sesión?</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-300 p-3 rounded-lg flex-1 mr-2"
                onPress={() => setShowSignOutModal(false)}
              >
                <Text className="text-center">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 p-3 rounded-lg flex-1 ml-2"
                onPress={handleSignOut}
              >
                <Text className="text-center text-white">Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;


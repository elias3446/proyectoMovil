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
    <View className="flex h-full w-full px-5">
      <View className="bg-white rounded-xl">
        <View className="flex-row justify-end items-center w-full">
          <TouchableOpacity
            className="px-3 rounded-lg items-center flex-row justify-center w-2/7 h-10"
            onPress={() => setShowSignOutModal(true)}
          >
            <FontAwesome name="sign-out" size={30} color="#5CB868"/>
        <Text className="text-gray-400 font-bold ">Salir</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-center mb-5 text-[#5CB868]">
          Editar Perfil
        </Text>
        
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

        <View className="border-b-2 border-gray-300 mb-4">
          <Text className="color-[#5CB868] font-semibold">Nombre</Text>
          <TextInput
            className="pt-2 pb-2"
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View className="border-b-2 border-gray-300 mb-4">
          <Text className="color-[#5CB868] font-semibold">Apellido</Text>
          <TextInput
            className="pt-2 pb-2"
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
          />
         </View>

        <View className="border-b-2 border-gray-300 mb-6">
        <Text className="color-[#5CB868] font-semibold">Correo Electrónico</Text>
          <TextInput
            className="pt-2 pb-2"
            placeholder="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        <View className="mb-4">
          <Text className="text-lg font-bold color-[#5CB868] mb-2">Modificar contraseña:</Text>
          <TextInput
            className="border-b-2 border-gray-300 pt-2 pb-2 mb-4"
            placeholder="Contraseña Actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            className="border-b-2 border-gray-300 pb-2 mb-2"
            placeholder="Nueva Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity
          className="bg-[#A5D6A7] p-3 rounded-lg items-center flex-row justify-center mt-3 w-1/2 self-center"
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <FontAwesome name="save" size={20} color="black" className="mr-2" />
          <Text className="text-[#142C15] font-bold ">{loading ? "Guardando..." : "Guardar Cambios"}</Text>
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
    </View>
  );
};

export default ProfileScreen;


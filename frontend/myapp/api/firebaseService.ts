import { 
  collection, addDoc, getDocs, updateDoc, doc, DocumentSnapshot, query, orderBy, limit, startAfter, onSnapshot, getDoc 
} from 'firebase/firestore';
import { firestore } from '@/Config/firebaseConfig';
import { Post } from '@/types/Post';
import { UserData } from '@/types/User';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc } from 'firebase/firestore';

import { uploadImageToCloudinary } from "./cloudinaryService";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  signOut,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from '@/Config/firebaseConfig';
import { registerIndieID } from 'native-notify';

/**
 * Obtiene los posts de manera paginada desde la colección "posts" en Firestore.
 * Se suscribe a los cambios en la consulta paginada y ejecuta el callback cada vez
 * que se actualizan los documentos.
 *
 * @param afterDoc - Último documento cargado (para paginación) o `undefined` para la primera página.
 * @param limitPosts - Número máximo de posts a cargar.
 * @param callback - Función a ejecutar al obtener nuevos documentos.
 * @returns Una función para cancelar la suscripción o `null` si ocurre un error.
 */
export const getPaginatedPosts = (
  afterDoc: DocumentSnapshot | undefined,
  limitPosts: number,
  callback: (newSnapshots: DocumentSnapshot[]) => void
): (() => void) | null => {
  try {
    const baseQuery = query(
      collection(firestore, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitPosts)
    );
    const paginatedQuery = afterDoc ? query(baseQuery, startAfter(afterDoc)) : baseQuery;
    const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
      const newSnapshots = snapshot.docs;
      callback(newSnapshots);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error obteniendo posts paginados:", error);
    return null;
  }
};

/**
 * Agrega un nuevo post a la colección "posts" en Firestore.
 *
 * @param post - Objeto que representa el post (sin el campo 'id').
 * @returns Una promesa que se resuelve con el ID del post agregado.
 * @throws Error si ocurre algún problema al agregar el post.
 */
export const addPost = async (post: Omit<Post, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(firestore, "posts"), post);
    return docRef.id;
  } catch (error: any) {
    console.error("Error al agregar el post:", error);
    throw new Error("Error al agregar el post: " + error.message);
  }
};

/**
 * Actualiza un post existente en la colección "posts" de Firestore.
 *
 * @param postId - ID del post a actualizar.
 * @param data - Datos a actualizar.
 * @throws Error si ocurre algún problema al actualizar el post.
 */
export const updatePost = async (postId: string, data: any): Promise<void> => {
  try {
    const docRef = doc(firestore, "posts", postId);
    await updateDoc(docRef, data);
  } catch (error: any) {
    console.error('Error al actualizar el post:', error);
    throw new Error("Error al actualizar el post: " + error.message);
  }
};

/**
 * Obtiene todos los usuarios de la colección "users" en Firestore.
 *
 * @returns Un mapa de usuarios (ID -> UserData).
 */
export const getAllUsers = async (): Promise<Map<string, UserData>> => {
  const usersMap = new Map<string, UserData>();
  try {
    const snapshot = await getDocs(collection(firestore, "users"));
    snapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      usersMap.set(docSnap.id, {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        profileImage: userData.profileImage || null,
      });
    });
  } catch (error) {
    console.error("Error al obtener los datos de los usuarios:", error);
  }
  return usersMap;
};

/**
 * Obtiene la URL de la imagen de perfil de un usuario a partir de su ID.
 *
 * @param userId - ID del usuario.
 * @returns La URL de la imagen de perfil o `null` si no se encuentra o hay un error.
 */
export const getProfileImageById = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(collection(firestore, "users"), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.profileImage || null;
    } else {
      console.warn(`Usuario con ID ${userId} no encontrado.`);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener la imagen de perfil:", error);
    return null;
  }
};

/**
 * Registra un usuario en Firebase Authentication y en Firestore.
 *
 * @param userData - Datos del usuario a registrar.
 * @returns El usuario registrado.
 * @throws Error si ocurre algún problema durante el registro.
 */
export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  pronoun: string;
  customGender: string;
  profileImage?: string | null;
}): Promise<User> => {
  try {
    const authInstance = getAuth();
    const db = getFirestore();
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      userData.email.trim(),
      userData.password.trim()
    );
    const user = userCredential.user;
    const data = {
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      email: userData.email.trim(),
      birthDay: userData.birthDay,
      birthMonth: userData.birthMonth,
      birthYear: userData.birthYear,
      gender: userData.gender,
      pronoun: userData.pronoun ||
        (userData.gender === "F" ? "Femenino" : userData.gender === "M" ? "Masculino" : ""),
      customGender: userData.customGender.trim(),
      profileImage: userData.profileImage || null,
    };
    await setDoc(doc(db, "users", user.uid), data);
    return user;
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    throw new Error(`Error al registrar: ${error.message}`);
  }
};

/**
 * Reautentica al usuario y actualiza su correo y/o contraseña.
 *
 * @param user - Usuario autenticado.
 * @param newEmail - Nuevo correo electrónico (opcional).
 * @param newPassword - Nueva contraseña (opcional).
 * @param currentPassword - Contraseña actual (requerida para reautenticación).
 * @throws Error si ocurre algún problema durante la reautenticación o actualización.
 */
export const updateUserCredentials = async (
  user: User,
  newEmail: string | undefined,
  newPassword: string | undefined,
  currentPassword: string
): Promise<void> => {
  if (!currentPassword) {
    throw new Error("Debes ingresar tu contraseña actual");
  }
  try {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
    if (newEmail && newEmail !== user.email) {
      await updateEmail(user, newEmail);
    }
    if (newPassword) {
      if (newPassword === currentPassword) {
        throw new Error("La nueva contraseña debe ser diferente a la actual.");
      }
      await updatePassword(user, newPassword);
    }
  } catch (error: any) {
    console.error("Error al actualizar las credenciales del usuario:", error);
    throw new Error(error.message);
  }
};

/**
 * Actualiza la información del perfil de un usuario en Firestore.
 *
 * @param userId - ID del usuario.
 * @param data - Datos a actualizar (nombre, apellido, correo, teléfono y opcionalmente imagen de perfil).
 * @throws Error si ocurre algún problema al actualizar la información.
 */
export const updateUserProfileData = async (
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profileImage?: string | null;
  }
): Promise<void> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  } catch (error: any) {
    console.error("Error al actualizar la información del perfil:", error);
    throw new Error("Error al actualizar la información del perfil: " + error.message);
  }
};

/**
 * Cierra la sesión del usuario y limpia el AsyncStorage.
 *
 * @throws Error si ocurre algún problema al cerrar sesión o limpiar el almacenamiento.
 */
export const signOutUser = async (): Promise<void> => {
  try {
    const authInstance = getAuth();
    await signOut(authInstance);
    await AsyncStorage.clear();
  } catch (error: any) {
    console.error("Error al cerrar sesión:", error);
    throw new Error("Error al cerrar sesión: " + error.message);
  }
};

/**
 * Sube la imagen de perfil usando Cloudinary y retorna la URL segura.
 *
 * @param imageUri - URI de la imagen a subir.
 * @returns La URL segura de la imagen.
 * @throws Error si ocurre algún problema durante la subida.
 */
export const uploadProfileImage = async (imageUri: string): Promise<string> => {
  try {
    const secureUrl = await uploadImageToCloudinary({ uri: imageUri }, "profile_images");
    return secureUrl;
  } catch (error: any) {
    console.error("Error al subir la imagen de perfil:", error);
    throw new Error("Error al subir la imagen de perfil: " + error.message);
  }
};

/**
 * Inicia sesión con correo y contraseña.
 * Además, registra al usuario para notificaciones (solo en dispositivos móviles).
 *
 * @param email - Correo electrónico del usuario.
 * @param password - Contraseña del usuario.
 * @returns Objeto de credenciales del usuario.
 * @throws Error si ocurre algún problema durante el inicio de sesión.
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (Platform.OS !== 'web') {
      // Parámetros específicos para Native Notify
      registerIndieID(userCredential.user.uid, 27248, 'g7bm81eIUEY0Mmtod4FmYb');
    } else {
      console.log('Registro de notificaciones omitido en web');
    }
    return userCredential;
  } catch (error: any) {
    console.error("Error al iniciar sesión:", error);
    throw new Error("Error al iniciar sesión: " + error.message);
  }
};

/**
 * Se suscribe a los mensajes de un usuario en Firestore.
 *
 * @param userUid - UID del usuario del que se quieren escuchar los mensajes.
 * @param callback - Función a ejecutar al actualizarse los mensajes.
 * @param errorCallback - Función a ejecutar si ocurre un error.
 * @returns Una función para cancelar la suscripción.
 */
export const subscribeToUserMessages = (
  userUid: string,
  callback: (messages: Message[]) => void,
  errorCallback: (error: any) => void
) => {
  const db = getFirestore();
  const userMessagesRef = collection(db, 'users', userUid, 'messages');
  const q = query(userMessagesRef, orderBy('timestamp'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text,
          sender: data.sender,
          receiver: data.receiver,
          timestamp: data.timestamp,
        };
      });
      // Aseguramos que estén ordenados cronológicamente
      messagesData.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      callback(messagesData);
    },
    errorCallback
  );
  return unsubscribe;
};

/**
 * Envía el mensaje del usuario y solicita la respuesta del bot.
 * Se almacena el mensaje en las colecciones de ambos usuarios (emisor y receptor).
 *
 * @param userUid - UID del usuario emisor.
 * @param receiverUid - UID del receptor (por ejemplo, un chatbot).
 * @param userMessageText - Texto del mensaje enviado por el usuario.
 * @returns La respuesta del bot (texto).
 * @throws Error si falla la llamada a la API o el almacenamiento.
 */
export const sendChatAndBotResponse = async (
  userUid: string,
  receiverUid: string,
  userMessageText: string
): Promise<string> => {
  try {
    const db = getFirestore();
    const userMessagesRef = collection(db, 'users', userUid, 'messages');
    const receiverMessagesRef = collection(db, 'users', receiverUid, 'messages');

    // Mensaje del usuario
    const userMessage = {
      text: userMessageText,
      sender: userUid,
      receiver: receiverUid,
      timestamp: new Date(),
    };

    // Guarda el mensaje en ambas colecciones
    await Promise.all([
      addDoc(userMessagesRef, userMessage),
      addDoc(receiverMessagesRef, userMessage),
    ]);

    // Solicita la respuesta del bot a la API
    const response = await fetch('https://proyectomovil-qh8q.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessageText, user: userUid }),
    });
    if (!response.ok) {
      throw new Error('Error al obtener la respuesta de la API');
    }
    const responseData = await response.json();
    const botResponseText = responseData?.response || 'No se obtuvo una respuesta válida.';

    // Mensaje del bot
    const botMessage = {
      text: botResponseText,
      sender: receiverUid,
      receiver: userUid,
      timestamp: new Date(),
    };

    // Guarda la respuesta del bot en ambas colecciones
    await Promise.all([
      addDoc(userMessagesRef, botMessage),
      addDoc(receiverMessagesRef, botMessage),
    ]);

    return botResponseText;
  } catch (error: any) {
    console.error("Error en sendChatAndBotResponse:", error);
    throw new Error("Error al enviar el mensaje y obtener la respuesta: " + error.message);
  }
};

/**
 * Envía un correo electrónico para recuperación de contraseña.
 *
 * @param email - Correo electrónico al que se enviará el mensaje.
 * @throws Error si ocurre algún problema durante el envío.
 */
export const sendRecoveryEmail = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Error al enviar el correo de recuperación:", error);
    throw new Error("Error al enviar el correo de recuperación: " + error.message);
  }
};

/**
 * Guarda la respuesta del bot en ambas colecciones de mensajes.
 *
 * @param userUid - UID del receptor (usuario).
 * @param receiverUid - UID del emisor (por ejemplo, el chatbot).
 * @param responseText - Texto de la respuesta del bot.
 * @throws Error si ocurre algún problema al guardar la respuesta.
 */
export const saveBotResponseMessage = async (
  userUid: string,
  receiverUid: string,
  responseText: string
): Promise<void> => {
  try {
    const botMessage = {
      text: responseText,
      sender: receiverUid,
      receiver: userUid,
      timestamp: new Date(),
    };
    await Promise.all([
      addDoc(collection(firestore, 'users', userUid, 'messages'), botMessage),
      addDoc(collection(firestore, 'users', receiverUid, 'messages'), botMessage),
    ]);
  } catch (error: any) {
    console.error("Error al guardar la respuesta del bot:", error);
    throw new Error("Error al guardar la respuesta del bot: " + error.message);
  }
};

/**
 * Guarda un mensaje de foto (con la URL de la imagen) en las colecciones de mensajes de ambos usuarios.
 *
 * @param userUid - UID del usuario emisor.
 * @param receiverUid - UID del receptor.
 * @param imageUrl - URL de la imagen ya subida a Cloudinary.
 * @throws Error si ocurre algún problema al guardar el mensaje.
 */
export const savePhotoMessage = async (
  userUid: string,
  receiverUid: string,
  imageUrl: string
): Promise<void> => {
  try {
    const message = {
      text: imageUrl,
      sender: userUid,
      receiver: receiverUid,
      timestamp: new Date(),
    };
    await Promise.all([
      addDoc(collection(firestore, 'users', userUid, 'messages'), message),
      addDoc(collection(firestore, 'users', receiverUid, 'messages'), message),
    ]);
  } catch (error: any) {
    console.error("Error al guardar el mensaje de foto:", error);
    throw new Error("Error al guardar el mensaje de foto: " + error.message);
  }
};

/**
 * Retorna el usuario actualmente autenticado.
 *
 * @returns El usuario autenticado o `null` si no hay sesión iniciada.
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Definición del tipo de mensaje.
 */
export interface Message {
  id?: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: any; // Por lo general, un Firestore Timestamp
  isSending?: boolean;
}

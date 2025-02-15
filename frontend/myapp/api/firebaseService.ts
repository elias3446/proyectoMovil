/*****************************************************
 *                Firebase Services                *
 *  Funciones agrupadas por módulos: Posts, Usuarios, *
 *  Autenticación, Chat y Custom Hooks.              *
 *****************************************************/

/* #region Imports */
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  DocumentSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { firestore, auth } from '@/Config/firebaseConfig';
import { Post } from '@/types/Post';
import { UserData } from '@/types/User';
import { uploadImageToCloudinary } from "./cloudinaryService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { registerIndieID } from 'native-notify';
import { useState, useEffect } from "react";
import { SortType } from '@/types/SortType';
/* #endregion Imports */

/* ====================================================
   =============== POSTS SERVICES =====================
   ==================================================== */

/**
 * getPaginatedPosts
 * -----------------
 * Obtiene los posts de forma paginada.
 * 
 * @param afterDoc - Último documento cargado para paginación (o undefined).
 * @param limitPosts - Número máximo de posts a obtener.
 * @param callback - Función a ejecutar con los nuevos documentos.
 * @param sortType - Define el campo por el cual se ordenarán los posts.
 * @param realtime - Indica si se debe escuchar en tiempo real o no.
 * @returns Función para cancelar la suscripción o null en caso de error.
 */
export const getPaginatedPosts = (
  afterDoc: DocumentSnapshot | undefined,
  limitPosts: number,
  callback: (newSnapshots: DocumentSnapshot[]) => void,
  sortType: SortType,
  realtime: boolean = false
): (() => void) | null => {
  try {
    const baseQuery = query(
      collection(firestore, "posts"),
      orderBy(sortType, "desc"),
      limit(limitPosts)
    );
    const paginatedQuery = afterDoc ? query(baseQuery, startAfter(afterDoc)) : baseQuery;

    if (realtime) {
      // Escucha en tiempo real
      const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
        callback(snapshot.docs);
      });
      return unsubscribe;
    } else {
      // Consulta única
      getDocs(paginatedQuery)
        .then((snapshot) => {
          callback(snapshot.docs);
        })
        .catch((error) => {
          console.error("Error obteniendo posts paginados:", error);
        });

      return () => {}; // Devuelve una función vacía para mantener la firma
    }
  } catch (error: any) {
    console.error("Error obteniendo posts paginados:", error);
    return null;
  }
};

/**
 * addPost
 * -------
 * Agrega un nuevo post a la colección "posts".
 *
 * @param post - Objeto del post (sin el campo 'id').
 * @returns ID del post creado.
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
 * updatePost
 * ----------
 * Actualiza un post existente.
 *
 * @param postId - ID del post a actualizar.
 * @param data - Datos a actualizar (Partial para mayor flexibilidad).
 */
export const updatePost = async (postId: string, data: Partial<Post>): Promise<void> => {
  try {
    const docRef = doc(firestore, "posts", postId);
    await updateDoc(docRef, data);
  } catch (error: any) {
    console.error("Error al actualizar el post:", error);
    throw new Error("Error al actualizar el post: " + error.message);
  }
};

/* ====================================================
   ============== USER SERVICES =======================
   ==================================================== */

/**
 * getAllUsers
 * -----------
 * Obtiene todos los usuarios de Firestore y retorna un mapa (ID → UserData).
 */
export const getAllUsers = async (): Promise<Map<string, UserData>> => {
  const usersMap = new Map<string, UserData>();
  try {
    const snapshot = await getDocs(collection(firestore, "users"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      usersMap.set(docSnap.id, {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        profileImage: data.profileImage || null,
      });
    });
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
  }
  return usersMap;
};

/**
 * getProfileImageById
 * -------------------
 * Obtiene la URL de la imagen de perfil de un usuario por su ID.
 */
export const getProfileImageById = async (userId: string): Promise<string | null> => {
  try {
    const userSnap = await getDoc(doc(firestore, "users", userId));
    if (userSnap.exists()) {
      return userSnap.data().profileImage || null;
    }
    console.warn(`Usuario con ID ${userId} no encontrado.`);
    return null;
  } catch (error) {
    console.error("Error obteniendo imagen de perfil:", error);
    return null;
  }
};

/**
 * registerUser
 * ------------
 * Registra un nuevo usuario en Firebase Authentication y almacena su información en Firestore.
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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
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
      pronoun:
        userData.pronoun ||
        (userData.gender === "F" ? "Femenino" : userData.gender === "M" ? "Masculino" : ""),
      customGender: userData.customGender.trim(),
      profileImage: userData.profileImage || null,
    };
    await setDoc(doc(firestore, "users", user.uid), data);
    return user;
  } catch (error: any) {
    console.error("Error registrando usuario:", error);
    throw new Error("Error al registrar: " + error.message);
  }
};

/**
 * updateUserProfileData
 * ---------------------
 * Actualiza la información del perfil del usuario en Firestore.
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
    await updateDoc(doc(firestore, "users", userId), data);
  } catch (error: any) {
    console.error("Error actualizando perfil:", error);
    throw new Error("Error al actualizar el perfil: " + error.message);
  }
};

/**
 * uploadProfileImage
 * ------------------
 * Sube una imagen de perfil a Cloudinary y retorna la URL segura.
 */
export const uploadProfileImage = async (imageUri: string): Promise<string> => {
  try {
    const secureUrl = await uploadImageToCloudinary({ uri: imageUri }, "profile_images");
    return secureUrl;
  } catch (error: any) {
    console.error("Error subiendo imagen de perfil:", error);
    throw new Error("Error subiendo imagen: " + error.message);
  }
};

/* ====================================================
   ============== AUTHENTICATION SERVICES =============
   ==================================================== */

/**
 * updateUserCredentials
 * -----------------------
 * Actualiza las credenciales del usuario (correo y/o contraseña) después de reautenticarse.
 *
 * @param user - Usuario autenticado.
 * @param newEmail - Nuevo correo electrónico (opcional).
 * @param newPassword - Nueva contraseña (opcional).
 * @param currentPassword - Contraseña actual para reautenticación.
 */
export const updateUserCredentials = async (
  user: User,
  newEmail: string | undefined,
  newPassword: string | undefined,
  currentPassword: string
): Promise<void> => {
  if (!currentPassword) {
    throw new Error("La contraseña actual es requerida.");
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
    console.error("Error actualizando credenciales:", error);
    throw new Error(error.message);
  }
};

/**
 * signOutUser
 * -----------
 * Cierra la sesión del usuario y limpia el almacenamiento local.
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    await AsyncStorage.clear();
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    throw new Error("Error cerrando sesión: " + error.message);
  }
};

/**
 * loginUser
 * ---------
 * Inicia sesión con correo y contraseña, y registra notificaciones (en dispositivos móviles).
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    if (Platform.OS !== 'web') {
      registerIndieID(userCredential.user.uid, 27248, 'g7bm81eIUEY0Mmtod4FmYb');
    } else {
      console.log('Registro de notificaciones omitido en web');
    }
    return userCredential;
  } catch (error: any) {
    console.error("Error iniciando sesión:", error);
    throw new Error("Error iniciando sesión: " + error.message);
  }
};

/**
 * sendRecoveryEmail
 * -----------------
 * Envía un correo de recuperación de contraseña.
 */
export const sendRecoveryEmail = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Error enviando correo de recuperación:", error);
    throw new Error("Error enviando correo de recuperación: " + error.message);
  }
};

/**
 * getCurrentUser
 * --------------
 * Retorna el usuario autenticado actualmente.
 */
export const getCurrentUser = (): User | null => auth.currentUser;

/* ====================================================
   =================== CHAT SERVICES ==================
   ==================================================== */

/**
 * Interfaz Message
 * ---------------
 * Define la estructura de un mensaje.
 */
export interface Message {
  id?: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: any; // Firestore Timestamp o Date
  isSending?: boolean;
}

/**
 * subscribeToUserMessages
 * -----------------------
 * Se suscribe a los mensajes del usuario y ejecuta el callback con los mensajes actualizados.
 */
export const subscribeToUserMessages = (
  userUid: string,
  callback: (messages: Message[]) => void,
  errorCallback: (error: any) => void
) => {
  const messagesRef = collection(firestore, 'users', userUid, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp'));
  const unsubscribe = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text,
          sender: data.sender,
          receiver: data.receiver,
          timestamp: data.timestamp,
        };
      });
      // Ordenar mensajes cronológicamente
      messages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      callback(messages);
    },
    errorCallback
  );
  return unsubscribe;
};

/**
 * sendChatAndBotResponse
 * -----------------------
 * Envía un mensaje de chat y solicita la respuesta del bot a la API.
 * Guarda el mensaje del usuario y la respuesta del bot en ambas colecciones.
 *
 * @returns La respuesta del bot.
 */
export const sendChatAndBotResponse = async (
  userUid: string,
  receiverUid: string,
  userMessageText: string
): Promise<string> => {
  try {
    const userMessagesRef = collection(firestore, 'users', userUid, 'messages');
    const receiverMessagesRef = collection(firestore, 'users', receiverUid, 'messages');

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

    // Solicita respuesta del bot a la API
    const response = await fetch('https://proyectomovil-1.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessageText, user: userUid }),
    });
    if (!response.ok) {
      throw new Error('Error obteniendo respuesta de la API');
    }
    const { response: botResponseText } = await response.json();
    const finalBotResponse = botResponseText || 'Respuesta no válida.';

    // Mensaje del bot
    const botMessage = {
      text: finalBotResponse,
      sender: receiverUid,
      receiver: userUid,
      timestamp: new Date(),
    };

    // Guarda la respuesta del bot en ambas colecciones
    await Promise.all([
      addDoc(userMessagesRef, botMessage),
      addDoc(receiverMessagesRef, botMessage),
    ]);

    return finalBotResponse;
  } catch (error: any) {
    console.error("Error en chat y respuesta bot:", error);
    throw new Error("Error en chat/bot: " + error.message);
  }
};

/**
 * saveBotResponseMessage
 * ----------------------
 * Guarda la respuesta del bot en ambas colecciones de mensajes.
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
    console.error("Error guardando respuesta bot:", error);
    throw new Error("Error guardando respuesta bot: " + error.message);
  }
};

/**
 * savePhotoMessage
 * ----------------
 * Guarda un mensaje de foto en las colecciones de mensajes de ambos usuarios.
 */
export const savePhotoMessage = async (
  userUid: string,
  receiverUid: string,
  imageUrl: string
): Promise<void> => {
  try {
    const photoMessage = {
      text: imageUrl,
      sender: userUid,
      receiver: receiverUid,
      timestamp: new Date(),
    };
    await Promise.all([
      addDoc(collection(firestore, 'users', userUid, 'messages'), photoMessage),
      addDoc(collection(firestore, 'users', receiverUid, 'messages'), photoMessage),
    ]);
  } catch (error: any) {
    console.error("Error guardando mensaje de foto:", error);
    throw new Error("Error guardando mensaje de foto: " + error.message);
  }
};

/* ====================================================
   ================= CUSTOM HOOKS =====================
   ==================================================== */

/**
 * IUserData
 * ---------
 * Define la estructura de los datos del usuario.
 */
export interface IUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
}

/**
 * useFirebaseProfile
 * ------------------
 * Hook que retorna el usuario autenticado y escucha en tiempo real
 * los cambios en su perfil en Firestore.
 */
export const useFirebaseProfile = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<IUserData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profileImage: null,
  });

  // Escucha cambios en la autenticación
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribeAuth();
  }, []);

  // Escucha en tiempo real el documento del usuario en Firestore
  useEffect(() => {
    if (currentUser) {
      const userRef = doc(firestore, "users", currentUser.uid);
      const unsubscribeSnapshot = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phoneNumber: data.phoneNumber || "",
              profileImage: data.profileImage || null,
            });
          }
        },
        (error) => console.error("Error en snapshot del usuario:", error)
      );
      return () => unsubscribeSnapshot();
    }
  }, [currentUser]);

  return { currentUser, userData };
};

import { getFirestore, setDoc, collection, addDoc, getDocs, updateDoc, doc, DocumentSnapshot, query, orderBy, limit, startAfter, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/Config/firebaseConfig';
import { Post } from '@/types/Post';
import { UserData } from '@/types/User';
import { onAuthStateChanged, signInWithEmailAndPassword, User, getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth";
import { Platform } from 'react-native';
import { Message } from '@/interfaces/Message';

/**
 * Se suscribe a los cambios en la autenticación del usuario.
 *
 * @param {Function} callback - Función que se ejecuta cada vez que cambia el estado de autenticación.
 *                              Recibe el usuario actual (o null) como argumento.
 * @returns {Function} Función para cancelar la suscripción.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};


/**
 * Función para iniciar sesión con correo y contraseña.
 *
 * @param email - El correo electrónico del usuario.
 * @param password - La contraseña del usuario.
 * @returns La promesa de autenticación.
 */
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Registra a un usuario nuevo en Firebase Authentication y almacena sus datos en Firestore.
 *
 * @param email - Correo electrónico del usuario.
 * @param password - Contraseña del usuario.
 * @param userData - Datos adicionales del usuario que se almacenarán en Firestore.
 * @returns La credencial del usuario registrado.
 */
export const registerUser = async (
  email: string,
  password: string,
  userData: Record<string, any>
) => {
  const auth = getAuth();
  const db = getFirestore();
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await setDoc(doc(db, "users", userCredential.user.uid), userData);
  return userCredential;
};

/**
 * Envía un correo de recuperación de contraseña al email proporcionado.
 *
 * @param email - Correo electrónico del usuario.
 * @returns Una promesa que se resuelve al enviar el correo.
 */
export const resetUserPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Obtiene los posts de manera paginada desde la colección "posts" en Firestore.
 * 
 * Este método realiza una consulta paginada para cargar los posts en bloques (páginas),
 * ordenados por la fecha de creación de manera descendente. Al pasar un documento de referencia 
 * (afterDoc), la consulta se ajustará para cargar los posts después del último documento de 
 * la página anterior, permitiendo la paginación. 
 * 
 * @param afterDoc - (Opcional) El último documento cargado en la página anterior. Si se pasa, 
 *                  la consulta cargará los posts después de este documento (paginación). 
 *                  Si no se pasa, la consulta cargará la primera página de posts.
 * @param limitPosts - El número máximo de posts a cargar por cada consulta (página).
 * @param callback - Una función de callback que se ejecutará cada vez que se obtengan nuevos 
 *                  documentos. Recibirá un arreglo de los nuevos `DocumentSnapshot`s cargados.
 * @returns Un callback para cancelar la suscripción (`unsubscribe`) a los cambios de la consulta. 
 *                  Este callback debe llamarse cuando ya no se necesiten más actualizaciones de los 
 *                  posts o cuando se desee detener la consulta paginada. Retorna null si ocurre un error.
 */
export const getPaginatedPosts = (
  afterDoc: DocumentSnapshot | undefined, // último documento cargado
  limitPosts: number, // Límite de posts a cargar por cada página
  callback: (newSnapshots: DocumentSnapshot[]) => void // Función de callback para manejar los nuevos documentos cargados
): (() => void) | null => {
  try {
    // Crea una consulta base para obtener los posts, ordenados por fecha de creación de manera descendente,
    // y limitados al número especificado.
    const queryRef = query(
      collection(firestore, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitPosts)
    );

    // Si se pasa un documento de referencia (afterDoc), se agrega la cláusula 'startAfter' para paginar
    // y continuar cargando después del último documento de la página anterior.
    const paginatedQuery = afterDoc ? query(queryRef, startAfter(afterDoc)) : queryRef;

    // Se suscribe a los cambios en la consulta paginada utilizando 'onSnapshot'.
    const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
      const newSnapshots = snapshot.docs; // Obtiene los documentos nuevos del snapshot
      callback(newSnapshots); // Llama a la función callback pasando los nuevos documentos
    })

    // Retorna la función para cancelar la suscripción cuando sea necesario.
    return unsubscribe;
  } catch (error) {
    console.error("Error obteniendo posts paginados:", error);
    return null;
  }
}

/**
 * Agrega un nuevo post a la colección "posts" en Firestore.
 * 
 * @param {Omit<Post, 'id'>} post - Objeto que representa el post a agregar, excluyendo el campo 'id'.
 * @returns {Promise<string | undefined>} - Retorna el ID del post agregado o `undefined` si ocurre un error.
 */
export const addPost = async (post: Omit<Post, 'id'>): Promise<string | undefined> => {
  try {
    const docRef = await addDoc(collection(firestore, "posts"), post);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar el post: ", error);
  }
}

/**
 * Actualiza un post existente en la colección "posts" de Firestore.
 * 
 * @param postId - ID del post que se desea actualizar.
 * @param data - Datos a actualizar en el post.
 */
export const updatePost = async (postId: string, data: any) => {
  try {
    const docRef = doc(firestore, "posts", postId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error al actualizar el post: ', error);
  }
}

/**
 * Obtiene todos los usuarios de la colección "users" en Firestore.
 * @returns {Promise<Map<string, UserData>>} Mapa de usuarios con sus datos.
 */
export const getAllUsers = async (): Promise<Map<string, UserData>> => {
  const usersMap = new Map<string, UserData>();

  try {
    const snapshot = await getDocs(collection(firestore, "users"));
    snapshot.forEach((doc) => {
      const userData = doc.data();
      usersMap.set(doc.id, {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        profileImage: userData.profileImage || null,
      });
    });
  } catch (error) {
    console.error("Error al obtener los datos de los usuarios:", error);
  }

  return usersMap;
}

/**
 * Obtiene la URL de la imagen de perfil de un usuario a partir de su ID.
 * 
 * @param userId - ID del usuario cuyo perfil se desea obtener.
 * @returns {Promise<string | null>} - Retorna la URL de la imagen de perfil si existe, o `null` si no se encuentra o hay un error.
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
 * Cierra la sesión del usuario actual.
 *
 * @returns {Promise<void>} - Una promesa que se resuelve cuando la sesión se ha cerrado.
 */
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Reautentica al usuario utilizando su contraseña actual.
 *
 * @param user - Usuario actual que se desea reautenticar.
 * @param currentPassword - Contraseña actual del usuario.
 * @returns {Promise<void>} - Una promesa que se resuelve si la reautenticación es exitosa.
 */
export const reauthenticateUser = async (
  user: any,
  currentPassword: string
): Promise<void> => {
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
};

/**
 * Actualiza el correo electrónico del usuario en Firebase Authentication.
 *
 * @param user - Usuario actual al que se le actualizará el correo electrónico.
 * @param newEmail - Nuevo correo electrónico que se desea asignar.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el correo ha sido actualizado.
 */
export const updateUserEmail = async (
  user: any,
  newEmail: string
): Promise<void> => {
  await updateEmail(user, newEmail);
};

/**
 * Actualiza la contraseña del usuario en Firebase Authentication.
 *
 * @param user - Usuario actual al que se le actualizará la contraseña.
 * @param newPassword - Nueva contraseña que se desea asignar.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando la contraseña ha sido actualizada.
 */
export const updateUserPassword = async (
  user: any,
  newPassword: string
): Promise<void> => {
  await updatePassword(user, newPassword);
};

/**
 * Actualiza el documento del usuario en Firestore con los nuevos datos del perfil.
 *
 * @param uid - ID del usuario cuyo documento se actualizará.
 * @param data - Objeto con los nuevos datos del perfil.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando los datos han sido actualizados.
 */
export const updateUserProfile = async (
  uid: string,
  data: Record<string, any>
): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

/**
 * Suscribe a los cambios en tiempo real del documento del usuario en Firestore.
 *
 * @param uid - ID del usuario cuyo documento se desea escuchar.
 * @param onData - Función callback que se ejecuta cuando se reciben nuevos datos.
 * @param onError - Función callback que se ejecuta en caso de error.
 * @returns La función para cancelar la suscripción.
 */
export const subscribeToUserDoc = (
  uid: string,
  onData: (data: any) => void,
  onError: (error: any) => void
) => {
  const db = getFirestore();
  const userRef = doc(db, "users", uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    },
    onError
  );
};

/**
 * Sube una imagen de perfil a Cloudinary y retorna la URL segura de la imagen.
 *
 * @param imageUri - URI de la imagen que se desea subir.
 * @returns {Promise<string>} - Una promesa que se resuelve con la URL de la imagen si la subida es exitosa.
 * @throws {Error} - Lanza un error si no se obtiene la URL de la imagen.
 */
export const uploadProfileImage = async (imageUri: string): Promise<string> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // Para web: convertir la imagen a blob.
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append("file", blob, "profile.jpg");
  } else {
    // Para dispositivos móviles: se utiliza el objeto URI.
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);
  }

  // Configuración del preset y carpeta en Cloudinary.
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
    return data.secure_url;
  } else {
    throw new Error("Error al obtener la URL de la imagen.");
  }
};

/**
 * Obtiene el usuario actual autenticado.
 *
 * @returns {User | null} - Retorna el usuario actual o `null` si no hay ningún usuario autenticado.
 */
export const getCurrentUser = (): User | null => {
  return getAuth().currentUser;
};

/**
 * Se suscribe a los mensajes del usuario en Firestore.
 * @param userId - ID del usuario.
 * @param setMessages - Función callback que recibe el arreglo de mensajes.
 * @param setError - Función callback que se ejecuta en caso de error.
 * @returns Función para cancelar la suscripción.
 */
export const subscribeToChatMessages = (
  userId: string,
  setMessages: (messages: Message[]) => void,
  setError: (error: any) => void,
)=>{
  const db = getFirestore();
  const userMessagesRef = collection(db, 'users', userId, 'messages');
  const q = query(userMessagesRef, orderBy('timestamp'));
  return onSnapshot(
          q,
          (querySnapshot) => {
            const messagesData: Message[] = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                text: data.text,
                sender: data.sender,
                receiver: data.receiver,
                timestamp: data.timestamp,
              } as Message;
            });
            // Ordena por timestamp (por seguridad, aunque el query ya lo ordene)
            messagesData.sort(
              (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
            );
            setMessages(messagesData);
          },
          (err) => {
            console.error('Error al cargar mensajes:', err);
            setError('Error al cargar mensajes.');
          }
        );
};

/**
 * Envía un mensaje a Firestore.
 * Guarda el mensaje en la subcolección "messages" del remitente y del receptor.
 * @param senderId - ID del remitente.
 * @param receiverId - ID del receptor.
 * @param messageText - Texto del mensaje.
 */
export const sendChatMessage = async (
  senderId: string,
  receiverId: string,
  senderMessage: Omit<Message, 'id'>,
) => {
  const db = getFirestore();
  const userMessagesRef = collection(db, 'users', senderId, 'messages');
  const receiverMessagesRef = collection(db, 'users', receiverId, 'messages');
  await Promise.all([
    addDoc(userMessagesRef, senderMessage),
    addDoc(receiverMessagesRef, senderMessage),
  ]);
};
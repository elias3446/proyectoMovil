
import { collection, addDoc, getDocs, updateDoc, doc, DocumentSnapshot, query, orderBy, limit, startAfter, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/Config/firebaseConfig';
import { Post } from '@/types/Post';
import { UserData } from '@/types/User';
import { User, onAuthStateChanged } from 'firebase/auth';

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
      orderBy(sortType, "desc"),
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
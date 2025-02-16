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
} from "firebase/firestore";
import { auth, firestore } from "@/Config/firebaseConfig";
import { Post } from "@/types/Post";
import { UserData } from "@/types/User";
import { User, onAuthStateChanged } from "firebase/auth";
import { SortType } from "@/types/SortType";

/**
 * subscribeToAuthChanges:
 * Se suscribe a los cambios en la autenticación del usuario.
 * Cada vez que el estado del usuario cambia, se ejecuta el callback proporcionado.
 *
 * @param callback - Función que se ejecuta con el usuario actual (o null) cuando cambia el estado de autenticación.
 * @returns Una función para cancelar la suscripción.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * getPaginatedPosts:
 * Realiza una consulta paginada a la colección "posts" de Firestore.
 *
 * La consulta ordena los posts según el campo especificado en sortType (usualmente la fecha de creación)
 * en orden descendente, y limita el número de documentos a cargar por página.
 * Si se proporciona un documento (afterDoc), se usa para la paginación (startAfter).
 * Además, se puede activar el modo realtime para recibir actualizaciones en vivo.
 *
 * @param afterDoc - (Opcional) Último documento de la página anterior para paginar.
 * @param limitPosts - Número máximo de posts a cargar en la consulta.
 * @param callback - Función que se ejecuta con un arreglo de DocumentSnapshot cada vez que se reciben nuevos documentos.
 * @param sortType - Campo por el cual se ordenarán los posts.
 * @param realtime - Indica si se debe usar una suscripción en tiempo real (onSnapshot) o una consulta única.
 * @returns Una función para cancelar la suscripción si se usa el modo realtime; de lo contrario, una función vacía.
 */
export const getPaginatedPosts = (
  afterDoc: DocumentSnapshot | undefined,
  limitPosts: number,
  callback: (newSnapshots: DocumentSnapshot[]) => void,
  sortType: SortType,
  realtime: boolean = false
): (() => void) | null => {
  try {
    // Se crea la consulta base a la colección "posts", ordenada en forma descendente según el campo indicado
    const baseQuery = query(
      collection(firestore, "posts"),
      orderBy(sortType, "desc"),
      limit(limitPosts)
    );

    // Si se proporciona un documento para paginación, se añade el filtro 'startAfter'
    const paginatedQuery = afterDoc ? query(baseQuery, startAfter(afterDoc)) : baseQuery;

    if (realtime) {
      // Modo en tiempo real: se suscribe a los cambios usando onSnapshot
      const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
        // Se obtienen los documentos nuevos del snapshot
        const newSnapshots = snapshot.docs;
        callback(newSnapshots);
      });
      return unsubscribe;
    } else {
      // Consulta única: se ejecuta la consulta y se llama al callback
      getDocs(paginatedQuery)
        .then((snapshot) => {
          callback(snapshot.docs);
        })
        .catch((error) => {
          console.error("Error obteniendo posts paginados:", error);
        });
      // Se retorna una función vacía para mantener la firma
      return () => {};
    }
  } catch (error) {
    console.error("Error obteniendo posts paginados:", error);
    return null;
  }
};

/**
 * addPost:
 * Agrega un nuevo post a la colección "posts" en Firestore.
 *
 * @param post - Objeto que representa el post a agregar (excluye el campo 'id').
 * @returns Una promesa que se resuelve con el ID del post agregado o undefined si ocurre un error.
 */
export const addPost = async (post: Omit<Post, "id">): Promise<string | undefined> => {
  try {
    const docRef = await addDoc(collection(firestore, "posts"), post);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar el post:", error);
  }
};

/**
 * updatePost:
 * Actualiza un post existente en la colección "posts" de Firestore.
 *
 * @param postId - ID del post a actualizar.
 * @param data - Objeto con los datos a actualizar.
 */
export const updatePost = async (postId: string, data: any) => {
  try {
    const docRef = doc(firestore, "posts", postId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error al actualizar el post:", error);
  }
};

/**
 * getAllUsers:
 * Obtiene todos los usuarios de la colección "users" en Firestore.
 *
 * Recorre el snapshot de la consulta y crea un mapa donde cada clave es el ID del usuario
 * y el valor es un objeto con los datos del usuario.
 *
 * @returns Una promesa que se resuelve con un mapa de usuarios.
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
};

/**
 * getProfileImageById:
 * Obtiene la URL de la imagen de perfil de un usuario a partir de su ID.
 *
 * Consulta el documento correspondiente en la colección "users" y retorna la URL de la imagen
 * si existe. Si no se encuentra o ocurre un error, retorna null.
 *
 * @param userId - ID del usuario.
 * @returns Una promesa que se resuelve con la URL de la imagen de perfil o null.
 */
export const getProfileImageById = async (userId: string): Promise<string | null> => {
  try {
    // Se obtiene la referencia al documento del usuario
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

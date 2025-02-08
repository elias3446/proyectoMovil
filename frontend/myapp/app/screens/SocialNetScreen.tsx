
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { DocumentSnapshot } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth"; 
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Fontisto from '@expo/vector-icons/Fontisto';
import { timeAgo } from "../../utils/utils";
import CustomModal from "@/Components/MyModal";
import { addPost, getAllUsers, getPaginatedPosts, getProfileImageById, updatePost } from "@/api/firebaseService";
import { Post } from "@/types/Post";
import { sendNotificationMessage } from "@/api/notificationService";
import { UserData } from "@/types/User";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";

interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>(""); 
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const POST_LIMIT = 10;

  const auth = getAuth();

  /**
   * Obtiene el último elemento de un arreglo.
   * 
   * Este método toma un arreglo de tipo genérico y devuelve el último elemento del mismo.
   * Si el arreglo está vacío, devuelve `undefined`.
   * 
   * @param arr - Un arreglo de elementos de cualquier tipo genérico.
   * @returns El último elemento del arreglo o `undefined` si el arreglo está vacío.
   */
  function getLastItem<T>(arr: T[]): T | undefined {
    // slice(-1) retorna un nuevo arreglo con el último elemento,
    // y al acceder al índice [0] obtenemos directamente ese elemento.
    return arr.slice(-1)[0];
  }

  /**
   * Carga más publicaciones (posts) de manera paginada y las agrega al estado existente.
   * 
   * Este método usa la función `getPaginatedPosts` para cargar más publicaciones desde Firestore 
   * basándose en el último post cargado. Los nuevos posts se añaden al estado, asegurando que no 
   * haya duplicados, utilizando un mapa para garantizar la unicidad.
   * 
   * @returns No retorna un valor, pero actualiza el estado `snapshots` con los nuevos posts.
   */
  const fetchMorePosts = () => {
    getPaginatedPosts(getLastItem(snapshots), POST_LIMIT, (newSnapshots) => {
      setSnapshots((prevSnapshots) => {
        // Crear un mapa para asegurar que no haya duplicados basados en el ID
        const uniqueSnapshotsMap = new Map<string, DocumentSnapshot>();

        // Agregar los snapshots anteriores
        prevSnapshots.forEach((doc) => {
          uniqueSnapshotsMap.set(doc.id, doc);
        });

        // Agregar los nuevos snapshots
        newSnapshots.forEach((doc) => {
          uniqueSnapshotsMap.set(doc.id, doc);
        });

        // Convertir el mapa de vuelta a un array
        return Array.from(uniqueSnapshotsMap.values());
      });
    })
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('¡Permiso denegado! No puedes acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const imageUri = selectedAsset.uri;
      if (imageUri) {
        console.log(imageUri)
        setImage(imageUri);
      }
    }
  };

  //Maneja la creación de un nuevo post, subiendo la imagen (si existe) a Cloudinary y guardando el post en la base de datos.
  const handleCreatePost = async () => {
    if (!content) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoading(true);
    let imageUrl = null;
    if (image) {
      // Subir la imagen a Cloudinary
      imageUrl = await uploadImageToCloudinary(image);
    }

    await addPost(
      {
        userId,
        content,
        imageUrl,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      }
    );

    setContent("");
    setImage(null);
    setLoading(false);
  };

  /**
   * Envia una notificación al dueño del post cuando se realiza una acción como dar like.
   * 
   * @param post - El post sobre el cual se realiza la acción (ej. dar like).
   * @param userId - El ID del usuario que realiza la acción.
   * @param title - El título de la notificación.
   * @param message - El mensaje de la notificación.
   */
  const sendPostNotification = async (post: Post[], userId: string, title: string, message: string) => {
    const user = users.get(userId);
    const postContent = post[0].content;
    // Enviando	notificación al dueño del post
    await sendNotificationMessage(post[0].userId, title, `${user?.firstName.trim()} ${message} ${postContent}`);
  }

  /**
   * Maneja la acción de dar o quitar un "like" a un post. Si el usuario ya ha dado like, se elimina su like, de lo contrario, se añade.
   * Además, si el usuario no es el dueño del post, se envía una notificación al dueño del post notificándole sobre el "like".
   * 
   * @param postId - El ID del post al que se le da o se le quita el like.
   * @param currentLikes - Un arreglo de IDs de usuarios que han dado like al post. 
   *                       Es utilizado para verificar si el usuario ya ha dado like al post.
   * 
   * @returns {void} - No retorna ningún valor. Realiza una actualización en la base de datos de Firestore.
   */
  const handleLike = async (postId: string, currentLikes: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (!Array.isArray(currentLikes)) return;
    
    if (currentLikes.includes(userId)) {
      await updatePost(postId, {
        likes: currentLikes.filter((id: string) => id !== userId),
      })
    } else {
      // Se busca el post al que se dió like
      const post = snapshots
        .filter((doc) => doc.id === postId)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
      
      await updatePost(postId, {
        likes: [...currentLikes, userId],
      })

      // Si el post fue encontrado & el dueño del post no es el usuario que da like
      if (post.length > 0 && post[0].userId !== userId) {
        // Se envia una notificación
        await sendPostNotification(post, userId, "Nuevo like!", "ha dado like a tu publicación:");
      }
    }
  };

  /**
   * Maneja el proceso de agregar un comentario a un post específico.
   * 
   * Verifica si el usuario está autenticado, valida que los comentarios sean un arreglo,
   * y luego agrega el nuevo comentario al post. Si el dueño del post no es el usuario que comenta,
   * se envía una notificación al dueño del post.
   * 
   * @param postId - El ID del post al que se va a agregar el comentario.
   * @param newComment - El texto del nuevo comentario que se va a agregar.
   * @param currentComments - El arreglo actual de comentarios en el post.
   * 
   * @returns {void} - No retorna nada. Si ocurre algún error, se muestra en la consola.
   * 
   * @throws - Lanza un error si hay problemas al realizar la actualización en Firestore o al enviar la notificación.
   */
  const handleAddComment = async (
    postId: string,
    newComment: string,
    currentComments: Array<{ userId: string; text: string }>
  ) => {
    setComment("");
    const userId = auth.currentUser?.uid; // Obtener el ID del usuario autenticado
    if (!userId) {
      console.error("Usuario no autenticado");
      return;
    }
  
    if (!Array.isArray(currentComments)) {
      console.error("El campo 'comments' no es un array:", currentComments);
      return;
    }
  
    try {
      const commentToAdd = {
        userId,
        text: newComment,
      };

      // Se busca el post al que se comentó
      const post = snapshots
      .filter((doc) => doc.id === postId)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      await updatePost(postId, {
        comments: [...currentComments, commentToAdd],
      });

      // Si el post fue encontrado & el dueño del post no es el usuario que da like
      if (post.length > 0 && post[0].userId !== userId) {
        // Se envia una notificación
        sendPostNotification(post, userId, "Nuevo Comentario!", "ha comentado tu publicación:");
      }
    } catch (error) {
      console.error("Error al agregar el comentario al post:", error);
    }
  };

  // Alterna la visibilidad de los comentarios de un post específico
  const toggleCommentsVisibility = (postId: string) => {
    setVisibleComments((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId], // Alterna la visibilidad del post seleccionado
    }));
    // Si los comentarios del post aún no son visibles, se inicializa el número de comentarios a mostrar en 5
    if (!visibleComments[postId]) {
      setCommentsToShow((prevState) => ({
        ...prevState,
        [postId]: 5, // Establece el número inicial de comentarios a mostrar para este post
      }));
    }
  };

  // Cargar más comentarios de un post específico
  const loadMoreComments = (postId: string) => {
    setCommentsToShow((prevState) => ({
      ...prevState,
      [postId]: (prevState[postId] || 5) + 10, // Aumenta en 10 la cantidad de comentarios visibles, por defecto empieza en 5
    }));
  };

  useEffect(() => {
    // Carga inicial de posts
    const unsubscribe = getPaginatedPosts(undefined, POST_LIMIT, (newSnapshots) => {
      setSnapshots(newSnapshots);
    });
    // Cancelar el listener en tiempo real al desmontar el componente
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const fetchUserData = async () => {
      const usersMap = await getAllUsers();
      setUsers(usersMap);
    };

    const fetchUserProfileImage = async () => {
      const imageUrl = await getProfileImageById(userId);
      setProfileImage(imageUrl);
    };

    fetchUserData();
    fetchUserProfileImage();
  }, []);
  
  const renderPost = ({ item }: { item: Post }) => {
    const userName = users.get(item.userId);
    const showComments = visibleComments[item.id];
    const commentsLimit = commentsToShow[item.id] || 0;
    const userId = auth.currentUser?.uid;
    const userHasLiked = userId && Array.isArray(item.likes) && item.likes.includes(userId);
    const createdTimeAgo = timeAgo(item.createdAt);

    return (
      <ScrollView className="bg-[#E5FFE6] mb-2 rounded-lg flex gap-3">
        {/* photo and username */}
        <View className="flex flex-row items-center gap-2 px-4 pt-4">
          {userName?.profileImage ? <Image source={{ uri: userName.profileImage }} className="object-cover h-8 w-8 rounded-full" /> : <FontAwesome6 name="user-circle" size={26} />}
          <Text className="color-[#5CB868] font-extrabold text-2xl">
            {userName ? `${userName.firstName.trim()} ${userName.lastName.trim()}` : "Usuario Anónimo"}
          </Text>
        </View>

        {/* post content */}
        <Text className="text-xl px-4 py-2">{item.content}</Text>

        {/* post image */}
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} className="w-auto aspect-square rounded-lg mx-2 object-cover" />}

        {/* post actions */}
        <View className="flex flex-row items-center justify-start gap-2 px-4 pt-3 pb-2">
          <TouchableOpacity onPress={() => handleLike(item.id, item.likes)} className="flex flex-row items-center gap-2 w-12">
            <FontAwesome name={userHasLiked ? "heart" : "heart-o"} size={24} color="#5CB868" />
            <Text>{Array.isArray(item.likes) ? item.likes.length : 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleCommentsVisibility(item.id)} className="flex flex-row items-center gap-2 w-12">
            <Fontisto name="comment" size={24} color="#5CB868" />
            <Text>{Array.isArray(item.comments) ? item.comments.length : 0}</Text>
          </TouchableOpacity>
        </View>
        
        {/* post time */}
        <Text className="color-[#565a63] px-4 pb-4">Hace {createdTimeAgo}</Text>

        {/* post comments */}
        {showComments && (
          <View className="flex gap-4 pb-4 px-5">

            {/* comments list */}
            {item.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId);
              return (
                <View className="flex flex-row items-center gap-2" key={index}>
                  {commentUser?.profileImage ? <Image source={{ uri: commentUser.profileImage }} className="object-cover h-8 w-8 rounded-full" /> : <FontAwesome6 name="user-circle" size={27} />}
                  <View className="flex">
                    <Text>
                      {commentUser 
                        ? `${commentUser.firstName.trim()} ${commentUser.lastName.trim()}`
                        : "Usuario Anónimo"}
                    </Text>
                    <Text>{comment.text}</Text>
                  </View>
                </View>
              );
            })}

            {commentsLimit < item.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(item.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

            {/* add comment section */}
            <View className="flex flex-row gap-2 items-center">
              <TextInput
                className="flex-1 px-4 rounded-full text-xl bg-white"
                placeholder="Añadir un comentario..."
                value={comment}
                onChangeText={setComment}
                placeholderTextColor="#9095A1"
              />
              <Ionicons 
                name={comment.trim() ? "paper-plane" : "paper-plane-outline"} 
                size={24}
                color="#5CB868"
                onPress={() => handleAddComment(item.id, comment.trim(), item.comments)}
                className="w-7"
                disabled={comment.trim() === ""}
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View className="p-4 flex-1">
      {/* Title */}
      <View className="py-4">
        <Text className="text-5xl font-extrabold text-[#323743]">
          Mi mundo
        </Text>
      </View>

      {/* Create post */}
      <View className="flex flex-row items-center rounded-full gap-2">
        {profileImage ? (
          <Image source={{ uri: profileImage }} className="object-cover h-11 w-11 rounded-full" />
        ) : (
          <FontAwesome6 name="user-circle" size={38} />
        )}
        <TextInput
          className="flex-1 px-3 py-3 rounded-[20] font-semibold text-xl bg-[#F3F4F6]"
          placeholder="¿Qué estás pensando?"
          value={content}
          onChangeText={setContent}
          multiline
          placeholderTextColor="#9095A1"
        />
        {image ? (
          <Pressable onPress={() => setModalVisible(true)}>
            <Image source={{ uri: image }} className="w-11 h-11 rounded-lg" />
          </Pressable>
        ) : <Feather name="image" size={40} onPress={handlePickImage} />}

        {/* Modal para mostrar la imagen seleccionada */}
        <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} width="w-3/4" height="h-[41%]">
          {image ? (
            <>
              <Image source={{ uri: image }} className="w-full aspect-square rounded-lg" />
              <TouchableOpacity className="flex-row gap-2 items-center mt-4 px-4 py-2 bg-[#A5D6A7] rounded-lg" onPress={handlePickImage}>
                <Feather name="image" size={20} color="#142C15" />
                <Text className="text-[#142C15] font-bold">Elegir otra imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-gray-500">No hay imagen seleccionada</Text>
          )}
        </CustomModal>
      </View>

      {/* Post button */}
      <View className="my-3">
        <TouchableOpacity
          className="bg-[#A5D6A7] py-3 px-4 rounded-lg"
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text className="text-[#142C15] text-center text-xl">{loading ? "Publicando..." : "Publicar"}</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={snapshots.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[]}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        onEndReached={() => fetchMorePosts()}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default SocialNet;

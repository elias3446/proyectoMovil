import { useState, useEffect, useCallback } from "react";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { timeAgo } from "../../utils/utils";
import CustomModal from "@/Components/MyModal";
import {
  addPost,
  getAllUsers,
  getPaginatedPosts,
  getProfileImageById,
  updatePost,
  getCurrentUser,
} from "@/api/firebaseService";
import { Post } from "@/types/Post";
import { sendNotificationMessage } from "@/api/notificationService";
import { UserData } from "@/types/User";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";

interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

const POST_LIMIT = 10;

/**
 * getLastItem: Retorna el último elemento de un arreglo.
 */
function getLastItem<T>(arr: T[]): T | undefined {
  return arr.slice(-1)[0];
}

/**
 * SocialNet:
 * Pantalla principal de la red social, donde el usuario puede crear publicaciones,
 * ver las publicaciones de otros, dar like, comentar, y cargar más publicaciones de forma paginada.
 */
const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  // Estados para publicaciones, usuarios y creación de post
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para comentarios globales (almacenan visibilidad y cantidad de comentarios mostrados por post)
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});

  // Estado para la imagen de perfil del usuario actual y modal de vista previa
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  /**
   * fetchMorePosts: Carga más publicaciones de forma paginada usando el último post cargado.
   */
  const fetchMorePosts = () => {
    getPaginatedPosts(getLastItem(snapshots), POST_LIMIT, (newSnapshots) => {
      setSnapshots((prevSnapshots) => {
        const uniqueSnapshotsMap = new Map<string, DocumentSnapshot>();
        prevSnapshots.forEach((doc) => {
          uniqueSnapshotsMap.set(doc.id, doc);
        });
        newSnapshots.forEach((doc) => {
          uniqueSnapshotsMap.set(doc.id, doc);
        });
        return Array.from(uniqueSnapshotsMap.values());
      });
    });
  };

  /**
   * handlePickImage: Permite al usuario seleccionar una imagen de la galería.
   */
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("¡Permiso denegado! No puedes acceder a la galería.");
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
        console.log(imageUri);
        setImage(imageUri);
      }
    }
  };

  /**
   * handleCreatePost: Crea una nueva publicación.
   * Si hay una imagen, la sube a Cloudinary y guarda el post en Firestore.
   */
  const handleCreatePost = async () => {
    if (!content) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const userId = currentUser.uid;
    setLoading(true);
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImageToCloudinary({ uri: image });
    }
    await addPost({
      userId,
      content,
      imageUrl,
      likes: [],
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    });
    setContent("");
    setImage(null);
    setLoading(false);
  };

  /**
   * sendPostNotification: Envía una notificación al dueño del post (si no es el usuario que interactúa).
   */
  const sendPostNotification = async (
    post: Post[],
    userId: string,
    title: string,
    message: string
  ) => {
    const user = users.get(userId);
    const postContent = post[0].content;
    await sendNotificationMessage(
      post[0].userId,
      title,
      `${user?.firstName.trim()} ${message} ${postContent}`
    );
  };

  /**
   * handleLike: Maneja la acción de dar o quitar like a un post.
   */
  const handleLike = async (postId: string, currentLikes: any) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const userId = currentUser.uid;
    if (!Array.isArray(currentLikes)) return;
    if (currentLikes.includes(userId)) {
      await updatePost(postId, {
        likes: currentLikes.filter((id: string) => id !== userId),
        likesCount: currentLikes.length - 1,
      });
    } else {
      const post = snapshots
        .filter((doc) => doc.id === postId)
        .map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
      await updatePost(postId, {
        likes: [...currentLikes, userId],
        likesCount: currentLikes.length + 1,
      });
      if (post.length > 0 && post[0].userId !== userId) {
        await sendPostNotification(post, userId, "Nuevo like!", "ha dado like a tu publicación:");
      }
    }
  };

  /**
   * handleAddComment: Agrega un comentario a un post.
   */
  const handleAddComment = async (
    postId: string,
    newComment: string,
    currentComments: Array<{ userId: string; text: string }>
  ) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error("Usuario no autenticado");
      return;
    }
    const userId = currentUser.uid;
    if (!Array.isArray(currentComments)) {
      console.error("El campo 'comments' no es un array:", currentComments);
      return;
    }
    const commentToAdd = { userId, text: newComment };
    const post = snapshots
      .filter((doc) => doc.id === postId)
      .map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
    await updatePost(postId, {
      comments: [...currentComments, commentToAdd],
      commentsCount: currentComments.length + 1,
    });
    if (post.length > 0 && post[0].userId !== userId) {
      sendPostNotification(post, userId, "Nuevo Comentario!", "ha comentado tu publicación:");
    }
  };

  /**
   * toggleCommentsVisibility: Alterna la visibilidad de los comentarios para un post.
   */
  const toggleCommentsVisibility = (postId: string) => {
    setVisibleComments((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
    if (!visibleComments[postId]) {
      setCommentsToShow((prevState) => ({
        ...prevState,
        [postId]: 5,
      }));
    }
  };

  /**
   * loadMoreComments: Aumenta el número de comentarios visibles para un post.
   */
  const loadMoreComments = (postId: string) => {
    setCommentsToShow((prevState) => ({
      ...prevState,
      [postId]: (prevState[postId] || 5) + 10,
    }));
  };

  // Carga inicial de posts
  useEffect(() => {
    const unsubscribe = getPaginatedPosts(undefined, POST_LIMIT, (newSnapshots) => {
      setSnapshots(newSnapshots);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Carga datos de usuarios y la imagen de perfil del usuario actual
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const userId = currentUser.uid;
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

  /* ================= SUBCOMPONENTE: CreatePostSection =================
     Se encarga de mostrar el área para crear un nuevo post, incluyendo
     el campo de texto, la imagen (si se seleccionó) y el botón de publicación.
  */
  const CreatePostSection: React.FC = () => (
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
      ) : (
        <Feather name="image" size={40} onPress={handlePickImage} />
      )}
    </View>
  );

  /* ================= SUBCOMPONENTE: ImagePreviewModal =================
     Muestra una vista previa de la imagen seleccionada con opción de elegir otra.
  */
  const ImagePreviewModal: React.FC = () => (
    <CustomModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      width="w-3/4"
      height="h-[41%]"
    >
      {image ? (
        <>
          <Image source={{ uri: image }} className="w-full aspect-square rounded-lg" />
          <TouchableOpacity
            className="flex-row gap-2 items-center mt-4 px-4 py-2 bg-[#A5D6A7] rounded-lg"
            onPress={handlePickImage}
          >
            <Feather name="image" size={20} color="#142C15" />
            <Text className="text-[#142C15] font-bold">Elegir otra imagen</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text className="text-gray-500">No hay imagen seleccionada</Text>
      )}
    </CustomModal>
  );

  /* ================= SUBCOMPONENTE: PostItem =================
     Renderiza cada publicación, mostrando información del usuario, contenido,
     imagen (si existe), acciones (like, comentar) y la sección de comentarios.
  */
  interface PostItemProps {
    post: Post;
  }
  const PostItem: React.FC<PostItemProps> = ({ post }) => {
    const postUser = users.get(post.userId);
    const showComments = visibleComments[post.id];
    const commentsLimit = commentsToShow[post.id] || 0;
    const currentUser = getCurrentUser();
    const currentUserId = currentUser ? currentUser.uid : undefined;
    const userHasLiked = currentUserId && Array.isArray(post.likes) && post.likes.includes(currentUserId);
    const createdTimeAgo = timeAgo(post.createdAt);
    // Estado local para el comentario que se agregará a este post
    const [newComment, setNewComment] = useState("");

    return (
      <ScrollView className="bg-[#E5FFE6] mb-2 rounded-lg flex gap-3">
        {/* Encabezado: imagen y nombre del usuario */}
        <View className="flex flex-row items-center gap-2 px-4 pt-4">
          {postUser?.profileImage ? (
            <Image source={{ uri: postUser.profileImage }} className="object-cover h-8 w-8 rounded-full" />
          ) : (
            <FontAwesome6 name="user-circle" size={26} />
          )}
          <Text className="color-[#5CB868] font-extrabold text-2xl">
            {postUser ? `${postUser.firstName.trim()} ${postUser.lastName.trim()}` : "Usuario Anónimo"}
          </Text>
        </View>

        {/* Contenido del post */}
        <Text className="text-xl px-4 py-2">{post.content}</Text>

        {/* Imagen del post (si existe) */}
        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} className="w-auto aspect-square rounded-lg mx-2 object-cover" />
        )}

        {/* Acciones: like y comentario */}
        <View className="flex flex-row items-center justify-start gap-2 px-4 pt-3 pb-2">
          <TouchableOpacity
            onPress={() => handleLike(post.id, post.likes)}
            className="flex flex-row items-center gap-2 w-12"
          >
            <FontAwesome name={userHasLiked ? "heart" : "heart-o"} size={24} color="#5CB868" />
            <Text>{Array.isArray(post.likes) ? post.likes.length : 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleCommentsVisibility(post.id)}
            className="flex flex-row items-center gap-2 w-12"
          >
            <Fontisto name="comment" size={24} color="#5CB868" />
            <Text>{Array.isArray(post.comments) ? post.comments.length : 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Tiempo de creación del post */}
        <Text className="color-[#565a63] px-4 pb-4">Hace {createdTimeAgo}</Text>

        {/* Sección de comentarios */}
        {showComments && (
          <View className="flex gap-4 pb-4 px-5">
            {/* Lista de comentarios */}
            {post.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId);
              return (
                <View className="flex flex-row items-center gap-2" key={index}>
                  {commentUser?.profileImage ? (
                    <Image source={{ uri: commentUser.profileImage }} className="object-cover h-8 w-8 rounded-full" />
                  ) : (
                    <FontAwesome6 name="user-circle" size={27} />
                  )}
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

            {/* Botón para cargar más comentarios */}
            {commentsLimit < post.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(post.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

            {/* Sección para agregar un comentario */}
            <View className="flex flex-row gap-2 items-center">
              <TextInput
                className="flex-1 px-4 rounded-full text-xl bg-white"
                placeholder="Añadir un comentario..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor="#9095A1"
              />
              <Ionicons
                name={newComment.trim() ? "paper-plane" : "paper-plane-outline"}
                size={24}
                color="#5CB868"
                onPress={() => {
                  if (newComment.trim()) {
                    handleAddComment(post.id, newComment.trim(), post.comments);
                    setNewComment("");
                  }
                }}
                className="w-7"
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // Conversión de snapshots a objetos Post para la FlatList
  const postsData: Post[] = snapshots.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const renderPost = ({ item }: { item: Post }) => <PostItem post={item} />;

  return (
    <View className="p-4 flex-1">
      {/* Título */}
      <View className="py-4">
        <Text className="text-5xl font-extrabold text-[#323743]">Mi mundo</Text>
      </View>

      {/* Sección para crear un nuevo post */}
      <CreatePostSection />
      <ImagePreviewModal />

      {/* Botón para publicar */}
      <View className="my-3">
        <TouchableOpacity
          className="bg-[#A5D6A7] py-3 px-4 rounded-lg"
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text className="text-[#142C15] text-center text-xl">
            {loading ? "Publicando..." : "Publicar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de posts */}
      <FlatList
        data={postsData}
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

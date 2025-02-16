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
  Modal,
  Keyboard,
} from "react-native";
import { collection, DocumentSnapshot, onSnapshot } from "firebase/firestore";
import { firestore } from "@/Config/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getAuth } from "firebase/auth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { timeAgo } from "../../utils/utils";
import CustomModal from "@/Components/MyModal";
import PhotoPreviewSection from "@/Components/PhotoPreviewSection";
import {
  addPost,
  getAllUsers,
  getPaginatedPosts,
  getProfileImageById,
  updatePost,
} from "@/api/firebaseService";
import { Post } from "@/types/Post";
import { sendNotificationMessage } from "@/api/notificationService";
import { UserData } from "@/types/User";
import { uploadImageToCloudinary } from "@/api/cloudinaryService";
import { SortType } from "@/types/SortType";
import ExpandableButton from "@/Components/ExpandableButton";
import { styles } from "@/assets/styles/SocialNetStyles"; // Ajusta la ruta según corresponda

/**
 * Propiedades del componente SocialNet.
 */
interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * Componente SocialNet:
 * Permite ver y crear publicaciones, interactuar (likes y comentarios) y navegar entre contenido.
 */
const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  // Estados para posts y usuarios
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());

  // Estados para creación de post
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [photo, setPhoto] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para comentarios
  const [comment, setComment] = useState<string>("");
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});

  // Estado para la imagen de perfil del usuario (para mostrar en creación de post)
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Constante para definir el límite de posts a cargar
  const POST_LIMIT = 10;

  // Estados para botones expandibles y ordenamiento de publicaciones
  const [activeExpandableButtonId, setActiveExpandableButtonId] = useState<number | null>(1);
  const [sortType, setSortType] = useState<SortType>(SortType.DATE);

  // Estados para modales de vista previa
  const [modalPostVisible, setModalPostVisible] = useState<boolean>(false);
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(null);
  const [modalProfileVisible, setModalProfileVisible] = useState<boolean>(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  const auth = getAuth();

  // Helper: Obtiene el último elemento de un arreglo
  const getLastItem = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];

  /**
   * Carga más publicaciones utilizando paginación y actualiza el estado,
   * combinando de forma única las publicaciones anteriores con las nuevas.
   */
  const fetchMorePosts = useCallback(() => {
    getPaginatedPosts(
      getLastItem(snapshots),
      POST_LIMIT,
      (newSnapshots) => {
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
      },
      sortType,
      false
    );
  }, [snapshots, sortType]);

  /**
   * Permite al usuario seleccionar una imagen de la galería y previsualizarla.
   */
  const pickImageAndPreview = useCallback(async () => {
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
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      const asset = result.assets[0];
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setPhoto(manipulatedImage);
      setShowPhotoPreview(true);
      setModalVisible(false);
    }
  }, []);

  /**
   * Confirma la imagen seleccionada para el post.
   */
  const handleConfirmPhoto = useCallback(() => {
    if (photo) {
      setImage(photo.uri);
      setPhoto(null);
      setShowPhotoPreview(false);
    }
  }, [photo]);

  /**
   * Permite retomar la selección de imagen (descartar la actual).
   */
  const handleRetakePhoto = useCallback(() => {
    setPhoto(null);
    setShowPhotoPreview(false);
  }, []);

  /**
   * Crea una nueva publicación. Si se adjunta una imagen, se sube a Cloudinary.
   * Luego se agrega el post a Firebase y se actualiza la lista de publicaciones.
   */
  const handleCreatePost = useCallback(async () => {
    if (!content) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoading(true);
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await uploadImageToCloudinary(image);
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

    // Si el orden no es por fecha, se cambia a fecha; de lo contrario, se refrescan las publicaciones
    if (sortType !== SortType.DATE) {
      setSortType(SortType.DATE);
      setActiveExpandableButtonId(1);
    } else {
      getPaginatedPosts(undefined, POST_LIMIT, (newSnapshots) => {
        setSnapshots(newSnapshots);
      }, SortType.DATE, false);
    }

    setContent("");
    setImage(null);
    setLoading(false);
  }, [content, auth, image, sortType]);

  /**
   * Envía una notificación relacionada con una acción en un post (like o comentario).
   */
  const sendPostNotification = useCallback(
    async (post: Post[], userId: string, title: string, message: string) => {
      const user = users.get(userId);
      const postContent = post[0].content;
      await sendNotificationMessage(
        post[0].userId,
        title,
        `${user?.firstName.trim()} ${message} ${postContent}`
      );
    },
    [users]
  );

  /**
   * Maneja el like en una publicación. Si el usuario ya le dio like, se quita; si no, se agrega.
   * Además, envía una notificación si la publicación no es del mismo usuario.
   */
  const handleLike = useCallback(
    async (postId: string, currentLikes: any) => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
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
          await sendPostNotification(
            post,
            userId,
            "Nuevo like!",
            "ha dado like a tu publicación:"
          );
        }
      }
    },
    [auth, snapshots, sendPostNotification]
  );

  /**
   * Maneja la adición de un comentario a una publicación.
   */
  const handleAddComment = useCallback(
    async (
      postId: string,
      newComment: string,
      currentComments: Array<{ userId: string; text: string }>
    ) => {
      // Reinicia el input de comentario
      setComment("");
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      if (!Array.isArray(currentComments)) return;

      try {
        const commentToAdd = { userId, text: newComment };
        const post = snapshots
          .filter((doc) => doc.id === postId)
          .map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];

        await updatePost(postId, {
          comments: [...currentComments, commentToAdd],
          commentsCount: currentComments.length + 1,
        });

        if (post.length > 0 && post[0].userId !== userId) {
          sendPostNotification(
            post,
            userId,
            "Nuevo Comentario!",
            "ha comentado tu publicación:"
          );
        }

        // Refresca las publicaciones
        getPaginatedPosts(
          undefined,
          POST_LIMIT,
          (newSnapshots) => {
            setSnapshots(newSnapshots);
          },
          sortType,
          false
        );
      } catch (error) {
        console.error("Error al agregar el comentario al post:", error);
      }
    },
    [auth, snapshots, sortType, sendPostNotification]
  );

  /**
   * Alterna la visibilidad de los comentarios para un post determinado.
   */
  const toggleCommentsVisibility = useCallback(
    (postId: string) => {
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
    },
    [visibleComments]
  );

  /**
   * Aumenta el número de comentarios a mostrar para un post.
   */
  const loadMoreComments = useCallback((postId: string) => {
    setCommentsToShow((prevState) => ({
      ...prevState,
      [postId]: (prevState[postId] || 5) + 10,
    }));
  }, []);

  /**
   * Cambia el tipo de ordenamiento al presionar un botón.
   */
  const handleButtonPress = useCallback((newSortType: SortType) => {
    setSortType(newSortType);
  }, []);

  /**
   * Efecto para cargar las publicaciones inicialmente y actualizar en tiempo real.
   */
  useEffect(() => {
    // Carga inicial paginada
    const unsubscribeInitial = getPaginatedPosts(
      undefined,
      POST_LIMIT,
      (newSnapshots) => {
        setSnapshots(newSnapshots);
        // Escucha en tiempo real cambios en la colección "posts"
        const unsubscribeRealtime = onSnapshot(
          collection(firestore, "posts"),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                setSnapshots((prevSnapshots) =>
                  prevSnapshots.map((doc) =>
                    doc.id === change.doc.id ? change.doc : doc
                  )
                );
              }
            });
          }
        );
        return () => {
          if (unsubscribeRealtime) unsubscribeRealtime();
        };
      },
      sortType,
      false
    );
    return () => {
      if (unsubscribeInitial) unsubscribeInitial();
    };
  }, [sortType]);

  /**
   * Efecto para obtener los datos de los usuarios (para notificaciones y visualización) y la imagen
   * de perfil del usuario actual.
   */
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

  /**
   * Componente para renderizar un post individual.
   */
  interface PostItemProps {
    post: Post;
  }
  const PostItem: React.FC<PostItemProps> = ({ post }) => {
    const postUser = users.get(post.userId);
    const showComments = visibleComments[post.id];
    const commentsLimit = commentsToShow[post.id] || 0;
    const currentUserId = auth.currentUser?.uid;
    const userHasLiked =
      currentUserId &&
      Array.isArray(post.likes) &&
      post.likes.includes(currentUserId);
    const createdTimeAgo = timeAgo(post.createdAt);
    const [newComment, setNewComment] = useState("");

    return (
      <ScrollView className={styles.postItemRoot}>
        {/* Cabecera del post: imagen de perfil y nombre */}
        <View className={styles.postHeaderContainer}>
          {postUser?.profileImage ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedProfileImage(postUser.profileImage);
                setModalProfileVisible(true);
              }}
            >
              <Image
                source={{ uri: postUser.profileImage }}
                className={styles.postUserProfileImage}
              />
            </TouchableOpacity>
          ) : (
            <FontAwesome6 name="user-circle" size={26} />
          )}
          <Text className={styles.postUsernameText}>
            {postUser
              ? `${postUser.firstName.trim()} ${postUser.lastName.trim()}`
              : "Usuario Anónimo"}
          </Text>
        </View>

        {/* Contenido del post */}
        <Text className={styles.postContentText}>{post.content}</Text>

        {/* Imagen del post, si existe */}
        {post.imageUrl && (
          <TouchableOpacity
            onPress={() => {
              setSelectedPostImage(post.imageUrl);
              setModalPostVisible(true);
            }}
          >
            <Image
              source={{ uri: post.imageUrl }}
              className={styles.postImageContainer}
            />
          </TouchableOpacity>
        )}

        {/* Acciones del post: like y comentario */}
        <View className={styles.postActionsContainer}>
          <TouchableOpacity
            onPress={() => handleLike(post.id, post.likes)}
            className={styles.likeButton}
          >
            <FontAwesome
              name={userHasLiked ? "heart" : "heart-o"}
              size={24}
              color="#5CB868"
            />
            <Text>
              {Array.isArray(post.likes) ? post.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleCommentsVisibility(post.id)}
            className={styles.commentButton}
          >
            <Fontisto name="comment" size={24} color="#5CB868" />
            <Text>
              {Array.isArray(post.comments) ? post.comments.length : 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tiempo transcurrido desde la creación del post */}
        <Text className={styles.postTimeText}>Hace {createdTimeAgo}</Text>

        {/* Sección de comentarios */}
        {showComments && (
          <View className={styles.commentsContainer}>
            {post.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId);
              return (
                <View className={styles.commentContainer} key={index}>
                  {commentUser?.profileImage ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedProfileImage(commentUser.profileImage);
                        setModalProfileVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: commentUser.profileImage }}
                        className={styles.commentUserProfileImage}
                      />
                    </TouchableOpacity>
                  ) : (
                    <FontAwesome6 name="user-circle" size={27} />
                  )}
                  <View className={styles.commentTextContainer}>
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

            {commentsLimit < post.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(post.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

            {/* Input para agregar un nuevo comentario */}
            <View className={styles.commentInputContainer}>
              <TextInput
                className={styles.commentInput}
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
                className={styles.commentSendIcon}
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // Si se está previsualizando una foto, se muestra el PhotoPreviewSection en un Modal
  if (showPhotoPreview && photo) {
    return (
      <Modal visible={!!photo} animationType="slide" onRequestClose={() => {}}>
        <PhotoPreviewSection
          photo={photo}
          onConfirm={handleConfirmPhoto}
          handleRetakePhoto={handleRetakePhoto}
        />
      </Modal>
    );
  }

  // Mapear los snapshots a datos del post
  const postsData: Post[] = snapshots.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const renderPost = ({ item }: { item: Post }) => <PostItem post={item} />;

  return (
    <View className={styles.socialNetRoot}>
      {/* Título principal */}
      <View className={styles.titleContainer}>
        <Text className={styles.titleText}>Mi mundo</Text>
      </View>

      {/* Sección para crear un post */}
      <View className={styles.createPostContainer}>
        {profileImage ? (
          <TouchableOpacity
            onPress={() => {
              setSelectedProfileImage(profileImage);
              setModalProfileVisible(true);
            }}
          >
            <Image
              source={{ uri: profileImage }}
              className={styles.profileImageThumbnail}
            />
          </TouchableOpacity>
        ) : (
          <MaterialIcons name="person" size={35} />
        )}
        <TextInput
          className={styles.postContentInput}
          placeholder="¿Qué estás pensando?"
          value={content}
          onChangeText={setContent}
          multiline
          placeholderTextColor="#9095A1"
        />
        {image ? (
          <Pressable onPress={() => setModalVisible(true)}>
            <Image
              source={{ uri: image }}
              className={styles.postImageThumbnail}
            />
          </Pressable>
        ) : (
          <MaterialIcons
            name="photo-library"
            size={35}
            color="#616161"
            onPress={pickImageAndPreview}
          />
        )}
      </View>

      {/* Modal para vista previa de imagen en la creación del post */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        width={styles.modalWidth}
        height={styles.modalHeight}
      >
        {image ? (
          <>
            <Image source={{ uri: image }} className={styles.modalImage} />
            <TouchableOpacity
              className={styles.chooseImageButton}
              onPress={pickImageAndPreview}
            >
              <Feather name="image" size={20} color="#142C15" />
              <Text className={styles.chooseImageButtonText}>
                Elegir otra imagen
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className={styles.noImageText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>

      {/* Botón para publicar el post */}
      <View className={styles.publishButtonContainer}>
        <TouchableOpacity
          className={styles.publishButton}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text className={styles.publishButtonText}>
            {loading ? "Publicando..." : "Publicar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botones para ordenar publicaciones */}
      <View className={styles.sortButtonsContainer}>
        <ExpandableButton
          id={1}
          text="Más recientes"
          IconComponent={Ionicons}
          iconName="timer"
          activeId={activeExpandableButtonId}
          setActiveId={setActiveExpandableButtonId}
          onPress={() => handleButtonPress(SortType.DATE)}
        />
        <ExpandableButton
          id={2}
          text="Más likeados"
          IconComponent={FontAwesome}
          iconName="heart"
          activeId={activeExpandableButtonId}
          setActiveId={setActiveExpandableButtonId}
          onPress={() => handleButtonPress(SortType.LIKES)}
        />
        <ExpandableButton
          id={3}
          text="Más comentados"
          IconComponent={Fontisto}
          iconName="comment"
          activeId={activeExpandableButtonId}
          setActiveId={setActiveExpandableButtonId}
          onPress={() => handleButtonPress(SortType.COMMENTS)}
        />
      </View>

      {/* Lista de publicaciones */}
      <FlatList
        data={postsData}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        onEndReached={() => fetchMorePosts()}
        onEndReachedThreshold={0.5}
      />

      {/* Modal para previsualizar la imagen de un post */}
      <CustomModal
        visible={modalPostVisible}
        onClose={() => setModalPostVisible(false)}
      >
        {selectedPostImage ? (
          <Image
            source={{ uri: selectedPostImage }}
            className={styles.modalPostImage}
          />
        ) : (
          <Text className={styles.noImageText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>

      {/* Modal para previsualizar la imagen del perfil */}
      <CustomModal
        visible={modalProfileVisible}
        onClose={() => setModalProfileVisible(false)}
      >
        {selectedProfileImage ? (
          <Image
            source={{ uri: selectedProfileImage }}
            className={styles.modalProfileImage}
          />
        ) : (
          <Text className={styles.noImageText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default SocialNet;

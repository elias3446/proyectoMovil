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
import * as ImageManipulator from "expo-image-manipulator"; // Para procesar la imagen
import { getAuth } from "firebase/auth"; 
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Fontisto from '@expo/vector-icons/Fontisto';
import { timeAgo } from "../../utils/utils";
import CustomModal from "@/Components/MyModal";
import PhotoPreviewSection from "@/Components/PhotoPreviewSection";
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
  // "image" contendrá la URI confirmada para el post
  const [image, setImage] = useState<string | null>(null);
  // "photo" contendrá el objeto de la imagen seleccionada y procesada
  const [photo, setPhoto] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // Controla si se muestra el PhotoPreviewSection a pantalla completa
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>(""); 
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const POST_LIMIT = 10;

  // Estados para mostrar la imagen de un post en modal
  const [modalPostVisible, setModalPostVisible] = useState<boolean>(false);
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(null);

  // Estados para mostrar la imagen del usuario en modal
  const [modalProfileVisible, setModalProfileVisible] = useState<boolean>(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  const auth = getAuth();

  // Función para obtener el último elemento de un arreglo
  function getLastItem<T>(arr: T[]): T | undefined {
    return arr.slice(-1)[0];
  }

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

  // Función común para seleccionar una imagen y mostrar el PhotoPreviewSection
  const pickImageAndPreview = async () => {
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
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      const asset = result.assets[0];
      // Procesamos la imagen con ImageManipulator (similar a CameraCaptureScreen)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setPhoto(manipulatedImage);
      setShowPhotoPreview(true);
      // Si se invoca desde el modal, se cierra éste
      setModalVisible(false);
    }
  };

  // Cuando se confirma la imagen en PhotoPreviewSection se actualiza "image"
  const handleConfirmPhoto = () => {
    setImage(photo.uri);
    setPhoto(null);
    setShowPhotoPreview(false);
  };

  // Si se decide retomar (elegir otra imagen) se descarta la imagen seleccionada
  const handleRetakePhoto = () => {
    setPhoto(null);
    setShowPhotoPreview(false);
  };

  // Función para crear un nuevo post (sube la imagen a Cloudinary si existe)
  const handleCreatePost = async () => {
    if (!content) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoading(true);
    let imageUrl = null;
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

    setContent("");
    setImage(null);
    setLoading(false);
  };

  const sendPostNotification = async (post: Post[], userId: string, title: string, message: string) => {
    const user = users.get(userId);
    const postContent = post[0].content;
    await sendNotificationMessage(post[0].userId, title, `${user?.firstName.trim()} ${message} ${postContent}`);
  };

  const handleLike = async (postId: string, currentLikes: any) => {
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
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
      
      await updatePost(postId, {
        likes: [...currentLikes, userId],
        likesCount: currentLikes.length + 1,
      });

      if (post.length > 0 && post[0].userId !== userId) {
        await sendPostNotification(post, userId, "Nuevo like!", "ha dado like a tu publicación:");
      }
    }
  };

  const handleAddComment = async (
    postId: string,
    newComment: string,
    currentComments: Array<{ userId: string; text: string }>
  ) => {
    setComment("");
    const userId = auth.currentUser?.uid;
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

      const post = snapshots
        .filter((doc) => doc.id === postId)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

      await updatePost(postId, {
        comments: [...currentComments, commentToAdd],
        commentsCount: currentComments.length + 1,
      });

      if (post.length > 0 && post[0].userId !== userId) {
        sendPostNotification(post, userId, "Nuevo Comentario!", "ha comentado tu publicación:");
      }
    } catch (error) {
      console.error("Error al agregar el comentario al post:", error);
    }
  };

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

  const loadMoreComments = (postId: string) => {
    setCommentsToShow((prevState) => ({
      ...prevState,
      [postId]: (prevState[postId] || 5) + 10,
    }));
  };

  useEffect(() => {
    const unsubscribe = getPaginatedPosts(undefined, POST_LIMIT, (newSnapshots) => {
      setSnapshots(newSnapshots);
    });
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
        <View className="flex flex-row items-center gap-2 px-4 pt-4">
          {userName?.profileImage ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedProfileImage(userName.profileImage);
                setModalProfileVisible(true);
              }}
            >
              <Image source={{ uri: userName.profileImage }} className="object-cover h-8 w-8 rounded-full" />
            </TouchableOpacity>
          ) : (
            <FontAwesome6 name="user-circle" size={26} />
          )}
          <Text className="color-[#5CB868] font-extrabold text-2xl">
            {userName ? `${userName.firstName.trim()} ${userName.lastName.trim()}` : "Usuario Anónimo"}
          </Text>
        </View>

        <Text className="text-xl px-4 py-2">{item.content}</Text>

        {item.imageUrl && (
          <TouchableOpacity
            onPress={() => {
              setSelectedPostImage(item.imageUrl);
              setModalPostVisible(true);
            }}
          >
            <Image source={{ uri: item.imageUrl }} className="w-auto aspect-square rounded-lg mx-2 object-cover" />
          </TouchableOpacity>
        )}

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
        
        <Text className="color-[#565a63] px-4 pb-4">Hace {createdTimeAgo}</Text>

        {showComments && (
          <View className="flex gap-4 pb-4 px-5">
            {item.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId);
              return (
                <View className="flex flex-row items-center gap-2" key={index}>
                  {commentUser?.profileImage ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedProfileImage(commentUser.profileImage);
                        setModalProfileVisible(true);
                      }}
                    >
                      <Image source={{ uri: commentUser.profileImage }} className="object-cover h-8 w-8 rounded-full" />
                    </TouchableOpacity>
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

            {commentsLimit < item.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(item.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

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

  // Si se selecciona una imagen (inicial o al elegir otra) se muestra el PhotoPreviewSection
  if (showPhotoPreview && photo) {
    return (
      <PhotoPreviewSection
        photo={photo}
        onConfirm={handleConfirmPhoto}
        handleRetakePhoto={handleRetakePhoto}
        //setCurrentScreen={setCurrentScreen}
      />
    );
  }

  return (
    <View className="p-4 flex-1">
      {/* Título */}
      <View className="py-4">
        <Text className="text-5xl font-extrabold text-[#323743]">Mi mundo</Text>
      </View>

      {/* Sección para crear post */}
      <View className="flex flex-row items-center rounded-full gap-2">
        {profileImage ? (
          <TouchableOpacity
            onPress={() => {
              setSelectedProfileImage(profileImage);
              setModalProfileVisible(true);
            }}
          >
            <Image source={{ uri: profileImage }} className="object-cover h-11 w-11 rounded-full" />
          </TouchableOpacity>
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
          // Al tocar el thumbnail se abre el modal para ver la imagen seleccionada
          <Pressable onPress={() => setModalVisible(true)}>
            <Image source={{ uri: image }} className="w-11 h-11 rounded-lg" />
          </Pressable>
        ) : (
          // Si aún no hay imagen, se llama a pickImageAndPreview para la selección inicial
          <Feather name="image" size={40} onPress={pickImageAndPreview} />
        )}
      </View>

      {/* Modal para vista previa de imagen en la creación del post */}
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
              onPress={pickImageAndPreview}
            >
              <Feather name="image" size={20} color="#142C15" />
              <Text className="text-[#142C15] font-bold">Elegir otra imagen</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="text-gray-500">No hay imagen seleccionada</Text>
        )}
      </CustomModal>

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

      {/* Modal para mostrar la imagen de un post (sin opción para elegir otra imagen) */}
      <CustomModal
        visible={modalPostVisible}
        onClose={() => setModalPostVisible(false)}
      >
        {selectedPostImage ? (
          <Image source={{ uri: selectedPostImage }} className="w-full aspect-square rounded-lg" />
        ) : (
          <Text className="text-gray-500">No hay imagen seleccionada</Text>
        )}
      </CustomModal>

      {/* Modal para mostrar la imagen del usuario */}
      <CustomModal
        visible={modalProfileVisible}
        onClose={() => setModalProfileVisible(false)}
      >
        {selectedProfileImage ? (
          <Image source={{ uri: selectedProfileImage }} className="w-full aspect-square rounded-lg" />
        ) : (
          <Text className="text-gray-500">No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default SocialNet;

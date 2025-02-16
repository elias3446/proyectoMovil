import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
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

interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

const POST_LIMIT = 10;

function getLastItem<T>(arr: T[]): T | undefined {
  return arr.slice(-1)[0];
}

const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [photo, setPhoto] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // Eliminamos el estado global para el comentario

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeExpandableButtonId, setActiveExpandableButtonId] = useState<number | null>(1);
  const [sortType, setSortType] = useState<SortType>(SortType.DATE);

  const [modalPostVisible, setModalPostVisible] = useState<boolean>(false);
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(null);
  const [visibleComments, setVisibleComments] = useState<{ [key: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [key: string]: number }>({});

  const [modalProfileVisible, setModalProfileVisible] = useState<boolean>(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  const auth = getAuth();

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
    }, sortType, false);
  };

  const pickImageAndPreview = async () => {
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
  };

  const handleConfirmPhoto = () => {
    setImage(photo.uri);
    setPhoto(null);
    setShowPhotoPreview(false);
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setShowPhotoPreview(false);
  };

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
  };

  // Esta función se mantiene en el padre pero la llamaremos desde cada PostItem
  const handleAddComment = async (
    postId: string,
    newComment: string,
    currentComments: Array<{ userId: string; text: string }>
  ) => {
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

  const handleButtonPress = (newSortType: SortType) => {
    setSortType(newSortType);
  };

  useEffect(() => {
    const unsubscribeInitial = getPaginatedPosts(
      undefined,
      POST_LIMIT,
      (newSnapshots) => {
        setSnapshots(newSnapshots);
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

  interface PostItemProps {
    post: Post;
  }

  // Cada PostItem maneja su propio estado de comentario
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
    // Estado local para el comentario en este post
    const [localComment, setLocalComment] = useState("");

    return (
      <View className="bg-[#E5FFE6] mb-2 rounded-lg flex gap-3 p-2">
        <View className="flex flex-row items-center gap-2 px-4 pt-4">
          {postUser?.profileImage ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedProfileImage(postUser.profileImage);
                setModalProfileVisible(true);
              }}
            >
              <Image
                source={{ uri: postUser.profileImage }}
                className="object-cover h-8 w-8 rounded-full"
              />
            </TouchableOpacity>
          ) : (
            <FontAwesome6 name="user-circle" size={26} />
          )}
          <Text className="text-2xl font-extrabold text-[#5CB868]">
            {postUser
              ? `${postUser.firstName.trim()} ${postUser.lastName.trim()}`
              : "Usuario Anónimo"}
          </Text>
        </View>

        <Text className="text-xl px-4 py-2">{post.content}</Text>

        {post.imageUrl && (
          <TouchableOpacity
            onPress={() => {
              setSelectedPostImage(post.imageUrl);
              setModalPostVisible(true);
            }}
          >
            <Image
              source={{ uri: post.imageUrl }}
              className="w-auto aspect-square rounded-lg mx-2 object-cover"
            />
          </TouchableOpacity>
        )}

        <View className="flex flex-row items-center justify-start gap-2 px-4 pt-3 pb-2">
          <TouchableOpacity
            onPress={() => handleLike(post.id, post.likes)}
            className="flex flex-row items-center gap-2 w-12"
          >
            <FontAwesome
              name={userHasLiked ? "heart" : "heart-o"}
              size={24}
              color="#5CB868"
            />
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

        <Text className="px-4 pb-4 text-[#565a63]">Hace {createdTimeAgo}</Text>

        {showComments && (
          <View className="flex gap-4 pb-4 px-5">
            {post.comments.slice(0, commentsLimit).map((comment, index) => {
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
                      <Image
                        source={{ uri: commentUser.profileImage }}
                        className="object-cover h-8 w-8 rounded-full"
                      />
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

            {commentsLimit < post.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(post.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

            <View className="flex flex-row gap-2 items-center">
              <TextInput
                className="flex-1 px-4 rounded-full text-xl bg-white"
                placeholder="Añadir un comentario..."
                value={localComment}
                onChangeText={setLocalComment}
                placeholderTextColor="#9095A1"
                blurOnSubmit={false}
              />
              <Ionicons
                name={localComment.trim() ? "paper-plane" : "paper-plane-outline"}
                size={24}
                color="#5CB868"
                onPress={() => {
                  if (localComment.trim() === "") return;
                  handleAddComment(post.id, localComment.trim(), post.comments);
                  setLocalComment("");
                }}
                className="w-7"
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  if (showPhotoPreview && photo) {
    return (
      <PhotoPreviewSection
        photo={photo}
        onConfirm={handleConfirmPhoto}
        handleRetakePhoto={handleRetakePhoto}
      />
    );
  }

  const postsData: Post[] = snapshots.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const renderPost = ({ item }: { item: Post }) => <PostItem post={item} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="p-4 flex-1">
        <View className="py-4">
          <Text className="text-5xl font-extrabold text-[#323743]">Mi mundo</Text>
        </View>

        <View className="flex flex-row items-center rounded-full gap-2">
          {profileImage ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedProfileImage(profileImage);
                setModalProfileVisible(true);
              }}
            >
              <Image
                source={{ uri: profileImage }}
                className="object-cover h-11 w-11 rounded-full"
              />
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
            <Pressable onPress={() => setModalVisible(true)}>
              <Image source={{ uri: image }} className="w-11 h-11 rounded-lg" />
            </Pressable>
          ) : (
            <Feather name="image" size={40} onPress={pickImageAndPreview} />
          )}
        </View>

        <CustomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          width="w-3/4"
          height="h-[41%]"
        >
          {image ? (
            <>
              <Image
                source={{ uri: image }}
                className="w-full aspect-square rounded-lg"
              />
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

        <View className="flex flex-row justify-start gap-2 mb-4">
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

        <FlatList
          data={postsData}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          onEndReached={fetchMorePosts}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
        />

        <CustomModal
          visible={modalPostVisible}
          onClose={() => setModalPostVisible(false)}
        >
          {selectedPostImage ? (
            <Image
              source={{ uri: selectedPostImage }}
              className="w-full aspect-square rounded-lg"
            />
          ) : (
            <Text className="text-gray-500">No hay imagen seleccionada</Text>
          )}
        </CustomModal>

        <CustomModal
          visible={modalProfileVisible}
          onClose={() => setModalProfileVisible(false)}
        >
          {selectedProfileImage ? (
            <Image
              source={{ uri: selectedProfileImage }}
              className="w-full aspect-square rounded-lg"
            />
          ) : (
            <Text className="text-gray-500">No hay imagen seleccionada</Text>
          )}
        </CustomModal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SocialNet;
function setVisibleComments(arg0: (prevState: any) => any) {
  throw new Error("Function not implemented.");
}

function setCommentsToShow(arg0: (prevState: any) => any) {
  throw new Error("Function not implemented.");
}


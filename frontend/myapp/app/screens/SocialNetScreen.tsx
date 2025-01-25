import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, getDocs } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as FileSystem from 'expo-file-system';  
import { getAuth } from "firebase/auth"; 
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  likes: string[];
  comments: { userId: string, text: string }[];
  createdAt: string;
}

const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Map<string, { firstName: string, lastName: string }>>(new Map());
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      setPosts(fetchedPosts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserNames = async () => {
      const usersMap = new Map<string, { firstName: string, lastName: string }>();

      const snapshot = await getDocs(collection(db, "users"));
      snapshot.forEach((doc) => {
        const userData = doc.data();
        usersMap.set(doc.id, {
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
        });
      });

      setUsers(usersMap);
    };

    fetchUserNames();
  }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('¡Permiso denegado! No puedes acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const imageUri = selectedAsset.uri;
      if (imageUri) {
        setImage(imageUri);
      } else {
        console.error("La imagen seleccionada no tiene URI.");
      }
    } else {
      console.error("No se seleccionó ninguna imagen.");
    }
  };

  const uploadImageToCloudinary = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.error("El archivo no existe en la ruta proporcionada.");
      return null;
    }

    const formData = new FormData();
    const file = {
      uri: fileInfo.uri,
      name: fileInfo.uri.split('/').pop(),
      type: "image/jpeg",
    };

    formData.append("file", file as any);
    formData.append("upload_preset", "my_upload_preset");

    const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload";

    try {
      const response = await axios.post(cloudinaryUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.secure_url;
    } catch (error) {
      console.error("Error subiendo la imagen a Cloudinary:", error);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!content) return;

    const userId = auth.currentUser?.uid; // Obtener el UID del usuario autenticado
    if (!userId) {
      console.error("Usuario no autenticado");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageToCloudinary(image);
      }

      await addDoc(collection(db, "posts"), {
        userId, // Almacena el UID del usuario
        content,
        imageUrl,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      });

      setContent("");
      setImage(null);
    } catch (error) {
      console.error("Error creando el post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("Usuario no autenticado");
      return;
    }

    if (!Array.isArray(currentLikes)) {
      console.error("El campo 'likes' no es un array:", currentLikes);
      return;
    }

    try {
      const postRef = doc(db, "posts", postId);
      if (currentLikes.includes(userId)) {
        await updateDoc(postRef, {
          likes: currentLikes.filter((id: string) => id !== userId),
        });
      } else {
        await updateDoc(postRef, {
          likes: [...currentLikes, userId],
        });
      }
    } catch (error) {
      console.error("Error actualizando el like del post:", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!comment) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("Usuario no autenticado");
      return;
    }

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: [
          ...posts.find((p) => p.id === postId)?.comments || [],
          { userId, text: comment },
        ],
      });
      setComment(""); 
    } catch (error) {
      console.error("Error agregando comentario:", error);
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
        [postId]: 5, // Muestra los primeros 5 comentarios inicialmente
      }));
    }
  };

  const loadMoreComments = (postId: string) => {
    setCommentsToShow((prevState) => ({
      ...prevState,
      [postId]: (prevState[postId] || 5) + 10, // Incrementa de 10 en 10
    }));
  };

  const renderPost = ({ item }: { item: Post }) => {
    const userName = users.get(item.userId); // Obtener el nombre usando el UID
    const showComments = visibleComments[item.id];
    const commentsLimit = commentsToShow[item.id] || 0;
    const userId = auth.currentUser?.uid;
    const userHasLiked = userId && Array.isArray(item.likes) && item.likes.includes(userId);

    return (
      <View className="p-4 bg-[#E5FFE6] mb-2 rounded-lg flex gap-3">
        {/* photo and username */}
        <View className="flex flex-row items-center gap-2">
          {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <FontAwesome6 name="user-circle" size={26} />}
          <Text className="color-[#5CB868] font-extrabold text-2xl">
            {userName ? `${userName.firstName} ${userName.lastName}` : "Usuario Anónimo"}
          </Text>
        </View>

        {/* post content */}
        <Text className="text-xl">{item.content}</Text>

        {/* post imaage */}
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} className="w-full object-cover h-96" />}

        {/* post actions */}
        <View className="flex flex-row items-center justify-between">
          <TouchableOpacity onPress={() => handleLike(item.id, item.likes)} className="flex flex-row items-center gap-1 w-12">
            <FontAwesome name={userHasLiked ? "heart" : "heart-o"} size={24} color="#5CB868" />
            <Text>{Array.isArray(item.likes) ? item.likes.length : 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleCommentsVisibility(item.id)} className="ml-1">
            <Text>{showComments ? "Ocultar comentarios" : "Mostrar comentarios"}</Text>
          </TouchableOpacity>
        </View>

        {/* post comments */}
        {showComments && (
          <View className="flex gap-2">

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
                onPress={() => handleAddComment(item.id)}
                className="w-7"
              />
            </View>
            
            {/* comments list */}
            {item.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId); 
              return (
                <Text key={index} className="">
                  {commentUser
                    ? `${commentUser.firstName.trim()} ${commentUser.lastName.trim()}: ${comment.text}`
                    : `Usuario Anónimo: ${comment.text}`}
                </Text>
              );
            })}

            {commentsLimit < item.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(item.id)}>
                <Text>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="p-4">
      {/* Title */}
      <View className="py-4">
        <Text className="text-5xl font-extrabold text-[#323743]">
          Mi mundo
        </Text>
      </View>

      {/* Create post */}
      <View className="flex flex-row items-center rounded-full gap-2">
        {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <FontAwesome6 name="user-circle" size={35} />}
        <TextInput
          className="flex-1 px-4 rounded-full font-semibold text-xl bg-[#F3F4F6]"
          placeholder="¿Qué estás pensando?"
          value={content}
          onChangeText={setContent}
          placeholderTextColor="#9095A1"
        />
        <Feather name="image" size={40} onPress={handlePickImage} />
      </View>

      {/* Post button */}
      <View className="my-3">
        <TouchableOpacity
          className="bg-[#A5D6A7] py-3 px-4 rounded-lg"
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text className="color-[#142C15] text-center text-xl">{loading ? "Publicando..." : "Publicar"}</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  post: {
    backgroundColor: "#e5ffe6",
    margin:10,
    padding: 10,
  },
  username: {
    fontWeight: "bold",
    fontFamily: "Inter_600SemiBold",
    color: "#5cb868",
  },
  postContent: {
    marginVertical: 10,
    fontFamily: "Inter_400Regular",
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  likeButton: {
    fontSize: 16,
    color: "#f00",
  },
  toggleCommentsButton: {
    fontSize: 16,
    color: "#007BFF",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  feedContainer: {
    paddingBottom: 100,
  },
  createPostContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
  },
  postButton: {
    backgroundColor: "#28a745",
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  commentsContainer: {
    margin: 2,
    padding: 15,
    backgroundColor: 'white',
  },
  loadMoreText: {
    color: "#007BFF",
    marginTop: 10,
    textAlign: "center",
  },
});

export default SocialNet;

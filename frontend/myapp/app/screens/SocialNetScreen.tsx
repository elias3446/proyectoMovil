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

  const renderPost = ({ item }: { item: Post }) => {
    const userName = users.get(item.userId); // Obtener el nombre usando el UID
    return (
      <View style={styles.post}>
        <Text style={styles.username}>
          {userName ? `${userName.firstName} ${userName.lastName}` : "Usuario Anónimo"}
        </Text>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
        <Text style={styles.postContent}>{item.content}</Text>
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLike(item.id, item.likes)}>
            <Text style={styles.likeButton}>❤ {Array.isArray(item.likes) ? item.likes.length : 0}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.commentsContainer}>
          {item.comments.map((comment, index) => {
            const commentUser = users.get(comment.userId); 
            return (
              <Text key={index} style={styles.commentText}>
                {commentUser
                  ? `${commentUser.firstName} ${commentUser.lastName}: ${comment.text}`
                  : `Usuario Anónimo: ${comment.text}`}
              </Text>
            );
          })}
          <TextInput
            style={styles.commentInput}
            placeholder="Añadir un comentario..."
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.button} onPress={() => handleAddComment(item.id)}>
            <Text style={styles.buttonText}>Comentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.createPostContainer}>
        <TextInput
          style={styles.input}
          placeholder="¿Qué estás pensando?"
          value={content}
          onChangeText={setContent}
        />
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handlePickImage}>
            <Text style={styles.buttonText}>Seleccionar Imagen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.postButton]}
            onPress={handleCreatePost}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Publicando..." : "Publicar"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feedContainer}
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
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  username: {
    fontWeight: "bold",
  },
  postContent: {
    marginVertical: 10,
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
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
  }
});

export default SocialNet;

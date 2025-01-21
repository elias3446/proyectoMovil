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
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as FileSystem from 'expo-file-system';  // Necesario para obtener información sobre el archivo
import { getAuth } from "firebase/auth"; // Para obtener el UID del usuario

// Definir los props de SocialNet que incluyen 'setCurrentScreen'
interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

// Definir la interfaz para los posts
interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  likes: string[]; // Guardar los IDs de los usuarios que han dado like
  comments: { userId: string, text: string }[]; // Comentarios con userId y texto
  createdAt: string;
}

const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState<string>(""); // Contenido del nuevo post
  const [image, setImage] = useState<string | null>(null); // Imagen del nuevo post
  const [loading, setLoading] = useState<boolean>(false); // Estado de carga
  const [comment, setComment] = useState<string>(""); // Contenido del nuevo comentario

  const db = getFirestore();
  const auth = getAuth();

  // Fetch posts in real-time
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

  // Handle image selection
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

  // Upload image to Cloudinary
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

  // Handle post creation
  const handleCreatePost = async () => {
    if (!content) return;

    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageToCloudinary(image);
      }

      await addDoc(collection(db, "posts"), {
        content,
        imageUrl,
        likes: [], // Array de usuarios que han dado like
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

  // Handle like (one per user)
  const handleLike = async (postId: string, currentLikes: string[]) => {
    const userId = auth.currentUser?.uid; // Obtener el UID del usuario actual
    if (!userId) {
      console.error("Usuario no autenticado");
      return;
    }

    if (currentLikes.includes(userId)) {
      alert("¡Ya has dado like a este post!");
      return;
    }

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likes: [...currentLikes, userId], // Agregar el ID del usuario a la lista de likes
      });
    } catch (error) {
      console.error("Error dando like al post:", error);
    }
  };

  // Handle adding a comment
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
        comments: [...posts.find((p) => p.id === postId)?.comments || [], { userId, text: comment }],
      });
      setComment(""); // Limpiar el campo de comentario
    } catch (error) {
      console.error("Error agregando comentario:", error);
    }
  };

  // Render post
  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.post}>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => handleLike(item.id, item.likes)}>
          <Text style={styles.likeButton}>❤ {item.likes.length}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.commentsContainer}>
        {item.comments.map((comment, index) => (
          <Text key={index} style={styles.commentText}>
            {comment.text}
          </Text>
        ))}
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

  return (
    <View style={styles.container}>
      {/* Create Post Section */}
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

      {/* Feed Section */}
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
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  createPostContainer: { padding: 15, backgroundColor: "#fff", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
  previewImage: { width: "100%", height: 200, borderRadius: 5, marginBottom: 10 },
  buttonsContainer: { flexDirection: "row", justifyContent: "space-between" },
  button: { padding: 10, backgroundColor: "#007bff", borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  postButton: { backgroundColor: "#28a745" },
  feedContainer: { padding: 15 },
  post: { marginBottom: 20, padding: 15, backgroundColor: "#fff", borderRadius: 5 },
  postImage: { width: "100%", height: 200, borderRadius: 5, marginBottom: 10 },
  postContent: { fontSize: 16, marginBottom: 10 },
  postActions: { flexDirection: "row", justifyContent: "space-between" },
  likeButton: { color: "#007bff" },
  commentsContainer: { marginTop: 10 },
  commentText: { fontSize: 14, marginBottom: 5 },
  commentInput: { borderWidth: 1, borderColor: "#ccc", padding: 25, borderRadius: 5, marginBottom: 10 },
});

export default SocialNet;

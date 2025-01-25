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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, getDocs } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
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
      }
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      type: "image/jpeg", // Asegúrate de usar el tipo correcto según la imagen
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", "my_upload_preset"); // Reemplaza con tu upload_preset
    data.append("cloud_name", "dwhl67ka5"); // Reemplaza con tu cloud_name

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload", {
        method: "POST",
        body: data,
      });
      const json = await response.json();
      return json.secure_url || null;
    } catch (error) {
      console.error("Error al subir la imagen a Cloudinary:", error);
      return null;
    }
  };

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

    await addDoc(collection(db, "posts"), {
      userId,
      content,
      imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    });

    setContent("");
    setImage(null);
    setLoading(false);
  };

  const handleLike = async (postId: string, currentLikes: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (!Array.isArray(currentLikes)) return;

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
  };

  const handleAddComment = async (postId: string) => {
    if (!comment) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      comments: [
        ...posts.find((p) => p.id === postId)?.comments || [],
        { userId, text: comment },
      ],
    });
    setComment(""); 
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

  const renderPost = ({ item }: { item: Post }) => {
    const userName = users.get(item.userId);
    const showComments = visibleComments[item.id];
    const commentsLimit = commentsToShow[item.id] || 0;

    return (
      <View style={styles.post}>
        <Text style={styles.username}>
          {userName ? `${userName.firstName} ${userName.lastName}` : "Usuario Anónimo"}
        </Text>
        <Text style={styles.postContent}>{item.content}</Text>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLike(item.id, item.likes)}>
          </TouchableOpacity>
          <Text style={styles.likeButton}>{Array.isArray(item.likes) ? item.likes.length : 0}</Text>
          <TouchableOpacity onPress={() => toggleCommentsVisibility(item.id)}>
            <Text style={styles.toggleCommentsButton}>{showComments ? "Ocultar comentarios" : "Mostrar comentarios"}</Text>
          </TouchableOpacity>
        </View>
        {showComments && (
          <View style={styles.commentsContainer}>
            <View style={styles.commentInputContainer}>
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
            {item.comments.slice(0, commentsLimit).map((comment, index) => {
              const commentUser = users.get(comment.userId);
              return (
                <Text key={index} style={styles.commentText}>
                  {commentUser
                    ? `${commentUser.firstName} ${commentUser.lastName}: ${comment.text}`
                    : `Usuario Anónimo: ${comment.text}`}
                </Text>
              );
            })}
            {commentsLimit < item.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(item.id)}>
                <Text style={styles.loadMoreText}>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
            <Text style={styles.buttonText}>Imagen</Text>
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
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',    
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
    width: "90%",
    marginRight: "1%",
    padding: 10,
  },
  button: {
    width: "9%",
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

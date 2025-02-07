import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, getDocs, query, limit, startAfter, orderBy, DocumentSnapshot, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as FileSystem from 'expo-file-system';  
import { getAuth } from "firebase/auth"; 
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Fontisto from '@expo/vector-icons/Fontisto';
import { timeAgo } from "../../utils/utils";

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
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<Map<string, { firstName: string, lastName: string, profileImage: string | null }>>(new Map());
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>(""); 
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});

  const db = getFirestore();
  const auth = getAuth();

  const getPaginatedPosts = (
    afterDoc: DocumentSnapshot | undefined, // último documento cargado
    limitPosts: number, // Límite de posts a cargar por cada página
    callback: (newSnapshots: DocumentSnapshot[]) => void // Función de callback para manejar los nuevos documentos cargados
  ) => {
    // Crea una consulta base para obtener los posts, ordenados por fecha de creación de manera descendente,
    // y limitados al número especificado.
    const queryRef = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitPosts)
    );

    // Si se pasa un documento de referencia (afterDoc), se agrega la cláusula 'startAfter' para paginar
    // y continuar cargando después del último documento de la página anterior.
    const paginatedQuery = afterDoc ? query(queryRef, startAfter(afterDoc)) : queryRef;

    // Se suscribe a los cambios en la consulta paginada utilizando 'onSnapshot'.
    const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
      const newSnapshots = snapshot.docs; // Obtiene los documentos nuevos del snapshot
      callback(newSnapshots); // Llama a la función callback pasando los nuevos documentos
    })

    // Retorna la función para cancelar la suscripción cuando sea necesario.
    return unsubscribe;
  }

  function getLastItem<T>(arr: T[]): T | undefined {
    // slice(-1) retorna un nuevo arreglo con el último elemento,
    // y al acceder al índice [0] obtenemos directamente ese elemento.
    return arr.slice(-1)[0];
  }

  const fetchMorePosts = () => {
    getPaginatedPosts(getLastItem(snapshots), 10, (newSnapshots) => {
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

  useEffect(() => {
    // Carga inicial de posts
    const unsubscribe = getPaginatedPosts(undefined, 10, (newSnapshots) => {
      setSnapshots(newSnapshots);
    });
    // Cancelar el listener en tiempo real al desmontar el componente
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserNames = async () => {
      const usersMap = new Map<string, { firstName: string, lastName: string, profileImage: string | null }>();

      const snapshot = await getDocs(collection(db, "users"));
      snapshot.forEach((doc) => {
        const userData = doc.data();
        usersMap.set(doc.id, {
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          profileImage: userData.profileImage || null,
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

  const getPostById = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId); // Referencia al documento
      const postSnap = await getDoc(postRef); // Obtener el documento
  
      if (postSnap.exists()) {
        const data = postSnap.data(); // Retorna los datos del post
        const post: Post = {
          id: postSnap.id, // El ID del documento
          userId: data.userId,
          content: data.content,
          imageUrl: data.imageUrl || null,
          likes: data.likes || [],
          comments: data.comments || [],
          createdAt: data.createdAt || "",
        };
        return post;
      } else {
        console.log("No existe un post con ese ID.");
        return null;
      }
    } catch (error) {
      console.error("Error obteniendo el post:", error);
      throw error;
    }
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
      getPostById(postId)
        .then((post) => {
          if (post) {
            const user = users.get(userId);
            axios.post(`https://app.nativenotify.com/api/indie/notification`, {
              subID: post.userId,
              appId: 27248,
              appToken: 'g7bm81eIUEY0Mmtod4FmYb',
              title: 'Nuevo like!',
              message: `${user?.firstName.trim()} ha dado like a tu publicación.`
            });
          } else {
            console.log("Post no encontrado.");
          }
        })
        .catch((error) => console.error("Error:", error));
      await updateDoc(postRef, {
        likes: [...currentLikes, userId],
      });
    }
  };

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
      const postRef = doc(db, "posts", postId); // Referencia al documento del post
  
      const commentToAdd = {
        userId,
        text: newComment,
      };
  
      await updateDoc(postRef, {
        comments: [...currentComments, commentToAdd],
      });
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserProfileImage = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      try {
        const userDoc = await getDocs(query(collection(db, "users")));
        userDoc.forEach((doc) => {
          if (doc.id === userId) {
            setProfileImage(doc.data().profileImage || null);
          }
        });
      } catch (error) {
        console.error("Error al obtener la imagen de perfil:", error);
      }
    };
  
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
      <View className="bg-[#E5FFE6] mb-2 rounded-lg flex gap-3">
        {/* photo and username */}
        <View className="flex flex-row items-center gap-2 px-4 pt-4">
          {userName?.profileImage ? <Image source={{ uri: userName.profileImage }} className="object-cover h-8 w-8 rounded-full" /> : <FontAwesome6 name="user-circle" size={26} />}
          <Text className="color-[#5CB868] font-extrabold text-2xl">
            {userName ? `${userName.firstName.trim()} ${userName.lastName.trim()}` : "Usuario Anónimo"}
          </Text>
        </View>

        {/* post content */}
        <Text className="text-xl px-4">{item.content}</Text>

        {/* post image */}
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} className="w-auto rounded-lg mx-2 object-cover h-96" />}

        {/* post actions */}
        <View className="flex flex-row items-center justify-start gap-2 px-4 pt-1">
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
          <View className="flex gap-6 pb-4 px-5">

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
      </View>
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
    <Image source={{ uri: profileImage }} className="object-cover h-10 w-10 rounded-full" />
  ) : (
    <FontAwesome6 name="user-circle" size={40} />
  )}
  <TextInput
className="flex-1 px-3 py-3 rounded-[20] font-semibold text-xl bg-[#F3F4F6]"
    placeholder="¿Qué estás pensando?"
    value={content}
    onChangeText={setContent}
    multiline
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

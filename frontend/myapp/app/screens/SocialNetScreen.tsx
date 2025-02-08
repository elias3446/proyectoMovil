import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  query,
  limit,
  startAfter,
  orderBy,
  DocumentSnapshot,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Fontisto from '@expo/vector-icons/Fontisto';
import { timeAgo } from '../../utils/utils';

interface SocialNetProps {
  setCurrentScreen: (screen: string) => void;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  likes: string[];
  comments: { userId: string; text: string }[];
  createdAt: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SocialNet: React.FC<SocialNetProps> = ({ setCurrentScreen }) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [users, setUsers] = useState<
    Map<string, { firstName: string; lastName: string; profileImage: string | null }>
  >(new Map());
  const [content, setContent] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: boolean }>({});
  const [commentsToShow, setCommentsToShow] = useState<{ [postId: string]: number }>({});

  const db = getFirestore();
  const auth = getAuth();

  const getPaginatedPosts = (
    afterDoc: DocumentSnapshot | undefined,
    limitPosts: number,
    callback: (newSnapshots: DocumentSnapshot[]) => void
  ) => {
    const queryRef = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitPosts)
    );
    const paginatedQuery = afterDoc ? query(queryRef, startAfter(afterDoc)) : queryRef;
    const unsubscribe = onSnapshot(paginatedQuery, (snapshot) => {
      const newSnapshots = snapshot.docs;
      callback(newSnapshots);
    });
    return unsubscribe;
  };

  function getLastItem<T>(arr: T[]): T | undefined {
    return arr.slice(-1)[0];
  }

  const fetchMorePosts = () => {
    getPaginatedPosts(getLastItem(snapshots), 10, (newSnapshots) => {
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

  useEffect(() => {
    const unsubscribe = getPaginatedPosts(undefined, 10, (newSnapshots) => {
      setSnapshots(newSnapshots);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserNames = async () => {
      const usersMap = new Map<
        string,
        { firstName: string; lastName: string; profileImage: string | null }
      >();
      const snapshot = await getDocs(collection(db, 'users'));
      snapshot.forEach((doc) => {
        const userData = doc.data();
        usersMap.set(doc.id, {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
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
    data.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);
    data.append('upload_preset', 'my_upload_preset'); // Reemplaza con tu upload_preset
    data.append('cloud_name', 'dwhl67ka5'); // Reemplaza con tu cloud_name

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dwhl67ka5/image/upload', {
        method: 'POST',
        body: data,
      });
      const json = await response.json();
      return json.secure_url || null;
    } catch (error) {
      console.error('Error al subir la imagen a Cloudinary:', error);
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
      imageUrl = await uploadImageToCloudinary(image);
    }
    await addDoc(collection(db, 'posts'), {
      userId,
      content,
      imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    });
    setContent('');
    setImage(null);
    setLoading(false);
  };

  const handleLike = async (postId: string, currentLikes: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    if (!Array.isArray(currentLikes)) return;
    const postRef = doc(db, 'posts', postId);
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

  const handleAddComment = async (
    postId: string,
    newComment: string,
    currentComments: Array<{ userId: string; text: string }>
  ) => {
    setComment('');
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('Usuario no autenticado');
      return;
    }
    if (!Array.isArray(currentComments)) {
      console.error("El campo 'comments' no es un array:", currentComments);
      return;
    }
    try {
      const postRef = doc(db, 'posts', postId);
      const commentToAdd = {
        userId,
        text: newComment,
      };
      await updateDoc(postRef, {
        comments: [...currentComments, commentToAdd],
      });
    } catch (error) {
      console.error('Error al agregar el comentario al post:', error);
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
        const userDocs = await getDocs(query(collection(db, 'users')));
        userDocs.forEach((doc) => {
          if (doc.id === userId) {
            setProfileImage(doc.data().profileImage || null);
          }
        });
      } catch (error) {
        console.error('Error al obtener la imagen de perfil:', error);
      }
    };
    fetchUserProfileImage();
  }, []);

  const renderPost = ({ item }: { item: Post }) => {
    const userName = users.get(item.userId);
    const showComments = visibleComments[item.id];
    const commentsLimit = commentsToShow[item.id] || 0;
    const userId = auth.currentUser?.uid;
    const userHasLiked =
      userId && Array.isArray(item.likes) && item.likes.includes(userId);
    const createdTimeAgo = timeAgo(item.createdAt);

    return (
      <View style={[styles.postCard, { height: SCREEN_HEIGHT * 0.9 }]}>
        {/* Cabecera del post */}
        <View style={styles.postHeader}>
          {userName?.profileImage ? (
            <Image source={{ uri: userName.profileImage }} style={styles.postUserImage} />
          ) : (
            <FontAwesome6 name="user-circle" size={26} color="#5CB868" />
          )}
          <Text style={styles.postUsername}>
            {userName
              ? `${userName.firstName.trim()} ${userName.lastName.trim()}`
              : 'Usuario Anónimo'}
          </Text>
        </View>

        {/* Contenido del post */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Imagen del post */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        )}

        {/* Acciones */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id, item.likes)}
          >
            <FontAwesome
              name={userHasLiked ? 'heart' : 'heart-o'}
              size={24}
              color="#5CB868"
            />
            <Text style={styles.actionText}>
              {Array.isArray(item.likes) ? item.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleCommentsVisibility(item.id)}
          >
            <Fontisto name="comment" size={24} color="#5CB868" />
            <Text style={styles.actionText}>
              {Array.isArray(item.comments) ? item.comments.length : 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tiempo de publicación */}
        <Text style={styles.postTime}>Hace {createdTimeAgo}</Text>

        {/* Sección de comentarios */}
        {showComments && (
          <View style={styles.commentsContainer}>
            {item.comments.slice(0, commentsLimit).map((commentItem, index) => {
              const commentUser = users.get(commentItem.userId);
              return (
                <View style={styles.comment} key={index}>
                  {commentUser?.profileImage ? (
                    <Image
                      source={{ uri: commentUser.profileImage }}
                      style={styles.commentUserImage}
                    />
                  ) : (
                    <FontAwesome6 name="user-circle" size={27} color="#5CB868" />
                  )}
                  <View>
                    <Text style={styles.commentUsername}>
                      {commentUser
                        ? `${commentUser.firstName.trim()} ${commentUser.lastName.trim()}`
                        : 'Usuario Anónimo'}
                    </Text>
                    <Text style={styles.commentText}>{commentItem.text}</Text>
                  </View>
                </View>
              );
            })}

            {commentsLimit < item.comments.length && (
              <TouchableOpacity onPress={() => loadMoreComments(item.id)}>
                <Text style={styles.loadMoreText}>Cargar más comentarios</Text>
              </TouchableOpacity>
            )}

            {/* Agregar comentario */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Añadir un comentario..."
                placeholderTextColor="#9095A1"
                value={comment}
                onChangeText={setComment}
              />
              <TouchableOpacity
                onPress={() =>
                  handleAddComment(item.id, comment.trim(), item.comments)
                }
                disabled={comment.trim() === ''}
              >
                <Ionicons
                  name={comment.trim() ? 'paper-plane' : 'paper-plane-outline'}
                  size={24}
                  color="#5CB868"
                  style={styles.commentSendIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Mi mundo</Text>
      </View>

      {/* Crear Post */}
      <View style={styles.createPostContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <FontAwesome6 name="user-circle" size={40} color="#5CB868" />
        )}
        <TextInput
          style={styles.postInput}
          placeholder="¿Qué estás pensando?"
          placeholderTextColor="#9095A1"
          value={content}
          onChangeText={setContent}
          multiline
        />
        <Feather
          name="image"
          size={40}
          color="#5CB868"
          onPress={handlePickImage}
          style={styles.imageIcon}
        />
      </View>

      {/* Botón para publicar */}
      <TouchableOpacity
        style={styles.postButton}
        onPress={handleCreatePost}
        disabled={loading}
      >
        <Text style={styles.postButtonText}>
          {loading ? 'Publicando...' : 'Publicar'}
        </Text>
      </TouchableOpacity>

      {/* Lista de Posts con efecto slider vertical */}
      <FlatList
        data={snapshots.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[]}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        pagingEnabled
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onEndReached={fetchMorePosts}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  titleContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#323743',
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postInput: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  imageIcon: {
    marginLeft: 8,
  },
  postButton: {
    height: 50,
    backgroundColor: '#5CB868',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginVertical: 10,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postUsername: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5CB868',
  },
  postContent: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginVertical: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    color: 'black',
    marginLeft: 4,
  },
  postTime: {
    fontSize: 14,
    color: '#565a63',
    marginTop: 4,
  },
  commentsContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  commentUserImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  commentText: {
    fontSize: 14,
    color: 'black',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: 'black',
  },
  commentSendIcon: {
    marginLeft: 8,
  },
  loadMoreText: {
    color: '#5CB868',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SocialNet;

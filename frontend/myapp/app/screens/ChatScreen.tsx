import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomModal from "@/Components/MyModal";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { processChatWithAPI } from '@/api/processWithAPIService';
import { styles } from '@/assets/styles/ChatStyles'; // Asegúrate de ajustar la ruta según corresponda

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: any;
  isSending?: boolean;
}

const ChatScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Estados para el modal de imagen
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const currentUser = getAuth().currentUser;
  const db = getFirestore();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID real del receptor

  // Escucha en tiempo real los mensajes desde Firestore
  useEffect(() => {
    if (user) {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const q = query(userMessagesRef, orderBy('timestamp'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const messagesData: Message[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text,
              sender: data.sender,
              receiver: data.receiver,
              timestamp: data.timestamp,
            } as Message;
          });
          // Ordena por timestamp (por seguridad, aunque el query ya lo ordene)
          messagesData.sort(
            (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
          );
          setMessages(messagesData);
        },
        (err) => {
          console.error('Error al cargar mensajes:', err);
          setError('Error al cargar mensajes.');
        }
      );
      return () => unsubscribe();
    }
  }, [db, user]);

  useEffect(() => {
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileImage(data.profileImage || null); // Update profile image
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser, db]);

  // Auto-scroll al final cuando se agregan nuevos mensajes o aparece el indicador de "escribiendo..."
  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || isBotTyping)) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isBotTyping]);

  // Componente que muestra una animación simple de puntos (".", "..", "...")
  const TypingIndicator: React.FC = () => {
    const [dotCount, setDotCount] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return <Text className={styles.typingIndicatorText}>{'.'.repeat(dotCount)}</Text>;
  };

  // Renderiza el indicador de "escribiendo..." del chatbot
  const renderTypingIndicator = useCallback(() => (
    <View className={styles.typingIndicatorContainer}>
      <View className={styles.avatarContainer}>
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          className={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
      <View className={styles.typingIndicatorBubble}>
        <TypingIndicator />
      </View>
    </View>
  ), []);

  // Función para enviar el mensaje
  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || !user || loading) return;

    const currentMessageText = messageText.trim();
    const senderMessage: Omit<Message, 'id'> = {
      text: currentMessageText,
      sender: user.uid,
      receiver: receiverUID,
      timestamp: new Date(),
    };

    // Muestra inmediatamente el mensaje con un id temporal
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...senderMessage, id: `temp-${Date.now()}`, isSending: true },
    ]);
    setMessageText('');
    setLoading(true);
    setError('');

    try {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

      // Guarda el mensaje del usuario en ambas colecciones
      await Promise.all([
        addDoc(userMessagesRef, senderMessage),
        addDoc(receiverMessagesRef, senderMessage),
      ]);

      // Activa el indicador de "escribiendo..." para simular que el chatbot está respondiendo
      setIsBotTyping(true);

      const botResponseText = await processChatWithAPI(
        currentMessageText,
        user.uid,
        (msg: string) => setMessageText(msg)
      );
        
      const botResponse: Omit<Message, 'id'> = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      await Promise.all([
        addDoc(userMessagesRef, botResponse),
        addDoc(receiverMessagesRef, botResponse),
      ]);
    } catch (err) {
      console.error('Error al enviar el mensaje:', err);
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsBotTyping(false);
      setLoading(false);
    }
  }, [messageText, user, loading, db, receiverUID]);

  // Función para renderizar cada mensaje y detectar si es una imagen para abrir el modal
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMyMessage = item.sender === user?.uid;
    const isBotMessage = item.sender === receiverUID;
    const isCloudinaryImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.text);

    return (
      <View className={styles.messageContainer}>
        {isBotMessage && (
          <View className={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
              className={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        )}
        <View className={isBotMessage ? styles.chatBubbleBot : styles.chatBubbleUser}>
          {isCloudinaryImage && item.text.startsWith('http') ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(item.text);
                setModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.text }}
                className={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text className={styles.messageText}>
              {item.isSending ? '...' : item.text}
            </Text>
          )}
        </View>
        {isMyMessage && (
          profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className={styles.avatarContainer}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons
              name="account-circle"
              size={64}
              color="#B8E6B9"
              style={{
                alignSelf: 'center',
                textAlign: 'center',
                textAlignVertical: 'center',
                lineHeight: 64,
                marginHorizontal: 8,
              }}
            />
          )
        )}
      </View>
    );
  }, [user]);

  return (
    <View className={styles.container}>
      <View className={styles.headerContainer}>
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          className={styles.headerImage}
          resizeMode="cover"
        />
        <Text className={styles.headerText}>
          <Text className={styles.headerSubTextGray}>DAL</Text>
          <Text className={styles.headerSubTextGreen}>IA</Text>
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        ListFooterComponent={isBotTyping ? renderTypingIndicator : null}
      />

      {error ? <Text className={styles.errorText}>{error}</Text> : null}

      <View className={styles.inputContainer}>
        <TextInput
          className={styles.inputField}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          className={`${styles.sendButton} ${loading ? styles.sendButtonLoading : styles.sendButtonDefault}`}
          onPress={sendMessage}
          disabled={loading}
          accessibilityLabel="Enviar mensaje"
          accessibilityRole="button"
        >
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal personalizado para mostrar la imagen seleccionada */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        {selectedImage ? (
          <>
            <Image
              source={{ uri: selectedImage }}
              className={styles.modalImage}
            />
          </>
        ) : (
          <Text className={styles.modalText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default ChatScreen;

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
import CustomModal from '@/Components/MyModal';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { processChatWithAPI } from '@/api/processWithAPIService';
import { styles } from '@/assets/styles/ChatStyles'; // Ajusta la ruta según corresponda

/**
 * Propiedades que recibe el componente ChatScreen.
 */
interface ChatScreenProps {
  setCurrentScreen: (screen: string) => void;
}

/**
 * Interfaz que representa un mensaje en el chat.
 */
export interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: any;
  isSending?: boolean;
}

/* ────────────────────────────────────────────── */
/*               COMPONENTES MODULARES            */
/* ────────────────────────────────────────────── */

/**
 * Componente que muestra el encabezado del chat.
 */
const ChatHeader: React.FC = () => (
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
);

/**
 * Componente que muestra una animación de puntos para indicar que el bot está escribiendo.
 */
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

/**
 * Componente que renderiza el indicador de "bot escribiendo" junto con el avatar del bot.
 */
const BotTypingIndicator: React.FC = () => (
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
);

/**
 * Propiedades para el componente que renderiza cada mensaje.
 */
interface ChatMessageProps {
  message: Message;
  currentUserId: string;
  receiverUID: string;
  profileImage: string | null;
  onImagePress: (uri: string) => void;
}

/**
 * Componente que renderiza un mensaje individual en el chat.
 * Muestra el avatar del bot para mensajes entrantes y el avatar del usuario para mensajes salientes.
 * Si el mensaje es una imagen, permite abrir un modal para visualizarla.
 */
const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
  receiverUID,
  profileImage,
  onImagePress,
}) => {
  const isMyMessage = message.sender === currentUserId;
  const isBotMessage = message.sender === receiverUID;
  const isImageMessage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message.text);

  return (
    <View className={styles.messageContainer}>
      {/* Muestra avatar del bot para mensajes entrantes */}
      {isBotMessage && (
        <View className={styles.avatarContainer}>
          <Image
            source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
            className={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
      )}
      {/* Burbuja del mensaje */}
      <View className={isBotMessage ? styles.chatBubbleBot : styles.chatBubbleUser}>
        {isImageMessage && message.text.startsWith('http') ? (
          <TouchableOpacity onPress={() => onImagePress(message.text)}>
            <Image
              source={{ uri: message.text }}
              className={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <Text className={styles.messageText}>
            {message.isSending ? '...' : message.text}
          </Text>
        )}
      </View>
      {/* Muestra avatar del usuario para mensajes enviados */}
      {isMyMessage &&
        (profileImage ? (
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
        ))}
    </View>
  );
};

/**
 * Propiedades para el componente de entrada de mensaje.
 */
interface ChatInputProps {
  messageText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  loading: boolean;
}

/**
 * Componente que renderiza la entrada de mensaje y el botón de envío.
 */
const ChatInput: React.FC<ChatInputProps> = ({
  messageText,
  onChangeText,
  onSend,
  loading,
}) => (
  <View className={styles.inputContainer}>
    <TextInput
      className={styles.inputField}
      placeholder="Escribe un mensaje..."
      value={messageText}
      onChangeText={onChangeText}
      onSubmitEditing={onSend}
      returnKeyType="send"
    />
    <TouchableOpacity
      className={`${styles.sendButton} ${
        loading ? styles.sendButtonLoading : styles.sendButtonDefault
      }`}
      onPress={onSend}
      disabled={loading}
      accessibilityLabel="Enviar mensaje"
      accessibilityRole="button"
    >
      <MaterialIcons name="send" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

/* ────────────────────────────────────────────── */
/*                COMPONENTE PRINCIPAL            */
/* ────────────────────────────────────────────── */

/**
 * Componente ChatScreen que permite enviar y recibir mensajes en tiempo real.
 * Se conecta a Firestore para leer y escribir mensajes y simula una respuesta del bot
 * utilizando una API externa.
 */
const ChatScreen: React.FC<ChatScreenProps> = ({ setCurrentScreen }) => {
  // Estados para controlar mensajes y la UI
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Estados para el modal de imagen y la imagen de perfil del usuario
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Referencia a la FlatList para auto-scroll
  const flatListRef = useRef<FlatList<Message>>(null);

  // Configuración de autenticación y conexión a Firestore
  const auth = getAuth();
  const user = auth.currentUser;
  const currentUser = getAuth().currentUser;
  const db = getFirestore();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID real del receptor

  /**
   * Se suscribe en tiempo real a los mensajes del usuario en Firestore.
   * Se ordenan por timestamp y se actualiza el estado 'messages'.
   */
  useEffect(() => {
    if (user) {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const messagesQuery = query(userMessagesRef, orderBy('timestamp'));
      const unsubscribe = onSnapshot(
        messagesQuery,
        (querySnapshot) => {
          const messagesData: Message[] = querySnapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              text: data.text,
              sender: data.sender,
              receiver: data.receiver,
              timestamp: data.timestamp,
            } as Message;
          });
          // (Por seguridad) se ordenan los mensajes por timestamp
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

  /**
   * Obtiene la imagen de perfil del usuario desde Firestore.
   */
  useEffect(() => {
    if (user) {
      const fetchProfileImage = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage);
            }
          }
        } catch (err) {
          console.error('Error al obtener la imagen de perfil:', err);
        }
      };
      fetchProfileImage();
    }
  }, [currentUser, db]);

  /**
   * Realiza auto-scroll al final de la lista de mensajes cuando se actualizan
   * o cuando el bot está escribiendo.
   */
  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || isBotTyping)) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isBotTyping]);

  /**
   * Envía un mensaje al chat y lo almacena en Firestore en las colecciones
   * del usuario y del receptor. Además, simula la respuesta del bot utilizando
   * una API externa.
   */
  const sendMessage = useCallback(async () => {
    // Validación: mensaje vacío, usuario no existe o ya se está enviando
    if (!messageText.trim() || !user || loading) return;

    const currentMessageText = messageText.trim();
    // Objeto del mensaje del usuario
    const senderMessage: Omit<Message, 'id'> = {
      text: currentMessageText,
      sender: user.uid,
      receiver: receiverUID,
      timestamp: new Date(),
    };

    // Muestra el mensaje inmediatamente con ID temporal y marca como "enviando"
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...senderMessage, id: `temp-${Date.now()}`, isSending: true },
    ]);
    setMessageText('');
    setLoading(true);
    setError('');

    try {
      // Referencias a las colecciones de mensajes del usuario y receptor
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

      // Guarda el mensaje en ambas colecciones simultáneamente
      await Promise.all([
        addDoc(userMessagesRef, senderMessage),
        addDoc(receiverMessagesRef, senderMessage),
      ]);

      // Activa el indicador de "bot escribiendo..."
      setIsBotTyping(true);

      // Procesa la respuesta del bot mediante una API externa
      const botResponseText = await processChatWithAPI(
        currentMessageText,
        user.uid,
        (msg: string) => setMessageText(msg)
      );

      // Objeto de respuesta del bot
      const botResponse: Omit<Message, 'id'> = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      // Guarda la respuesta del bot en ambas colecciones
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

  /**
   * Maneja la apertura del modal para mostrar una imagen.
   */
  const handleImagePress = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);

  /**
   * Renderiza cada mensaje individual utilizando el componente ChatMessage.
   */
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <ChatMessage
        message={item}
        currentUserId={user?.uid || ''}
        receiverUID={receiverUID}
        profileImage={profileImage}
        onImagePress={handleImagePress}
      />
    ),
    [user, profileImage, receiverUID, handleImagePress]
  );

  return (
    <View className={styles.container}>
      {/* Encabezado del chat */}
      <ChatHeader />

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        ListFooterComponent={isBotTyping ? <BotTypingIndicator /> : null}
      />

      {/* Muestra mensaje de error si ocurre alguno */}
      {error ? <Text className={styles.errorText}>{error}</Text> : null}

      {/* Entrada de mensaje y botón de envío */}
      <ChatInput
        messageText={messageText}
        onChangeText={setMessageText}
        onSend={sendMessage}
        loading={loading}
      />

      {/* Modal personalizado para mostrar la imagen seleccionada */}
      <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} className={styles.modalImage} />
        ) : (
          <Text className={styles.modalText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default ChatScreen;

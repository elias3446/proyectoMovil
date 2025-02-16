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
interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: any;
  isSending?: boolean;
}

/**
 * Componente ChatScreen que permite enviar y recibir mensajes en tiempo real.
 * Se conecta a Firestore para leer y escribir mensajes, y simula una respuesta del bot
 * utilizando una API externa.
 */
const ChatScreen: React.FC<ChatScreenProps> = ({ setCurrentScreen }) => {
  // Estados para controlar los mensajes y la UI
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Estados para el modal de imagen y la imagen de perfil del usuario
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Referencia a la FlatList para permitir el auto-scroll al final
  const flatListRef = useRef<FlatList<Message>>(null);

  // Configuración de autenticación y conexión a Firestore
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID real del receptor

  /**
   * Suscribe en tiempo real a los mensajes del usuario en Firestore.
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
          // Ordena los mensajes por timestamp (por seguridad, aunque el query ya lo ordena)
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
      // Limpia la suscripción cuando se desmonte el componente
      return () => unsubscribe();
    }
  }, [db, user]);

  /**
   * Obtiene la imagen de perfil del usuario desde Firestore y la guarda en el estado.
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
  }, [user, db]);

  /**
   * Realiza auto-scroll al final de la lista de mensajes cada vez que se actualicen
   * los mensajes o cuando el bot está escribiendo.
   */
  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || isBotTyping)) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isBotTyping]);

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
   * Renderiza el indicador de "escribiendo..." junto con el avatar del bot.
   */
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

  /**
   * Envía un mensaje al chat y lo almacena en Firestore en las colecciones del usuario y del receptor.
   * Además, simula la respuesta del bot utilizando una API externa.
   */
  const sendMessage = useCallback(async () => {
    // Validación: si el mensaje está vacío, el usuario no existe o ya se está enviando otro mensaje, se aborta.
    if (!messageText.trim() || !user || loading) return;

    const currentMessageText = messageText.trim();
    // Crea el objeto del mensaje del usuario
    const senderMessage: Omit<Message, 'id'> = {
      text: currentMessageText,
      sender: user.uid,
      receiver: receiverUID,
      timestamp: new Date(),
    };

    // Muestra inmediatamente el mensaje con un ID temporal y marca como "enviando"
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...senderMessage, id: `temp-${Date.now()}`, isSending: true },
    ]);
    setMessageText('');
    setLoading(true);
    setError('');

    try {
      // Referencias a las colecciones de mensajes del usuario y del receptor
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

      // Guarda el mensaje en ambas colecciones de forma simultánea
      await Promise.all([
        addDoc(userMessagesRef, senderMessage),
        addDoc(receiverMessagesRef, senderMessage),
      ]);

      // Activa el indicador de "bot escribiendo..."
      setIsBotTyping(true);

      // Procesa la respuesta del chatbot utilizando una API externa
      const botResponseText = await processChatWithAPI(
        currentMessageText,
        user.uid,
        (msg: string) => setMessageText(msg)
      );

      // Crea el objeto de respuesta del bot
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
   * Renderiza cada mensaje individual en la lista del chat.
   * Si el mensaje corresponde a una imagen, se habilita el modal al tocarla.
   */
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      // Determina si el mensaje es del usuario actual o del bot
      const isMyMessage = item.sender === user?.uid;
      const isBotMessage = item.sender === receiverUID;
      // Comprueba si el texto del mensaje es una URL de imagen (por extensión)
      const isImageMessage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.text);

      return (
        <View className={styles.messageContainer}>
          {/* Muestra el avatar del bot para mensajes entrantes */}
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
            {isImageMessage && item.text.startsWith('http') ? (
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
          {/* Muestra el avatar del usuario para mensajes enviados */}
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
    },
    [user, profileImage, receiverUID]
  );

  return (
    <View className={styles.container}>
      {/* Encabezado del chat */}
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

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        ListFooterComponent={isBotTyping ? renderTypingIndicator : null}
      />

      {/* Muestra mensaje de error si ocurre alguno */}
      {error ? <Text className={styles.errorText}>{error}</Text> : null}

      {/* Entrada de mensaje y botón de envío */}
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
          <Image
            source={{ uri: selectedImage }}
            className={styles.modalImage}
          />
        ) : (
          <Text className={styles.modalText}>No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default ChatScreen;

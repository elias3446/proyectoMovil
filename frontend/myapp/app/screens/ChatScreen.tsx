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
    if (user) {
      const fetchProfileImage = async () => {
        try {
          // Obtén la referencia al documento del usuario en Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage); // Guarda la URL de la imagen de perfil
            }
          }
        } catch (error) {
          console.error('Error al obtener la imagen de perfil:', error);
        }
      };

      fetchProfileImage();
    }
  }, [user, db]);

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
    return <Text className="text-base text-gray-500">{'.'.repeat(dotCount)}</Text>;
  };

  // Renderiza el indicador de "escribiendo..." del chatbot
  const renderTypingIndicator = useCallback(() => (
    <View className="flex-row items-start my-1">
      <View className="w-16 h-16 rounded-full overflow-hidden justify-center items-center mx-2">
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="bg-gray-300 p-2 rounded-lg max-w-[70%] flex-row items-center">
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
      <View className="flex-row items-start my-1">
        {isBotMessage && (
          <View className="w-16 h-16 rounded-full overflow-hidden justify-center items-center mx-2">
            <Image
              source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )}
        <View
          className={`p-2 rounded-lg max-w-[70%] flex-row items-center ${
            isBotMessage ? 'bg-gray-300' : 'bg-[#B8E6B9] ml-auto'
          }`}
        >
          {isCloudinaryImage && item.text.startsWith('http') ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(item.text);
                setModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.text }}
                className="w-[200px] h-[200px] rounded-lg my-1"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text className="text-base text-gray-500">
              {item.isSending ? '...' : item.text}
            </Text>
          )}
        </View>
        {isMyMessage && (
          
          profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className="w-16 h-16 rounded-full overflow-hidden justify-center items-center mx-2"
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
    <View className="flex-1 bg-white">
      <View className="flex-col items-center bg-white py-5 px-4">
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          className="w-24 h-24 rounded-xl mb-2"
          resizeMode="cover"
        />
        <Text className="text-2xl font-normal text-center">
          <Text className="text-gray-400">DAL</Text>
          <Text className="text-green-300">IA</Text>
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

      {error ? <Text className="text-red-500 mt-2 text-center">{error}</Text> : null}

      <View className="flex-row items-center p-4 bg-white">
        <TextInput
          className="flex-1 h-12 border border-gray-300 rounded-full px-4 mr-2 text-gray-400"
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          className={`w-14 h-14 rounded-full justify-center items-center ${
            loading ? 'bg-green-300' : 'bg-[#5CB868]'
          }`}
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
              className="w-full aspect-square rounded-lg"
            />
          </>
        ) : (
          <Text className="text-gray-500">No hay imagen seleccionada</Text>
        )}
      </CustomModal>
    </View>
  );
};

export default ChatScreen;

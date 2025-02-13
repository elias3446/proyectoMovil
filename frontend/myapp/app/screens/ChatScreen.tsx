// ChatScreen.tsx
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

// Importa funciones del servicio de chat (Firebase)
import {
  subscribeToUserMessages,
  sendChatAndBotResponse,
  Message,
  getCurrentUser,
} from '@/api/firebaseService';

/* =====================================================
   =============== COMPONENTE TypingIndicator =========
   ===================================================== */
/**
 * Muestra una animación simple de "puntos" para indicar que el bot está escribiendo.
 */
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

/* =====================================================
   =============== COMPONENTE ChatHeader ===============
   ===================================================== */
/**
 * Muestra el encabezado del chat con la imagen del bot y el título.
 */
const ChatHeader: React.FC = () => (
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
);

/* =====================================================
   =============== COMPONENTE MessageBubble =============
   ===================================================== */
interface MessageBubbleProps {
  message: Message;
  currentUserUID?: string;
  receiverUID: string;
}

/**
 * Renderiza un mensaje individual (burbuja de mensaje) en el chat.
 * Muestra avatar para el bot y el ícono de usuario para los mensajes propios.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserUID, receiverUID }) => {
  const isMyMessage = message.sender === currentUserUID;
  const isBotMessage = message.sender === receiverUID;
  const isCloudinaryImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message.text);

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
          isBotMessage ? 'bg-gray-300' : 'bg-green-300 ml-auto'
        }`}
      >
        {isCloudinaryImage && message.text.startsWith('http') ? (
          <Image
            source={{ uri: message.text }}
            className="w-[200px] h-[200px] rounded-lg my-1"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-base text-gray-500">
            {message.isSending ? '...' : message.text}
          </Text>
        )}
      </View>
      {isMyMessage && (
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
      )}
    </View>
  );
};

/* =====================================================
   =============== COMPONENTE ChatInput =================
   ===================================================== */
interface ChatInputProps {
  messageText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  loading: boolean;
}

/**
 * Área de entrada para escribir y enviar mensajes.
 */
const ChatInput: React.FC<ChatInputProps> = ({ messageText, onChangeText, onSend, loading }) => (
  <View className="flex-row items-center p-4 bg-white">
    <TextInput
      className="flex-1 h-12 border border-gray-300 rounded-full px-4 mr-2 text-gray-400"
      placeholder="Escribe un mensaje..."
      value={messageText}
      onChangeText={onChangeText}
      onSubmitEditing={onSend}
      returnKeyType="send"
    />
    <TouchableOpacity
      className={`w-14 h-14 rounded-full justify-center items-center ${
        loading ? 'bg-green-300' : 'bg-green-600'
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

/* =====================================================
   =============== PANTALLA ChatScreen =================
   ===================================================== */
interface ChatScreenProps {
  setCurrentScreen: (screen: string) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ setCurrentScreen }) => {
  // Estados para mensajes, entrada, carga, error y el indicador de "bot escribiendo"
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Referencia a la lista de mensajes para auto-scroll
  const flatListRef = useRef<FlatList>(null);

  // Obtiene el usuario actual (desde Firebase)
  const user = getCurrentUser();
  // Define el UID del receptor (por ejemplo, el chatbot)
  const receiverUID = 'receiverUID'; // Reemplazar con el UID real del receptor

  // Se suscribe a los mensajes del usuario
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserMessages(
        user.uid,
        (msgs) => setMessages(msgs),
        (err) => {
          console.error('Error al cargar mensajes:', err);
          setError('Error al cargar mensajes.');
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  // Auto-scroll al final cuando se agregan nuevos mensajes o se muestra el indicador de "bot escribiendo"
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, [messages, isBotTyping]);

  /**
   * Envía un mensaje y solicita la respuesta del bot.
   * Agrega un mensaje temporal para dar retroalimentación inmediata.
   */
  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || !user || loading) return;

    const currentMessageText = messageText.trim();

    // Agrega un mensaje temporal para retroalimentación inmediata
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        text: currentMessageText,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
        isSending: true,
      },
    ]);
    setMessageText('');
    setLoading(true);
    setError('');

    try {
      // Muestra el indicador de "bot escribiendo..."
      setIsBotTyping(true);
      // Envía el mensaje y espera la respuesta del bot
      await sendChatAndBotResponse(user.uid, receiverUID, currentMessageText);
    } catch (err: any) {
      console.error('Error al enviar el mensaje:', err);
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsBotTyping(false);
      setLoading(false);
    }
  }, [messageText, user, loading, receiverUID]);

  /**
   * Renderiza cada mensaje utilizando el componente MessageBubble.
   */
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} currentUserUID={user?.uid} receiverUID={receiverUID} />
    ),
    [user, receiverUID]
  );

  return (
    <View className="flex-1 bg-white">
      {/* Encabezado del chat */}
      <ChatHeader />

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        ListFooterComponent={isBotTyping ? (
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
        ) : null}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Muestra mensaje de error, en caso de existir */}
      {error ? <Text className="text-red-500 mt-2 text-center">{error}</Text> : null}

      {/* Área de entrada y envío de mensajes */}
      <ChatInput
        messageText={messageText}
        onChangeText={setMessageText}
        onSend={sendMessage}
        loading={loading}
      />
    </View>
  );
};

export default ChatScreen;

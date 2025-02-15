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
import { Message }from '@/interfaces/Message';
import { getCurrentUser, sendChatMessage, subscribeToChatMessages } from '@/api/firebaseService';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const ChatScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const user = getCurrentUser();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID real del receptor

  // Escucha en tiempo real los mensajes desde Firestore
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToChatMessages(user.uid, (newMessages: Message[]) => {
        setMessages(newMessages);
      }, (error: string) => {
        setError(error);
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

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

      await sendChatMessage(user.uid, receiverUID, senderMessage);

      // Activa el indicador de "escribiendo..." para simular que el chatbot está respondiendo
      setIsBotTyping(true);

      const response = await fetch('https://proyectomovil-1.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessageText, user: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener la respuesta de la API');
      }

      const responseData = await response.json();
      const botResponseText =
        responseData?.response || 'No se obtuvo una respuesta válida.';

      const botResponse: Omit<Message, 'id'> = {
        text: botResponseText,
        sender: receiverUID,
        receiver: user.uid,
        timestamp: new Date(),
      };

      await sendChatMessage(receiverUID, user.uid, botResponse);
    } catch (err) {
      console.error('Error al enviar el mensaje:', err);
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsBotTyping(false);
      setLoading(false);
    }
  }, [messageText, user?.uid, loading, receiverUID]);

  // Función para renderizar cada mensaje
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
            isBotMessage ? 'bg-gray-300' : 'bg-green-300 ml-auto'
          }`}
        >
          {isCloudinaryImage && item.text.startsWith('http') ? (
            <Image
              source={{ uri: item.text }}
              className="w-[200px] h-[200px] rounded-lg my-1"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-base text-gray-500">
              {item.isSending ? '...' : item.text}
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
            loading ? 'bg-green-300' : 'bg-green-600'
          }`}
          onPress={sendMessage}
          disabled={loading}
          accessibilityLabel="Enviar mensaje"
          accessibilityRole="button"
        >
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

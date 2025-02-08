import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const ChatScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  interface Message {
    id: string;
    text: string;
    sender: string;
    receiver: string;
    timestamp: any;
    isSending?: boolean; // Para manejar los mensajes que se están enviando
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID del receptor.

  // Escucha en tiempo real los mensajes desde Firestore
  useEffect(() => {
    if (user) {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const q = query(userMessagesRef, orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            text: data.text,
            sender: data.sender,
            receiver: data.receiver,
            timestamp: data.timestamp,
          });
        });
        messagesData.sort(
          (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
        );
        setMessages(messagesData);
      });
      return () => unsubscribe();
    }
  }, [db, user]);

  // Componente que muestra una animación simple de puntos (".", "..", "...")
  const TypingIndicator: React.FC = () => {
    const [dotCount, setDotCount] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return <Text style={styles.messageText}>{'.'.repeat(dotCount)}</Text>;
  };

  // Renderiza el indicador de "escribiendo..." del chatbot
  const renderTypingIndicator = () => (
    <View style={styles.messageRow}>
      <View style={styles.avatar}>
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          style={styles.avatarImage}
        />
      </View>
      <View style={styles.botBubble}>
        <TypingIndicator />
      </View>
    </View>
  );

  // Auto-scroll al final cuando se agregan nuevos mensajes o aparece el indicador de "escribiendo..."
  useEffect(() => {
    if (messages.length > 0 || isBotTyping) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isBotTyping]);

  // Función para enviar el mensaje
  const sendMessage = async () => {
    if (messageText.trim() && user && !loading) {
      const currentMessageText = messageText;
      const senderMessage = {
        text: currentMessageText,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
      };

      // Se muestra inmediatamente el mensaje del usuario
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...senderMessage, id: `temp-${Date.now()}` },
      ]);
      setMessageText('');
      setLoading(true);
      setError('');

      try {
        const userMessagesRef = collection(db, 'users', user.uid, 'messages');
        const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

        await addDoc(userMessagesRef, senderMessage);
        await addDoc(receiverMessagesRef, senderMessage);

        // Activa el indicador de "escribiendo..." para simular que el chatbot está pensando
        setIsBotTyping(true);

        const response = await fetch('https://proyectomovil-qh8q.onrender.com/chat', {
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

        const botResponse = {
          text: botResponseText,
          sender: receiverUID,
          receiver: user.uid,
          timestamp: new Date(),
        };

        await addDoc(userMessagesRef, botResponse);
        await addDoc(receiverMessagesRef, botResponse);

        // Desactiva el indicador al recibir la respuesta
        setIsBotTyping(false);
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
        setIsBotTyping(false);
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para renderizar cada mensaje
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === user?.uid;
    const isBotMessage = item.sender === receiverUID;
    const isCloudinaryImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.text);

    return (
      <View style={styles.messageRow}>
        {isBotMessage && (
          <View style={styles.avatar}>
            <Image
              source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
              style={styles.avatarImage}
            />
          </View>
        )}
        <View style={isBotMessage ? styles.botBubble : styles.userBubble}>
          {isCloudinaryImage && item.text.startsWith('http') ? (
            <Image source={{ uri: item.text }} style={styles.imageMessage} />
          ) : (
            <Text style={styles.messageText}>
              {item.isSending ? '...' : item.text}
            </Text>
          )}
        </View>
        {isMyMessage && (
          <View style={styles.avatar}>
            <MaterialIcons name="account-circle" size={64} color="#B8E6B9" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
          style={styles.profileImage}
        />
        <Text style={styles.contactName}>
          <Text style={styles.dal}>DAL</Text>
          <Text style={styles.ia}>IA</Text>
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={isBotTyping ? renderTypingIndicator : null}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: '#9CA3AF' }]}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: loading ? '#B8E6B9' : '#5CB868' },
          ]}
          onPress={sendMessage}
          disabled={loading}
        >
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    paddingTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 25,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  dal: {
    color: '#9095A1',
  },
  ia: {
    color: '#B8E6B9',
  },
  messagesContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  // Contenedor de avatar para chatbot y usuario (64x64 píxeles)
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  // La imagen ocupa todo el contenedor
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  botBubble: {
    padding: 10,
    backgroundColor: '#D1D5DB',
    borderRadius: 8,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    padding: 10,
    backgroundColor: '#B8E6B9',
    borderRadius: 8,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ChatScreen;

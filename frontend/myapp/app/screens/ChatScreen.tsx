import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const ChatScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: any; // Para manejar la ordenación
    isSending?: boolean;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatListRef = useRef<FlatList>(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const db = getFirestore();

  useEffect(() => {
    if (user) {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const q = query(userMessagesRef, orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const messagesData: Message[] = [];

        // Procesar los mensajes de forma secuencial
        const processMessages = async () => {
          for (const doc of querySnapshot.docs) {
            const data = doc.data();

            if (!data.text) {
              // Si el mensaje no tiene texto, buscar los fragmentos
              const fragmentsCollection = collection(doc.ref, 'imageFragments');
              const fragmentsQuery = query(fragmentsCollection, orderBy('fragmentIndex'));
              const fragmentsSnapshot = await getDocs(fragmentsQuery); // Usa getDocs para obtener todos los fragmentos

              const fragments: string[] = [];
              fragmentsSnapshot.forEach((fragmentDoc) => {
                const fragmentData = fragmentDoc.data();
                fragments.push(fragmentData.fragment);
              });

              const reconstructedImage = fragments.join(''); // Reconstruir la imagen base64
              messagesData.push({
                id: doc.id,
                text: reconstructedImage,
                sender: data.sender,
                timestamp: data.timestamp,
              });
            } else {
              // Mensaje normal
              messagesData.push({
                id: doc.id,
                text: data.text,
                sender: data.sender,
                timestamp: data.timestamp,
              });
            }
          }
        };

        await processMessages();

        // Ordenar mensajes por timestamp (por si acaso)
        messagesData.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        setMessages(messagesData);
      });

      return () => unsubscribe();
    }
  }, [db, user]);

  const sendMessage = async () => {
    if (messageText.trim() && user && !loading) {
      const userMessage = {
        id: `user-${Date.now()}`,
        text: messageText,
        sender: 'me',
        timestamp: new Date(),
      };

      const systemMessage = {
        id: `bot-${Date.now()}`,
        text: '',
        sender: 'other',
        isSending: true,
        timestamp: new Date(),
      };

      // Actualiza los mensajes en el estado antes de enviar
      setMessages((prevMessages) => [...prevMessages, userMessage, systemMessage]);
      setMessageText('');
      setLoading(true);
      setError('');

      try {
        const userMessagesRef = collection(db, 'users', user.uid, 'messages');
        await addDoc(userMessagesRef, {
          text: messageText,
          sender: 'me',
          timestamp: new Date(),
        });

        const response = await fetch('https://chat-hfp7.onrender.com/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al comunicarse con el servidor');
        }

        const data = await response.json();
        const botResponse = {
          id: `bot-${Date.now()}`,
          text: data.response || 'Lo siento, no entendí eso. ¿Puedes decirlo de otra manera?',
          sender: 'other',
          isSending: false,
          timestamp: new Date(),
        };

        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg) =>
            msg.id === systemMessage.id ? { ...msg, isSending: false, text: botResponse.text } : msg
          );
          return [...updatedMessages];
        });

        // Guardar la respuesta del asistente en Firestore
        await addDoc(userMessagesRef, {
          text: botResponse.text,
          sender: 'other',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(error);
        setError('No se pudo obtener respuesta del servidor');
      } finally {
        setLoading(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';

    // Verificar si el texto es una imagen base64 válida
    const isBase64Image = /^data:image\/[a-zA-Z]+;base64,/.test(item.text);

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        {isBase64Image ? (
          <Image source={{ uri: item.text }} style={styles.imageMessage} />
        ) : (
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.isSending ? '...' : item.text}
          </Text>
        )}
        {item.isSending && !isMyMessage ? <Text style={styles.loadingText}>...</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('CameraCaptureScreen')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.contactName}>Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={loading}>
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075e54',
    padding: 15,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1877f2',
    marginRight: 10,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1877f2',
    padding: 10,
    borderRadius: 5,
  },
  imageMessage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ChatScreen;
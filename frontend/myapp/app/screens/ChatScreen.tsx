import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
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
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            text: data.text,
            sender: data.sender,
            timestamp: data.timestamp,
            isSending: data.isSending || false,
          });
        });
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
        timestamp: new Date(), // Añadir timestamp para ordenar en Firestore
      };

      const systemMessage = { 
        id: `bot-${Date.now()}`, 
        text: '', 
        sender: 'other',
        isSending: true,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage, systemMessage]);
      setMessageText('');
      setLoading(true);
      setError('');

      const historial = messages.map(msg => ({
        role: msg.sender === 'me' ? 'user' : 'assistant',
        parts: [msg.text],
      }));

      try {
        const userMessagesRef = collection(db, 'users', user.uid, 'messages');
        await addDoc(userMessagesRef, {
          text: messageText,
          sender: 'me',
          timestamp: new Date(),
        });

        const response = await fetch('http://127.0.0.1:5000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mensaje: messageText,
            historial: [...historial, { role: 'user', parts: [messageText] }],
          }),
        });

        if (!response.ok) {
          throw new Error('Error al comunicarse con el servidor');
        }

        const data = await response.json();
        const botResponse = {
          id: `bot-${Date.now()}`,
          text: data.respuesta || 'Lo siento, no entendí eso. ¿Puedes decirlo de otra manera?',
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

  const handleRecord = () => {
    console.log('Recording...');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.isSending ? '...' : item.text}
        </Text>
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
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
        </View>
        <Text style={styles.contactName}>Contacto</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} // Desplazar al último mensaje al cargar
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
        <TouchableOpacity onPress={handleRecord} style={styles.micButton}>
          <MaterialIcons name="mic" size={24} color="#00796b" />
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
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00796b',
    borderRadius: 25,
    padding: 5,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1877f2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    marginLeft: 10,
    backgroundColor: '#e0f2f1',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ChatScreen;

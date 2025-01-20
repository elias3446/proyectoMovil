import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isSending?: boolean;
}

interface ChatProps {
  setCurrentScreen: (screen: string) => void;
}

const ChatScreen: React.FC<ChatProps> = ({ setCurrentScreen }) => {
  const [session, setSession] = useState({
    messages: [] as Message[],
    history: [] as { role: string; content: string }[],
    loading: false,
    error: '',
  });

  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const auth = getAuth();
  const db = getFirestore();

  const userId = auth.currentUser?.uid;
  const chatDocRef = userId ? doc(db, 'chats', userId) : null;

  // Cargar el chat completo desde Firestore
  useEffect(() => {
    if (chatDocRef) {
      const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const chatData = docSnapshot.data();
          setSession({
            messages: chatData.messages || [],
            history: chatData.history || [],
            loading: false,
            error: '',
          });
        }
      });

      return () => unsubscribe();
    }
  }, [chatDocRef]);

  const saveChatToFirestore = async (updatedSession: typeof session) => {
    if (chatDocRef) {
      await setDoc(chatDocRef, {
        messages: updatedSession.messages,
        history: updatedSession.history,
      });
    }
  };

  const sendMessage = async () => {
    if (messageText.trim()) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: messageText,
        sender: 'me',
        timestamp: Date.now(),
      };

      const systemMessage: Message = {
        id: `bot-${Date.now()}`,
        text: '',
        sender: 'other',
        isSending: true,
        timestamp: Date.now(),
      };

      // Actualizar estado local
      const updatedSession = {
        ...session,
        messages: [...session.messages, userMessage, systemMessage],
        history: [...session.history, { role: 'user', content: messageText }],
        loading: true,
        error: '',
      };
      setSession(updatedSession);

      // Guardar chat actualizado en Firestore
      await saveChatToFirestore(updatedSession);

      setMessageText(''); // Limpiar el campo de texto

      try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mensaje: messageText,
            historial: updatedSession.history,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al comunicarse con el servidor');
        }

        const data = await response.json();
        const botResponse: Message = {
          id: `bot-${Date.now()}`,
          text: data.respuesta || 'Lo siento, no entendí eso. ¿Puedes decirlo de otra manera?',
          sender: 'other',
          isSending: false,
          timestamp: Date.now(),
        };

        // Actualizar el chat con la respuesta del bot
        const finalSession = {
          ...updatedSession,
          messages: updatedSession.messages.map((msg) =>
            msg.id === systemMessage.id ? { ...msg, isSending: false, text: botResponse.text } : msg
          ),
          history: [...updatedSession.history, { role: 'assistant', content: botResponse.text }],
        };

        setSession(finalSession);
        await saveChatToFirestore(finalSession);

      } catch (error) {
        console.error(error);
        setSession((prevSession) => ({
          ...prevSession,
          error: 'No se pudo obtener respuesta del servidor',
          loading: false,
        }));
      } finally {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('CameraCaptureScreen')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
        </View>
        <Text style={styles.contactName}>Contacto</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={session.messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Error Message */}
      {session.error ? <Text style={styles.error}>{session.error}</Text> : null}

      {/* Input and Send Button */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={session.loading}>
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
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ChatScreen;

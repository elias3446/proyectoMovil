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
    isSending?: boolean; // Estado de si el mensaje está siendo enviado
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);  // Estado para el loading
  const [error, setError] = useState('');  // Estado para errores

  // Ref para controlar el desplazamiento del FlatList
  const flatListRef = useRef<FlatList>(null);

  // Obtén el usuario autenticado
  const auth = getAuth();
  const user = auth.currentUser;

  const db = getFirestore();

  // Escuchar los mensajes de Firestore para el usuario registrado
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
            isSending: data.isSending || false,
          });
        });
        setMessages(messagesData);
      });

      return () => unsubscribe(); // Cleanup
    }
  }, [db, user]);

  const sendMessage = async () => {
    if (messageText.trim() && user) {
      // Crear mensaje del usuario
      const userMessage = { 
        id: `user-${Date.now()}`, 
        text: messageText, 
        sender: 'me'
      };

      // Crear mensaje del bot (con estado "enviando")
      const systemMessage = { 
        id: `bot-${Date.now()}`, 
        text: '', // Estará vacío inicialmente
        sender: 'other',
        isSending: true // El bot está enviando una respuesta
      };

      setMessages((prevMessages) => [...prevMessages, userMessage, systemMessage]);
      setMessageText('');

      setLoading(true);
      setError('');  // Limpiar errores si los hubiera

      const historial = messages.map(msg => ({
        role: msg.sender === 'me' ? 'user' : 'assistant',
        parts: [msg.text],
      }));

      try {
        // Guardar el mensaje del usuario en Firestore
        const userMessagesRef = collection(db, 'users', user.uid, 'messages');
        await addDoc(userMessagesRef, {
          text: messageText,
          sender: 'me',
          timestamp: new Date(),
        });

        // Enviar mensaje al backend para obtener la respuesta del bot
        const response = await fetch('http://127.0.0.1:5000/chat', {  // URL de tu backend
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
          id: `bot-${Date.now()}`,  // Nuevo ID único para el mensaje del bot
          text: data.respuesta || 'Lo siento, no entendí eso. ¿Puedes decirlo de otra manera?',
          sender: 'other',
          isSending: false // El mensaje del bot ya fue recibido
        };

        setMessages((prevMessages) => {
          // Actualizamos el mensaje del bot, eliminando el estado de "enviando"
          const updatedMessages = prevMessages.map((msg) =>
            msg.id === systemMessage.id ? { ...msg, isSending: false, text: botResponse.text } : msg
          );
          return [...updatedMessages];
        });

        // Guardar el mensaje del bot en Firestore bajo el UID del usuario
        await addDoc(userMessagesRef, {
          text: botResponse.text,
          sender: 'other',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(error);
        setError('No se pudo obtener respuesta del servidor');
      } finally {
        setLoading(false);  // Desactivar el loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const handleRecord = () => {
    // Implementar la funcionalidad de grabación aquí
    console.log('Recording...');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.isSending ? '...' : item.text}
        </Text>
        {item.isSending && !isMyMessage ? (  // Los puntos de carga solo se muestran en el mensaje del bot
          <Text style={styles.loadingText}>...</Text>
        ) : null}
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
        ref={flatListRef} // Asignar la referencia al FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Error Message */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Input and Send Button */}
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
    marginTop: 5, // Ajuste de espacio para los puntos
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
    backgroundColor: '#e0f2f1', // Color de fondo del micrófono
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

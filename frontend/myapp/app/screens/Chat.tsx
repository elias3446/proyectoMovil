import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const Chat: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  interface Message {
    id: string;
    text: string;
    sender: string;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  
  // Ref para controlar el desplazamiento del FlatList
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (messageText.trim()) {
      const userMessage = { id: Date.now().toString(), text: messageText, sender: 'me' };
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, userMessage];
        // Generar respuesta automática después de cada mensaje enviado por el usuario
        const systemResponse = {
          id: Date.now().toString(),
          text: getResponseMessage(messageText),
          sender: 'other',
        };
        return [...updatedMessages, systemResponse];
      });
      setMessageText('');

      // Desplazar automáticamente hacia el final después de agregar un mensaje
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const getResponseMessage = (userInput: string) => {
    // Respuestas automáticas básicas según el texto del usuario
    if (userInput.toLowerCase().includes('hola')) {
      return '¡Hola! ¿Cómo estás?';
    }
    if (userInput.toLowerCase().includes('bien')) {
      return 'Me alegra saber que estás bien. ¿En qué te puedo ayudar?';
    }
    if (userInput.toLowerCase().includes('adiós')) {
      return '¡Hasta pronto! Que tengas un buen día.';
    }
    return 'Lo siento, no entendí eso. ¿Puedes decirlo de otra manera?';
  };

  const handleRecord = () => {
    // Implement the recording functionality here
    console.log('Recording...');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('CameraCapture')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
        </View>
        <Text style={styles.contactName}>Contacto</Text>
      </View>

      <FlatList
        ref={flatListRef} // Asignar la referencia al FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
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
});

export default Chat;

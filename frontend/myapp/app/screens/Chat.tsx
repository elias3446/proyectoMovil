import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface LoginProps {
    setCurrentScreen: (screen: string) => void;
  }

const Chat : React.FC<LoginProps> = ({ setCurrentScreen }) =>{
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hola, ¿cómo estás?', sender: 'other' },
    { id: '2', text: '¡Hola! Estoy bien, ¿y tú?', sender: 'me' },
    // Más mensajes de ejemplo...
  ]);
  const [messageText, setMessageText] = useState('');

  const sendMessage = () => {
    if (messageText.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: messageText, sender: 'me' }]);
      setMessageText('');
    }
  };

  const handleRecord = () => {
    // Lógica para el micrófono, como grabar audio
    console.log('Iniciando grabación...');
  };

  interface Message {
    id: string;
    text: string;
    sender: string;
  }

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
        <TouchableOpacity onPress={() => setCurrentScreen("CameraCapture")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.contactName}>Contacto</Text>
      </View>
      
      <FlatList
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
    shadowColor: "#000",
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
    shadowColor: "#000",
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

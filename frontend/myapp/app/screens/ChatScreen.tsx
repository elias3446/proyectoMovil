import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
    receiver: string;
    timestamp: any;
    isSending?: boolean; // Para manejar los mensajes que se están enviando
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const receiverUID = 'receiverUID'; // Reemplaza con el UID del receptor.

  useEffect(() => {
    if (user) {
      const userMessagesRef = collection(db, 'users', user.uid, 'messages');
      const q = query(userMessagesRef, orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const messagesData: Message[] = [];

        const processMessages = async () => {
          for (const doc of querySnapshot.docs) {
            const data = doc.data();

            if (!data.text) {
              // Si el mensaje no tiene texto, buscar los fragmentos
              const fragmentsCollection = collection(doc.ref, 'imageFragments');
              const fragmentsQuery = query(fragmentsCollection, orderBy('fragmentIndex'));
              const fragmentsSnapshot = await getDocs(fragmentsQuery);

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
                receiver: data.receiver,
                timestamp: data.timestamp,
              });
            } else {
              // Mensaje normal
              messagesData.push({
                id: doc.id,
                text: data.text,
                sender: data.sender,
                receiver: data.receiver,
                timestamp: data.timestamp,
              });
            }
          }
        };

        await processMessages();

        messagesData.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        setMessages(messagesData);
      });

      return () => unsubscribe();
    }
  }, [db, user]);

  const sendMessage = async () => {
    if (messageText.trim() && user && !loading) {
      const senderMessage = {
        text: messageText,
        sender: user.uid,
        receiver: receiverUID,
        timestamp: new Date(),
      };

      // Mostrar el mensaje del emisor en la interfaz inmediatamente
      setMessages((prevMessages) => [...prevMessages, { ...senderMessage, id: `temp-${Date.now()}` }]);
      setMessageText('');
      setLoading(true);
      setError('');

      try {
        const userMessagesRef = collection(db, 'users', user.uid, 'messages');
        const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

        const messageDocRef = await addDoc(userMessagesRef, senderMessage);

        await addDoc(receiverMessagesRef, senderMessage);

        const response = await fetch('https://proyectomovil-qh8q.onrender.com/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageText , user: user.uid }),
        });

        if (!response.ok) {
          throw new Error('Error al obtener la respuesta de la API');
        }

        const responseData = await response.json();
        const botResponseText = responseData?.response || 'No se obtuvo una respuesta válida.';

        const botResponse = {
          text: botResponseText,
          sender: receiverUID,
          receiver: user.uid,
          timestamp: new Date(),
        };

        await addDoc(userMessagesRef, botResponse);
        await addDoc(receiverMessagesRef, botResponse);

      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === user?.uid;
    const isBotMessage = item.sender === receiverUID;
    const isBase64Image = /^data:image\/[a-zA-Z]+;base64,/.test(item.text);

    return (
      <View className='flex-row items-start my-1'>
        {isBotMessage && (
          <Image
            source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')}
            className='w-12 h-12 mx-3 rounded-full'
          />
        )}
        <View className={`p-3 rounded-xl max-w-[70%] flex-row items-center ${isBotMessage ? 'bg-[#D1D5DB]' : 'bg-[#B8E6B9] ml-auto'}`}>
          {isBase64Image ? (
            <Image className='w-52 h-52 mx-1 rounded-xl' source={{ uri: item.text }} />
          ) : (
            <Text className={`text-lg text-[#6B7280]`}>
              {item.isSending ? '...' : item.text}
            </Text>
          )}
        </View>
        {isMyMessage && (
          <MaterialIcons
            name="account-circle" // Ícono predeterminado de usuario
            size={48} // Dimensiones del ícono
            color="#B8E6B9" // Color del ícono del usuario
            className='w-16 h-16 mx-1 rounded-full'
          />
        )}
      </View>
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <View className='flex-1 bg-white'>
      <View className='flex-col items-center bg-white p-4 pt-5'>
        <Image className='w-28 h-28 mb-2 rounded-full' source={require('@/assets/images/Captura_de_pantalla_2025-01-26_094519-removebg-preview.png')} />
        <Text className='text-3xl font-bold text-center'>
          <Text className='text-[#9095A1]'>DAL</Text>
          <Text className='text-[#B8E6B9]'>IA</Text>
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={scrollToBottom}
      />

      {error ? <Text className='text-red-500 mt-3 text-center'>{error}</Text> : null}

      <View className='flex-row items-center p-4 bg-white'>
        <TextInput
          className='flex-1 h-14 border border-[#D1D5DB] rounded-full px-4 mr-2 text-[#9CA3AF]'
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity className={`w-14 h-14 rounded-full justify-center items-center ${loading ? 'bg-[#B8E6B9]' : 'bg-[#5CB868]'}`} onPress={sendMessage} disabled={loading}>
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

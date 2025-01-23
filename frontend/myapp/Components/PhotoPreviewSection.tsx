import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
    setCurrentScreen: (screen: string) => void;
}

const PhotoPreviewSection: React.FC<LoginProps> = ({
    photo,
    handleRetakePhoto,
    setCurrentScreen,
}) => {
    const [errorMessage, setErrorMessage] = useState("");
    const auth = getAuth();
    const db = getFirestore();

    const sendImageToAPI = async (imageUri: string) => {
        try {
            setErrorMessage(""); // Limpiar mensaje de error
    
            const response = await fetch('https://chat-hfp7.onrender.com/process_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageUri, // Imagen en base64
                }),
            });
    
            const data = await response.json();
            return data.respuesta || 'No response from server';
        } catch (error) {
            console.error('Error sending image:', error);
            setErrorMessage('Error sending image to the server');
            throw error;
        }
    };
    
    // Función para dividir la cadena base64 en fragmentos
    const chunkBase64 = (base64String: string, chunkSize: number = 1000000) => {
        const chunks = [];
        for (let i = 0; i < base64String.length; i += chunkSize) {
            chunks.push(base64String.slice(i, i + chunkSize));
        }
        return chunks;
    };
    
    const handleSendPhoto = async () => {
        const user = auth.currentUser;
    
        if (user) {
            try {
                let base64Image = '';
    
                if (Platform.OS === 'web') {
                    // En web, la URI ya está lista para usar como base64
                    base64Image = photo.uri;
                } else {
                    base64Image = await FileSystem.readAsStringAsync(photo.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      base64Image = `data:image/jpg;base64,${base64Image}`;
                }
    
                // Fragmenta la imagen base64
                const base64Chunks = chunkBase64(base64Image);
    
                // Envía la imagen al servidor
                const botResponseText = await sendImageToAPI(base64Image);
    
                // Guarda los mensajes en Firestore
                const userMessagesRef = collection(db, 'users', user.uid, 'messages');
                const messageDocRef = await addDoc(userMessagesRef, {
                    sender: 'me',
                    timestamp: new Date(),
                });
    
                // Guardar los fragmentos en la subcolección 'text' de Firestore
                const textCollectionRef = collection(messageDocRef, 'imageFragments');
                for (const [index, chunk] of base64Chunks.entries()) {
                    await addDoc(textCollectionRef, {
                        fragmentIndex: index,
                        fragment: chunk,
                        timestamp: new Date(),
                    });
                }
    
                const botMessage = {
                    text: botResponseText,
                    sender: 'other',
                    timestamp: new Date(),
                };
                await addDoc(userMessagesRef, botMessage);
    
                setCurrentScreen('ChatScreen'); // Cambiar a la pantalla de chat
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.box}>
                <NotificationBanner message={errorMessage} type="error" />
                <Image
                    style={styles.previewContainer}
                    source={{ uri: photo.uri }}  // Usa photo.uri para mostrar la imagen
                    resizeMode="contain"  // Ajusta la imagen sin recortarla y mantiene su proporción
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
                    <Fontisto name='trash' size={36} color='black' />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSendPhoto}>
                    <Fontisto name='check' size={36} color='black' />
                </TouchableOpacity>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    box: {
        width: '95%',
        backgroundColor: 'darkgray',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        borderRadius: 15,
    },
    previewContainer: {
        width: '100%',
        height: '100%',
        aspectRatio: 1,
        borderRadius: 15,
    },
    buttonContainer: {
        marginBottom: 20,
        justifyContent: "center",
        alignItems: 'center',
    },
    button: {
        backgroundColor: 'gray',
        borderRadius: 25,
        padding: 10,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default PhotoPreviewSection;

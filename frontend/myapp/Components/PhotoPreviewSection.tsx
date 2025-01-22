import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text } from 'react-native';
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

            const response = await fetch('http://127.0.0.1:5000/process_image', {
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

    const handleSendPhoto = async () => {
        const user = auth.currentUser;

        if (user) {
            const userMessagesRef = collection(db, 'users', user.uid, 'messages');

            const userMessage = {
                text: photo.uri,  // Guardar la imagen en base64
                sender: 'me',
                timestamp: new Date(),
            };

            await addDoc(userMessagesRef, userMessage);

            try {
                const botResponseText = await sendImageToAPI(photo.uri);

                const botMessage = {
                    text: botResponseText,
                    sender: 'other',
                    timestamp: new Date(),
                };

                await addDoc(userMessagesRef, botMessage);
                setCurrentScreen('ChatScreen'); // Cambiar la pantalla a "chat"
            } catch {
                setErrorMessage('Failed to process image');
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

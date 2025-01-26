import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState } from 'react';
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
                body: JSON.stringify({ image: imageUri }), // Imagen en base64
            });

            const data = await response.json();
            return data.respuesta || 'No response from server';
        } catch (error) {
            console.error('Error sending image:', error);
            setErrorMessage('Error sending image to the server');
            throw error;
        }
    };

    const chunkBase64 = (base64String: string, chunkSize: number = 1000000) => {
        const chunks = [];
        for (let i = 0; i < base64String.length; i += chunkSize) {
            chunks.push(base64String.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const saveImageLocally = async (imageUri: string) => {
        try {
            if (Platform.OS !== 'web') {
                const permission = await MediaLibrary.requestPermissionsAsync();
                if (!permission.granted) {
                    setErrorMessage("Permission to access media library is required.");
                    return null;
                }
                const asset = await MediaLibrary.createAssetAsync(imageUri);
                await MediaLibrary.createAlbumAsync("MyApp", asset, false);
                return asset.uri;
            }
            // Web: Retorna el URI como está
            return imageUri;
        } catch (error) {
            console.error("Error saving image locally:", error);
            setErrorMessage("Failed to save the image locally.");
            throw error;
        }
    };

    const handleSendPhoto = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                let base64Image = '';

                if (Platform.OS === 'web') {
                    base64Image = photo.uri; // En web, URI ya está en base64
                } else {
                    const fileContent = await FileSystem.readAsStringAsync(photo.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    base64Image = `data:image/jpg;base64,${fileContent}`;
                }

                // Guardar la imagen en el dispositivo
                await saveImageLocally(photo.uri);

                // Dividir la imagen en fragmentos base64
                const base64Chunks = chunkBase64(base64Image);

                const receiverUID = 'receiverUID'; // UID del receptor, ajusta según tu lógica
                const userMessagesRef = collection(db, 'users', user.uid, 'messages');
                const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

                // Crear mensaje de la imagen con fragmentos
                const messageDocRef = await addDoc(userMessagesRef, {
                    text: '',
                    sender: user.uid,
                    receiver: receiverUID,
                    timestamp: new Date(),
                });

                const fragmentsCollectionRef = collection(messageDocRef, 'imageFragments');
                for (const [index, chunk] of base64Chunks.entries()) {
                    await addDoc(fragmentsCollectionRef, {
                        fragmentIndex: index,
                        fragment: chunk,
                        timestamp: new Date(),
                    });
                }

                // Enviar la imagen al servidor
                const botResponseText = await sendImageToAPI(base64Image);

                // Guardar respuesta del bot
                const botMessage = {
                    text: botResponseText,
                    sender: receiverUID,
                    receiver: user.uid,
                    timestamp: new Date(),
                };
                await addDoc(userMessagesRef, botMessage);
                await addDoc(receiverMessagesRef, botMessage);

                setCurrentScreen('ChatScreen'); // Cambiar a la pantalla de chat
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                setErrorMessage('Failed to send photo.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.box}>
                <NotificationBanner message={errorMessage} type="error" />
                {photo?.uri ? (
                    <Image
                        style={styles.previewContainer}
                        source={{ uri: photo.uri }}
                        resizeMode="contain"
                    />
                ) : (
                    <Text style={styles.errorText}>No image available</Text>
                )}
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
        position: "relative",
        backgroundColor: "#f0f2f5",
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
        flexDirection: 'row',
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

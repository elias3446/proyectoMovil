import { Fontisto } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
    photo: { uri: string; base64?: string }; // Ahora acepta imágenes seleccionadas con base64 opcional
    handleRetakePhoto: () => void;
    setCurrentScreen: (screen: string) => void;
}

const PhotoPreviewSection: React.FC<LoginProps> = ({
    photo,
    handleRetakePhoto,
    setCurrentScreen,
}) => {
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Estado para manejar el círculo de carga
    const auth = getAuth();
    const db = getFirestore();

    const sendImageToAPI = async (imageUri: string) => {
        try {
            setErrorMessage("");  // Reset error message
            const response = await fetch('https://proyectomovil-jz9s.onrender.com/process_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageUri }), // Imagen en base64
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error en la respuesta de la API');
            }

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
            } else {
                const a = document.createElement('a');
                a.href = imageUri;
                a.download = 'photo.jpg'; 
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return imageUri;
            }
        } catch (error) {
            console.error("Error saving image locally:", error);
            setErrorMessage("Failed to save the image locally.");
            throw error;
        }
    };

    const handleSendPhoto = async () => {
        const user = auth.currentUser;
        if (user) {
            setIsLoading(true);
            try {
                let base64Image = photo.base64 || '';

                if (base64Image) {
                    if (!base64Image.startsWith('data:image')) {
                        const imageExtension = photo.uri.split('.').pop()?.toLowerCase();
                        if (imageExtension === 'jpg' || imageExtension === 'jpeg') {
                            base64Image = `data:image/jpeg;base64,${base64Image}`;
                        } else if (imageExtension === 'png') {
                            base64Image = `data:image/png;base64,${base64Image}`;
                        } else {
                            base64Image = `data:image/jpeg;base64,${base64Image}`;
                        }
                    }
                }

                if (!base64Image && Platform.OS !== 'web') {
                    const fileContent = await FileSystem.readAsStringAsync(photo.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const imageExtension = photo.uri.split('.').pop()?.toLowerCase();
                    if (imageExtension === 'jpg' || imageExtension === 'jpeg') {
                        base64Image = `data:image/jpeg;base64,${fileContent}`;
                    } else if (imageExtension === 'png') {
                        base64Image = `data:image/png;base64,${fileContent}`;
                    } else {
                        base64Image = `data:image/jpeg;base64,${fileContent}`;
                    }
                }

                setCurrentScreen('ChatScreen');

                if (!photo.base64) {
                    await saveImageLocally(photo.uri);
                }

                const base64Chunks = chunkBase64(base64Image);

                const receiverUID = 'receiverUID';
                const userMessagesRef = collection(db, 'users', user.uid, 'messages');
                const receiverMessagesRef = collection(db, 'users', receiverUID, 'messages');

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

                const botResponseText = await sendImageToAPI(base64Image);

                const botMessage = {
                    text: botResponseText,
                    sender: receiverUID,
                    receiver: user.uid,
                    timestamp: new Date(),
                };
                await addDoc(userMessagesRef, botMessage);
                await addDoc(receiverMessagesRef, botMessage);

            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                setErrorMessage('Failed to send photo.');
            } finally {
                setIsLoading(false);
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
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={styles.errorText}>No image available</Text>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
                    <Fontisto name='trash' size={36} color='white' />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSendPhoto} disabled={isLoading}>
                    <Fontisto name='check' size={36} color='white' />
                </TouchableOpacity>
            </View>

            {isLoading && (
                <ActivityIndicator size="large" color="#5CB868" style={styles.loadingIndicator} />
            )}

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        backgroundColor: "#FFFFFF",
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    box: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        borderRadius: 16,
        marginBottom: 30,
    },
    previewContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#5CB868',
        borderRadius: 25,
        padding: 12,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
    },
});

export default PhotoPreviewSection;
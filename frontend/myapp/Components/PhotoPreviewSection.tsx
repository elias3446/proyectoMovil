import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View } from 'react-native';

const PhotoPreviewSection = ({
    photo,
    handleRetakePhoto
}: {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
}) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.box}>
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
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'space-between',  // Usa space-between para dejar espacio entre la imagen y el botón
    },
    box: {
        width: '95%',
        backgroundColor: 'darkgray',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,  // Hace que el contenedor de la imagen ocupe el espacio restante
        borderRadius: 15,
    },
    previewContainer: {
        width: '100%',  // Asegura que ocupe todo el ancho disponible
        height: '100%', // La altura se ajusta dinámicamente al contenedor
        aspectRatio: 1, // Mantiene la proporción de la imagen
        borderRadius: 15,
    },
    buttonContainer: {
        marginBottom: 20, // Espacio adicional para el botón
        justifyContent: "center",
        alignItems: 'center',
    },
    button: {
        backgroundColor: 'gray',
        borderRadius: 25,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default PhotoPreviewSection;
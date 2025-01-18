import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface LoginProps {
    setCurrentScreen: (screen: string) => void;
}

const CameraCapture: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Necesitamos tu permiso para mostrar la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function goToChatbot() {
    setCurrentScreen('Chat'); // Supone que 'Chat' es el nombre de la pantalla del chatbot
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.gridOverlay}>
          {/* Cuadrícula de guía */}
        </View>
      </CameraView>
      <TouchableOpacity 
        style={styles.captureButton} 
        onPress={() => console.log('Capturar imagen')}
      >
        <MaterialIcons name="camera-alt" size={48} color="white" />
      </TouchableOpacity>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.controlButton}>
          <MaterialIcons name="photo-library" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <MaterialIcons name="flip-camera-android" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatbotButton} onPress={goToChatbot}>
          <MaterialIcons name="chat" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b9e82',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
  },
  permissionButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'white',
    borderWidth: 1,
    opacity: 0.6,
  },
  captureButton: {
    position: 'absolute',
    top: -35, // Posicionamos el botón fuera del pie de página, hacia arriba
    left: '50%',
    transform: [{ translateX: -35 }], // Centrado horizontalmente
    backgroundColor: '#f57c00',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,  // Asegura que el botón esté encima de la cámara
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007f5f',
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 35, // Curva superior izquierda
    borderTopRightRadius: 35, // Curva superior derecha
    paddingBottom: 50, // Ajustamos el espacio para que no se solapen los botones
  },
  controlButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatbotButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CameraCapture;

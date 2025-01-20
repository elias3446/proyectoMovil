import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const CameraCaptureScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, [permission]);

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

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
        exif: true,
      };
      const takedPhoto = await cameraRef.current.takePictureAsync(options);
      if (takedPhoto) {
        sendImageToAPI(takedPhoto.uri);
        setPhoto(takedPhoto);
        
        // Enviar la URI a la API justo después de tomar la foto
        
      } else {
        setErrorMessage("Error taking photo");
      }
    }
  };

  const sendImageToAPI = async (imageUri: string) => {
    try {
      const response = await fetch('https://chatapi-la39.onrender.com/process_image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUri, // Pasamos la URI de la imagen como parámetro
        }),
      });
  
      const data = await response.json(); // Suponiendo que la API devuelve un objeto
      console.log('Image sent successfully:', data);
  
      // Verifica si la respuesta contiene la propiedad 'respuesta' antes de renderizarla
      if (data.respuesta) {
        setErrorMessage(data.respuesta); // Asumiendo que quieres mostrar la propiedad 'respuesta' de la API
      }
    } catch (error) {
      console.error('Error sending image:', error);
      setErrorMessage('Error sending image to the server');
    }
  };
  

  const handleRetakePhoto = () => setPhoto(null);

  const handleChat = () => {
    setCurrentScreen('ChatScreen');
  };

  if (photo) return <PhotoPreviewSection photo={photo} handleRetakePhoto={handleRetakePhoto} />;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.gridOverlay}></View>
      </CameraView>

      <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
        <AntDesign name='camera' size={44} color='white' />
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.sideButtonContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="photo-library" size={32} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.sideButtonContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-android" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
        <MaterialIcons name="chat" size={32} color="white" />
      </TouchableOpacity>
      <NotificationBanner message={errorMessage} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4E89',
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
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
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
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -35 }],
    backgroundColor: '#F57C00',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007F5F',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sideButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '30%',
  },
  controlButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#007F5F',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default CameraCaptureScreen;

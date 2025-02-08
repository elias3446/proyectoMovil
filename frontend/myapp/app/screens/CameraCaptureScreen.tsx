import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from '@/Components/NotificationBanner';

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const CameraCaptureScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'web') {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          setErrorMessage('No se pudo acceder a la cámara en la web');
        }
      } else {
        if (!permission?.granted) {
          await requestPermission();
        }
      }
    };

    checkPermissions();
  }, [permission]); // Se ejecuta cada vez que el estado de permisos cambia

  const handleTakePhoto = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (cameraRef.current && isCameraReady) {
      const options = {
        quality: 1,
        base64: true,
        exif: true,
        flash,
      };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);
      if (takenPhoto) {
        setPhoto(takenPhoto);
      } else {
        setErrorMessage("Error tomando la foto");
      }
    }
  }, [flash, permission, isCameraReady]);

  const handleRetakePhoto = useCallback(() => setPhoto(null), []);

  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      setErrorMessage('Error abriendo la galería');
    }
  };

  const toggleCameraFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'auto' : 'off'));
  }, []);

  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Solicitando acceso a la cámara...</Text>
      </View>
    );
  }

  if (photo) {
    return (
      <PhotoPreviewSection
        photo={photo}
        handleRetakePhoto={handleRetakePhoto}
        setCurrentScreen={setCurrentScreen}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View style={styles.gridOverlay} />
      </CameraView>

      {Platform.OS !== 'web' && (
        <View style={styles.sliderContainer}>
          <TouchableOpacity onPress={() => setZoom((prev) => Math.max(0, prev - 0.1))} style={styles.iconButton}>
            <MaterialIcons name="remove-circle" size={40} color="white" />
          </TouchableOpacity>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={zoom}
            onValueChange={setZoom}
            thumbTintColor="#FFFFFF"
          />

          <TouchableOpacity onPress={() => setZoom((prev) => Math.min(1, prev + 0.1))} style={styles.iconButton}>
            <MaterialIcons name="add-circle" size={40} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.captureButtonWrapper,
            { opacity: !permission?.granted || !isCameraReady ? 0.5 : 1 },
          ]}
          onPress={handleTakePhoto}
          disabled={!permission?.granted || !isCameraReady}
        >
          <View style={styles.captureButtonRing}>
            <View style={styles.captureButtonCircle} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.galleryButtonContainer} onPress={handleGallery}>
        <MaterialIcons name="photo-library" size={50} color="black" />
      </TouchableOpacity>

      {Platform.OS !== 'web' && (
        <View style={styles.rightButtonsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <MaterialIcons name={flash === 'off' ? 'flash-off' : 'flash-auto'} size={50} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-android" size={50} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <NotificationBanner message={errorMessage} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFFFF",
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
    color: '#000',
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
  sliderContainer: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    paddingHorizontal: 0,
  },
  slider: {
    width: '57%',
    height: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    height: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonWrapper: {
    position: 'absolute',
    bottom: -1,
  },
  captureButtonRing: {
    borderColor: '#A5D6A7',
    borderWidth: 8,
    borderRadius: 55,
    padding: 5,
  },
  captureButtonCircle: {
    backgroundColor: '#5CB868',
    borderRadius: 45,
    width: 65,
    height: 65,
  },
  galleryButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  rightButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  controlButton: {
    padding: 5,
  },
});

export default CameraCaptureScreen;

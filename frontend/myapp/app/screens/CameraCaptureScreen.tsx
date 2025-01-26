import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from "@/Components/NotificationBanner";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const { width, height } = Dimensions.get('window');

const CameraCaptureScreen: React.FC<LoginProps> = ({ setCurrentScreen }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, [permission]);

  const handleTakePhoto = useCallback(async () => {
    if (cameraRef.current) {
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
  }, [flash]);

  const handleRetakePhoto = useCallback(() => setPhoto(null), []);

  const handleGallery = () => {
    console.log("Abriendo galería...");
  };

  const handleChat = () => setCurrentScreen('ChatScreen');

  const toggleCameraFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'auto' : 'off'));
  }, []);

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

  if (photo) return <PhotoPreviewSection photo={photo} handleRetakePhoto={handleRetakePhoto} setCurrentScreen={setCurrentScreen} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={zoom} flash={flash}>
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

          <View style={styles.track}>
            <View style={[styles.activeTrack, { width: `${zoom * 100}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.captureButtonWrapper} onPress={handleTakePhoto}>
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
    </ScrollView>
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
    zIndex: -1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'white',
    borderWidth: 1,
    opacity: 0.6,
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 130,  // Ajuste estático
    left: 0,
    right: 0,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 0,
  },
  slider: {
    width: '57%',
    height: 22,
  },
  track: {
    position: 'absolute',
    top: 15,
    width: '50%',
    height: 10,
    backgroundColor: '#EFF8F0FF',
    overflow: 'hidden',
    zIndex: -1,
    borderRadius: 4,
  },
  activeTrack: {
    position: 'absolute',
    left: 0,
    height: 100,
    backgroundColor: '#A5D6A7FF',
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
    paddingHorizontal: width * 0.05,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 2,
  },
  captureButtonWrapper: {
    position: 'absolute',
    bottom: -1,
    zIndex: 1,
  },
  captureButtonRing: {
    backgroundColor: 'transparent',
    borderColor: '#A5D6A7',
    borderWidth: 8,
    borderRadius: 55,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCircle: {
    backgroundColor: '#5CB868',
    borderRadius: 45,
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,  // Ajuste estático
    zIndex: 3,
  },
  rightButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,  // Ajuste estático
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  controlButton: {
    backgroundColor: 'transparent',
    padding: 5,
    marginRight: 0,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CameraCaptureScreen;

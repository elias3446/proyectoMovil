import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PhotoPreviewSection from '@/Components/PhotoPreviewSection';
import NotificationBanner from '@/Components/NotificationBanner';

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

  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhoto(result.assets[0]); // Almacenar la imagen seleccionada
      }
    } catch (error) {
      setErrorMessage('Error abriendo la galería');
    }
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
      <View className='flex-1 justify-center items-center p-5'>
        <Text className='text-black mb-5 text-lg text-center'>Necesitamos tu permiso para mostrar la cámara</Text>
        <TouchableOpacity className='bg-[#4CAF50] p-3 rounded-lg' onPress={requestPermission}>
          <Text className='text-white text-lg'>Conceder permiso</Text>
        </TouchableOpacity>
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
    <ScrollView contentContainerStyle={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={zoom} flash={flash}>
        <View style={styles.gridOverlay} />
      </CameraView>

      {Platform.OS !== 'web' && (
        <View className='absolute bottom-32 left-0 right-0 flex-row justify-center items-center'>
          <TouchableOpacity className='px-0' onPress={() => setZoom((prev) => Math.max(0, prev - 0.1))}>
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

          <TouchableOpacity className='px-0' onPress={() => setZoom((prev) => Math.min(1, prev + 0.1))}>
            <MaterialIcons name="add-circle" size={40} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <View className="absolute bottom-0 left-0 right-0 bg-white h-[7.5rem] flex-row justify-center items-center z-[2]" style={{ paddingHorizontal: width * 0.05 }}>
        <TouchableOpacity className='-bottom-[1] z-[1]' onPress={handleTakePhoto}>
          <View className='p-2 bg-transparent border-[#A5D6A7] border-8 rounded-full justify-center items-center'>
            <View className='bg-[#5CB868] rounded-full w-16 h-16 justify-center items-center' />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className='absolute bottom-7 right-7 z-[3]' onPress={handleGallery}>
        <MaterialIcons name="photo-library" size={50} color="black" />
      </TouchableOpacity>

      {Platform.OS !== 'web' && (
        <View className='absolute top-3 right-3 flex-row justify-start items-center z-[3]'>
          <TouchableOpacity className='bg-transparent p-1 mr-0 justify-center items-center rounded-xl' onPress={toggleFlash}>
            <MaterialIcons name={flash === 'off' ? 'flash-off' : 'flash-auto'} size={50} color="white" />
          </TouchableOpacity>

          <TouchableOpacity className='bg-transparent p-1 mr-0 justify-center items-center rounded-xl' onPress={toggleCameraFacing}>
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
  slider: {
    width: '57%',
    height: 22,
  },
});

export default CameraCaptureScreen;

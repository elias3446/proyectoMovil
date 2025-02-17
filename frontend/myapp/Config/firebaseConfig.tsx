import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

/**
 * Configuración de Firebase.
 * 
 * Para producción, se recomienda no incluir las credenciales directamente en el código,
 * sino almacenarlas en variables de entorno o en un archivo de configuración seguro.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAnTHAakzA9xX7o10mf6uh6FGx1LaPFSMU",
  authDomain: "proyectomovil-7612c.firebaseapp.com",
  projectId: "proyectomovil-7612c",
  storageBucket: "proyectomovil-7612c.firebasestorage.app",
  messagingSenderId: "757740855440",
  appId: "1:757740855440:web:20a837919bb11adffdf815",
  measurementId: "G-RJY0FS3GPG",
};

/**
 * Inicializa la aplicación de Firebase con la configuración proporcionada.
 */
const app = initializeApp(firebaseConfig);

/**
 * Inicializa Firebase Authentication para React Native, utilizando
 * AsyncStorage para mantener la persistencia de sesión.
 */
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

/**
 * Inicializa Firestore, la base de datos en tiempo real de Firebase.
 */
const firestore = getFirestore(app);

/**
 * Exporta las instancias de autenticación y Firestore para que puedan ser
 * utilizadas en otras partes de la aplicación.
 */
export { auth, firestore };

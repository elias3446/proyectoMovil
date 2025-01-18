import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAnTHAakzA9xX7o10mf6uh6FGx1LaPFSMU",
  authDomain: "proyectomovil-7612c.firebaseapp.com",
  projectId: "proyectomovil-7612c",
  storageBucket: "proyectomovil-7612c.firebasestorage.app",
  messagingSenderId: "757740855440",
  appId: "1:757740855440:web:20a837919bb11adffdf815",
  measurementId: "G-RJY0FS3GPG"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithEmailAndPassword };
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyANsiBePAIN1V5WwbuvjCnK5OOmZmVqMec",
    authDomain: "sample-firebase-ai-app-9db32.firebaseapp.com",
    projectId: "sample-firebase-ai-app-9db32",
    storageBucket: "sample-firebase-ai-app-9db32.firebasestorage.app",
    messagingSenderId: "761221268423",
    appId: "1:761221268423:web:fb037499900557b698cfe2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithEmailAndPassword };

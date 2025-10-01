import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDk72Hxvie6sSTyci7__7NN1aYBbNOEJJo",
  authDomain: "conversor-3b620.firebaseapp.com",
  projectId: "conversor-3b620",
  storageBucket: "conversor-3b620.firebasestorage.app",
  messagingSenderId: "647432779013",
  appId: "1:647432779013:web:a871ceb401ab0f680b336c",
  measurementId: "G-ECXTMXSF2P"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (solo en producción)
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}
export { analytics };

// Configurar proveedores OAuth
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: 'popup',
});

export const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({
  allow_signup: 'true',
});

// Configurar scopes adicionales si es necesario
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Facebook scopes are automatically included in Firebase v12+
// No need to manually add 'email' and 'public_profile' scopes
// facebookProvider.addScope('email');        // DEPRECATED
// facebookProvider.addScope('public_profile'); // DEPRECATED

githubProvider.addScope('user:email');

export default app;
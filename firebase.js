import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            "AIzaSyA1gwmN0FkgybVjhLQD5s-vz7pljdnhFr8",
  authDomain:        "versapro-40950.firebaseapp.com",
  projectId:         "versapro-40950",
  storageBucket:     "versapro-40950.firebasestorage.app",
  messagingSenderId: "997171595495",
  appId:             "1:997171595495:web:3ef2863b154f0ac50bfa42",
  measurementId:     "G-V8QCJ03G6X",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

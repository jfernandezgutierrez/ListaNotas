// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyAdV9h7xRnQVxL_XRdkOESlYkTTSO_W-gA",
    authDomain: "lista-4803b.firebaseapp.com",
    projectId: "lista-4803b",
    storageBucket: "lista-4803b.appspot.com",
    messagingSenderId: "1067505713707",
    appId: "1:1067505713707:web:b05053c6d843f3cc13206e",
    measurementId: "G-HLVJDWJSTB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth/lite";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKq8ziYpU2i3iLtB36tNhE44gmSlYAjeM",
  authDomain: "poli-20-4qy2j.firebaseapp.com",
  projectId: "poli-20-4qy2j",
  storageBucket: "poli-20-4qy2j.appspot.com",
  messagingSenderId: "919453409004",
  appId: "1:919453409004:web:202522ffe7c3e0345b0fc9"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

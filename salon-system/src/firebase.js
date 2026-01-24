import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tady jsou tvoje klíče hezky bokem
const firebaseConfig = {
  apiKey: "AIzaSyBkT5mnInO0VPWGHurdCMkcm5kCPa_L4ss",
  authDomain: "tm-reservations.firebaseapp.com",
  projectId: "tm-reservations",
  storageBucket: "tm-reservations.firebasestorage.app",
  messagingSenderId: "831805384532",
  appId: "1:831805384532:web:db46c66d5866250d458ac1",
  measurementId: "G-PGJV1DWTL6"
};

// Inicializace
const app = initializeApp(firebaseConfig);

// Exportujeme databázi, aby ji mohl používat zbytek aplikace
export const db = getFirestore(app);
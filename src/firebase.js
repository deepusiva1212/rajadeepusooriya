import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGwFIkqRsBC5BfnTy_q7OnRYI_-eM9nrs",
  authDomain: "rajadeepusooriya-1302d.firebaseapp.com",
  projectId: "rajadeepusooriya-1302d",
  storageBucket: "rajadeepusooriya-1302d.firebasestorage.app",
  messagingSenderId: "1008463369368",
  appId: "1:1008463369368:web:0882106589216924abeced",
  measurementId: "G-HTM5NZKF8H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

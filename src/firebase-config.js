// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, ref, onValue } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const isDev = process.env.REACT_APP_ENVIRONMENT === "dev";

let firebaseConfig = {
  apiKey: "AIzaSyCQs24FrZDp6kx6Luf9oq5f5l7Tasw-O-c",
  authDomain: "maidaan-921e1.firebaseapp.com",
  databaseURL:
    "https://maidaan-921e1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maidaan-921e1",
  storageBucket: "maidaan-921e1.appspot.com",
  messagingSenderId: "1012992519476",
  appId: "1:1012992519476:web:b662e0d9bdb3e5f56a0961",
  measurementId: "G-YLDW0TTPQT",
};

const devFirebaseConfig = {
  apiKey: "AIzaSyDEcS9Md1l5Oq52mK4O78HUlR5uYqFNTXM",
  authDomain: "maidaan-dev.firebaseapp.com",
  databaseURL:
    "https://maidaan-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maidaan-dev",
  storageBucket: "maidaan-dev.appspot.com",
  messagingSenderId: "254571280814",
  appId: "1:254571280814:web:8538be545e00489713b03f",
  measurementId: "G-EM4ZWPZCTQ",
};
if (isDev) {
  firebaseConfig = devFirebaseConfig;
}

let app = isDev ? initializeApp(firebaseConfig, 'dev') : initializeApp(firebaseConfig);

// Initialize Firebase
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const database = getDatabase(app);
export const secretKey = "b8900ffee5bbef20507ff617abecab2f074cac839c8bacebe9d44c7f44773d83";
export const initializationVector = "c49d83dd920ad68a2162a5b07673cdba";

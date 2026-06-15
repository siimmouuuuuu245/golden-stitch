// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwL2ufH5d13ZbocAtrnSDfzcx-iO28OJ4",
  authDomain: "graphic-pack-1ddd0.firebaseapp.com",
  projectId: "graphic-pack-1ddd0",
  storageBucket: "graphic-pack-1ddd0.firebasestorage.app",
  messagingSenderId: "416212025080",
  appId: "1:416212025080:web:1e3cca4b0e0056d62d850d",
  measurementId: "G-KN1NHBPYN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
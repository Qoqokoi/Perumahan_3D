// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMROQrqHqGXnfCO0XjrBgy4SVjzWQd24U",
  authDomain: "delon-clusters-3d.firebaseapp.com",
  projectId: "delon-clusters-3d",
  storageBucket: "delon-clusters-3d.firebasestorage.app",
  messagingSenderId: "943080206663",
  appId: "1:943080206663:web:abb4ab879e31251cfd1c62",
  measurementId: "G-6S8YV62DXB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

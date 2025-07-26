// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqvO039a7IEPwlJhPU6kAbmUYo3Pm3QbA",
  authDomain: "mailsweep-qxl2v.firebaseapp.com",
  projectId: "mailsweep-qxl2v",
  storageBucket: "mailsweep-qxl2v.appspot.com",
  messagingSenderId: "1050796170206",
  appId: "1:1050796170206:web:9d42a7ed30b7d519931b4f"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);

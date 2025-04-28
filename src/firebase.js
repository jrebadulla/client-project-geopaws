// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCY_4gJdzTykyHCGjWN6VowOtm4KzXCr2M",
  authDomain: "geopaws-eaf88.firebaseapp.com",
  projectId: "geopaws-eaf88",
  storageBucket: "geopaws-eaf88.appspot.com",
  messagingSenderId: "1006948978372",
  appId: "1:1006948978372:web:567449752fc2520cc8c391"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app); 
export const storage = getStorage(app);

export { db, auth };

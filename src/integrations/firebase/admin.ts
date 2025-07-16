import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAC4QDim1V6-U9iapSL4_ApR8I6p4AL15E",
  authDomain: "admin-3e1ea.firebaseapp.com",
  projectId: "admin-3e1ea",
  storageBucket: "admin-3e1ea.firebasestorage.app",
  messagingSenderId: "726894426510",
  appId: "1:726894426510:web:7ec6d37f247e50c0628cdf"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app); 
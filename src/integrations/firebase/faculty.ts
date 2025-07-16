import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCyZ42WAhbxyLvwQTbbmOigjwc7Ld-6l2Q",
  authDomain: "faculty-login-d1e79.firebaseapp.com",
  projectId: "faculty-login-d1e79",
  storageBucket: "faculty-login-d1e79.firebasestorage.app",
  messagingSenderId: "29248011392",
  appId: "1:29248011392:web:5d8ba2388fea0eabac3a65"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app); 
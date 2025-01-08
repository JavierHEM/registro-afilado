import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOVGFrJPtSH7K8e695Sh3I4KQEjpwcMbY",
  authDomain: "sistema-registro-30c5e.firebaseapp.com",
  projectId: "sistema-registro-30c5e",
  storageBucket: "sistema-registro-30c5e.firebasestorage.app",
  messagingSenderId: "441078544441",
  appId: "1:441078544441:web:3ef426df76f691657535e8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
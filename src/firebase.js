import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Niche wali line dhyaan se dekhna, isme addDoc aur serverTimestamp add kiya hai
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxWHyvFlgXLeEklcBaP6XvqM2CIrH0JD4",
  authDomain: "t9-e-sports.firebaseapp.com",
  projectId: "t9-e-sports",
  storageBucket: "t9-e-sports.firebasestorage.app",
  messagingSenderId: "173291941418",
  appId: "1:173291941418:web:c0c62b49be08f149f89d53",
  measurementId: "G-7SLBXYV433"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export const SUPER_ADMIN_EMAIL = "raushanritik30891@gmail.com";

export const verifyAdmin = async (email) => {
  if (!email) return null;
  if (email === SUPER_ADMIN_EMAIL) {
    return { role: 'super_admin', name: 'Owner', email: email };
  }
  try {
    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  } catch (error) {
    console.error("Error verifying admin:", error);
  }
  return null;
};

// ✅ YE FUNCTION MISSING THA - ISE ADD KIYA HAI
export const logActivity = async (db, email, action) => {
  try {
    await addDoc(collection(db, "admin_logs"), {
      adminEmail: email,
      action: action,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Logging failed:", error);
  }
};

export default app;
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Blog Images ke liye ye zaroori hai
export const provider = new GoogleAuthProvider();

// Super Admin Config
export const SUPER_ADMIN_EMAIL = "raushanritik30891@gmail.com";

// Verify Admin Function
export const verifyAdmin = async (email) => {
  if (!email) return null;
  
  // 1. Check Hardcoded Super Admin
  if (email === SUPER_ADMIN_EMAIL) {
    return { role: 'super_admin', name: 'Owner', email: email };
  }

  // 2. Check Database for Sub-Admins
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

// Log Activity Function (Crash-Proof)
export const logActivity = async (dbInstance, email, action) => {
  // Agar dbInstance pass nahi hua, to default db use karein
  const targetDb = dbInstance || db; 
  
  try {
    await addDoc(collection(targetDb, "admin_logs"), {
      adminEmail: email,
      action: action,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Logging failed (Minor):", error);
    // Logging fail hone se app crash nahi hona chahiye
  }
};

export default app;
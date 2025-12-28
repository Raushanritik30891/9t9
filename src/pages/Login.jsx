import { useState } from 'react';

import { auth, provider, db } from '../firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { 
  Gamepad2, AlertCircle, Phone, ArrowLeft, Mail, Lock, User, Eye, EyeOff 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast'; // ✅ ADD THIS LINE

// ✅ ADMIN EMAIL - Yahan apna email check kar lena
const ADMIN_EMAIL = "raushanritik30891@gmail.com"; // Isko apne email se replace karna hai agar alag hai

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false); // Toggle Login/Signup
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });

  // --- 1. GOOGLE LOGIN (UPDATED WITH ADMIN CHECK) ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 👇 YAHAN LOGIC CHANGE HUA HAI 👇
      if (user.email === ADMIN_EMAIL) {
        // Agar Admin email match hua -> Seedha Admin Panel
        navigate('/admin'); 
      } else {
        // Agar normal user hai -> Database check + Dashboard
        // Save User to DB
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          mobile: "N/A",
          uid: user.uid,
          lastLogin: new Date()
        }, { merge: true });

        navigate('/dashboard'); // Normal User Dashboard jayega
      }
      // 👆 YAHAN TAK CHANGE HAI 👆
      
    } catch (err) {
      setError("Google Login Failed. Try again.");
    }
    setLoading(false);
  };

  // --- 2. EMAIL/PASSWORD LOGIN & SIGNUP (UPDATED WITH ADMIN CHECK) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password, name, mobile } = formData;

    try {
      let user;
      
      if (isSignup) {
        // --- SIGN UP LOGIC ---
        if (!name) throw new Error("Name is required for Signup.");
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;

        // Update Profile Name immediately
        await updateProfile(user, { displayName: name });

        // Save to Database
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          photoURL: "", // Placeholder
          mobile: mobile || "N/A",
          uid: user.uid,
          createdAt: new Date()
        });

      } else {
        // --- LOGIN LOGIC ---
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        // Update Last Login
        await setDoc(doc(db, "users", user.uid), { lastLogin: new Date() }, { merge: true });
      }

      // 👇 YAHAN LOGIC CHANGE HUA HAI 👇
      if (user.email === ADMIN_EMAIL) {
        // Agar Admin login kiya hai -> Seedha Admin Panel
        navigate('/admin');
      } else {
        // Agar normal user hai -> Dashboard
        navigate('/dashboard');
      }
      // 👆 YAHAN TAK CHANGE HAI 👆

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Email already registered. Please Login.");
      else if (err.code === 'auth/wrong-password') setError("Incorrect Password.");
      else if (err.code === 'auth/user-not-found') setError("No account found. Please Sign Up.");
      else if (err.code === 'auth/weak-password') setError("Password should be at least 6 chars.");
      else setError(err.message || "Authentication Failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans relative overflow-hidden p-4">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition z-20">
        <ArrowLeft size={20}/> <span className="text-sm font-bold">HOME</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative z-10"
      >
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-gaming text-white">
            {isSignup ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </h2>
          <p className="text-gray-400 text-xs mt-2">
            {isSignup ? "Join the community & start competing." : "Login to access your dashboard."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={14}/> {error}
          </div>
        )}

        {/* --- FORM --- */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Name Field (Only for Signup) */}
          {isSignup && (
            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 flex items-center focus-within:border-brand-green transition">
              <User size={18} className="text-gray-500 mr-3"/>
              <input 
                type="text" placeholder="Full Name" required
                className="bg-transparent border-none outline-none text-white text-sm w-full"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          {/* Email Field */}
          <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 flex items-center focus-within:border-brand-green transition">
            <Mail size={18} className="text-gray-500 mr-3"/>
            <input 
              type="email" placeholder="Email Address" required
              className="bg-transparent border-none outline-none text-white text-sm w-full"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {/* Password Field */}
          <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 flex items-center focus-within:border-brand-green transition relative">
            <Lock size={18} className="text-gray-500 mr-3"/>
            <input 
              type={showPassword ? "text" : "password"} placeholder="Password" required
              className="bg-transparent border-none outline-none text-white text-sm w-full pr-8"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-gray-500 hover:text-white">
              {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          {/* Mobile (Optional) */}
          <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 flex items-center focus-within:border-brand-green transition">
            <Phone size={18} className="text-gray-500 mr-3"/>
            <input 
              type="number" placeholder="WhatsApp (Optional)"
              className="bg-transparent border-none outline-none text-white text-sm w-full"
              value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
            />
          </div>

          {/* Submit Button */}
          <button disabled={loading} className="w-full bg-brand-green text-black font-bold py-3.5 rounded-xl hover:bg-white transition mt-2">
            {loading ? 'Processing...' : (isSignup ? 'SIGN UP' : 'LOGIN')}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <span className="relative bg-[#0e0e0e] px-2 text-[10px] text-gray-500 uppercase">Or continue with</span>
        </div>

        {/* Google Button */}
        <button onClick={handleGoogleLogin} className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-5 h-5" />
          Google
        </button>

        {/* Toggle Login/Signup */}
        <p className="text-center text-gray-400 text-xs mt-6">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => setIsSignup(!isSignup)} className="text-brand-green font-bold hover:underline">
            {isSignup ? "Login" : "Create Account"}
          </button>
        </p>

      </motion.div>
    </div>
  );
};

export default Login;
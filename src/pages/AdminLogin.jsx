import { useState } from 'react';
import { auth, db, SUPER_ADMIN_EMAIL } from '../firebase'; // 👈 SUPER_ADMIN_EMAIL import zaroor karna
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state add kiya
  const navigate = useNavigate();

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        let isValidUser = false;

        // ---------------------------------------------------------
        // 1️⃣ STEP 1: VERIFICATION (Check Permission)
        // ---------------------------------------------------------

        // CHECK A: Kya ye Super Admin (Owner) hai?
        if (email === SUPER_ADMIN_EMAIL) {
            isValidUser = true;
        } 
        // CHECK B: Agar Super Admin nahi hai, toh Database check karo
        else {
            // Firestore mein 'admins' collection dhoondo
            const adminsRef = collection(db, "admins");
            // Check karo ki Email aur Password match ho raha hai ya nahi
            const q = query(adminsRef, where("email", "==", email), where("password", "==", password));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                isValidUser = true; // Database mein mil gaya!
            }
        }

        // Agar na Super Admin hai, na Database mein hai -> ACCESS DENIED ❌
        if (!isValidUser) {
            throw new Error("Invalid Admin ID or Password. Access Denied.");
        }

        // ---------------------------------------------------------
        // 2️⃣ STEP 2: AUTHENTICATION (Firebase Login)
        // ---------------------------------------------------------
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin'); // Login Success! ✅
        } catch (authErr) {
            // Agar banda Database mein verified hai, lekin Firebase Auth par account nahi bana
            // Toh hum pehli baar uska account auto-create kar denge.
            if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
                 try {
                     await createUserWithEmailAndPassword(auth, email, password);
                     navigate('/admin'); // Account created & Login Success! ✅
                 } catch (createErr) {
                     throw new Error(createErr.message);
                 }
            } else {
                throw new Error("Authentication Error: " + authErr.message);
            }
        }

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center px-4">
      <div className="w-full max-w-sm border border-red-900/40 p-8 rounded-2xl bg-[#111] shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
        
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

        <div className="text-center mb-8">
          <div className="bg-red-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
             <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-gaming text-white tracking-widest">ADMIN PORTAL</h1>
          <p className="text-gray-500 text-[10px] mt-2 font-mono uppercase tracking-widest">
            {loading ? 'VERIFYING CREDENTIALS...' : 'SECURE ACCESS ONLY'}
          </p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-5">
          <div>
            <label className="text-[10px] text-gray-500 font-bold ml-1 mb-1 block tracking-wider">ADMIN ID</label>
            <input 
              type="email" 
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all font-mono text-sm"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@9t9esports.com"
              required
            />
          </div>
          
          <div>
            <label className="text-[10px] text-gray-500 font-bold ml-1 mb-1 block tracking-wider">PASSWORD</label>
            <input 
              type="password" 
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all font-mono text-sm"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded border border-red-500/20 animate-pulse">
              <ShieldAlert size={16}/> {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3.5 rounded-lg transition-all text-sm tracking-widest shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : 'AUTHENTICATE SYSTEM'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-gray-600 text-xs hover:text-white transition underline decoration-gray-800 underline-offset-4">
                Return to Homepage
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
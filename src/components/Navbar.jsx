import { useState, useEffect } from 'react';


import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Auth import
import { signOut } from 'firebase/auth'; // SignOut import
import toast from 'react-hot-toast';
import { Menu, X, Lock, LogIn, LayoutDashboard, LogOut, Shield } from 'lucide-react'; // Added Shield icon
import logoImg from '../pages/logo.png'; 



// ✅ ADMIN EMAIL - Yahan apna email check kar lena
const ADMIN_EMAIL = "raushanritik30891@gmail.com"; // Isko apne email se replace karna hai agar alag hai

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    await signOut(auth); // Firebase se logout
    navigate('/'); // Home pe wapas bhejo
    toast.success("Logged Out Successfully!");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/'); 
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/10 shadow-lg h-20">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoImg} alt="9T9" className="h-10 w-auto object-contain hover:scale-105 transition" />
          <h1 className="font-gaming text-xl tracking-widest leading-none text-white hidden md:block">
            9T9<span className="text-brand-green">ESPORTS</span>
          </h1>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-400 tracking-wider">
          <button onClick={() => navigate('/')} className="hover:text-brand-green transition">HOME</button>
          <button onClick={() => scrollToSection('matches')} className="hover:text-brand-green transition">MATCHES</button>
          <button onClick={() => navigate('/about')} className="hover:text-brand-green transition">ABOUT US</button>
          <button onClick={() => navigate('/contact')} className="hover:text-brand-green transition">CONTACT</button>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          
          {/* 👇 UPDATED ADMIN BUTTON - MAGIC LOGIC: Sirf Admin ko Admin Button dikhega 👇 */}
          {user && user.email === ADMIN_EMAIL && (
            <button 
              onClick={() => navigate('/admin')} 
              className="hidden md:flex items-center gap-2 bg-red-600 text-white border border-red-500 px-3 py-2 rounded font-bold text-xs hover:bg-red-700 transition shadow-[0_0_10px_red]"
              title="Admin Panel"
            >
              <Shield size={14}/> ADMIN PANEL
            </button>
          )}

          {/* 👇 Normal User ko sirf Dashboard dikhega 👇 */}
          {user && user.email !== ADMIN_EMAIL && (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="hidden md:flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded font-bold text-white text-xs hover:border-brand-green transition"
            >
              <LayoutDashboard size={14}/> DASHBOARD
            </button>
          )}

          {/* Mobile Admin Lock (Small Icon) - Sirf Admin ke liye */}
          {user && user.email === ADMIN_EMAIL && (
            <button 
              onClick={() => navigate('/admin')} 
              className="md:hidden text-gray-600 hover:text-red-500 transition p-2" 
              title="Admin"
            >
              <Lock size={18}/>
            </button>
          )}

          {/* MAIN BUTTONS */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Dashboard Button (Sirf normal users ke liye) */}
              {user.email !== ADMIN_EMAIL && (
                <button onClick={() => navigate('/dashboard')} className="bg-[#1a1a1a] hover:bg-brand-green hover:text-black border border-white/10 px-4 py-2 rounded font-bold transition text-[10px] sm:text-xs flex items-center gap-2">
                  <LayoutDashboard size={14} /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
              )}
              
              {/* 🔴 LOGOUT BUTTON (Sabke liye) */}
              <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/20 px-3 py-2 rounded font-bold transition">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="bg-brand-green text-black px-4 py-2 rounded font-bold hover:bg-white transition skew-x-[-10deg] text-[10px] sm:text-xs flex items-center gap-2">
              <LogIn size={14} /> <span className="skew-x-[10deg]">LOGIN</span>
            </button>
          )}

          {/* MOBILE MENU BTN */}
          <button className="md:hidden text-white ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X/> : <Menu/>}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 absolute top-20 left-0 w-full p-4 flex flex-col gap-4 text-center shadow-2xl">
          <button onClick={() => {navigate('/'); setIsMenuOpen(false)}} className="py-2 font-bold text-gray-300 border-b border-white/5">HOME</button>
          <button onClick={() => {scrollToSection('matches'); setIsMenuOpen(false)}} className="py-2 font-bold text-gray-300 border-b border-white/5">MATCHES</button>
          <button onClick={() => {navigate('/about'); setIsMenuOpen(false)}} className="py-2 font-bold text-gray-300 border-b border-white/5">ABOUT US</button>
          <button onClick={() => {navigate('/contact'); setIsMenuOpen(false)}} className="py-2 font-bold text-gray-300 border-b border-white/5">CONTACT</button>
          
          {/* ADMIN IN MOBILE MENU - Sirf Admin ke liye */}
          {user && user.email === ADMIN_EMAIL && (
            <button 
              onClick={() => {navigate('/admin'); setIsMenuOpen(false)}} 
              className="py-2 font-bold text-red-500 border-b border-white/5 flex items-center justify-center gap-2"
            >
              <Shield size={14}/> ADMIN PANEL
            </button>
          )}
          
          {/* DASHBOARD IN MOBILE MENU - Sirf Normal Users ke liye */}
          {user && user.email !== ADMIN_EMAIL && (
            <button 
              onClick={() => {navigate('/dashboard'); setIsMenuOpen(false)}} 
              className="py-2 font-bold text-brand-green border-b border-white/5 flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={14}/> DASHBOARD
            </button>
          )}
          
          {user && (
             <button onClick={handleLogout} className="py-2 font-bold text-red-500 border-b border-white/5 flex items-center justify-center gap-2"><LogOut size={14}/> LOGOUT</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
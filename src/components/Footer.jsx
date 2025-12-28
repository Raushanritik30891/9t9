import { Mail, Instagram, Youtube, MapPin, Clock, Shield, Globe, Phone, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom'; // ✅ IMPORT REQUIRED FOR FAST NAVIGATION

const Footer = () => {

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success("Subscribed to Newsletter! 🎮");
  };

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-6 w-full relative z-10 overflow-hidden">
        
       {/* BACKGROUND GLOW EFFECT (OPTIONAL DECORATION) */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="max-w-7xl mx-auto px-4 relative">
          
          {/* --- TOP SECTION: NEWSLETTER & BRAND --- */}
          <div className="grid md:grid-cols-12 gap-10 mb-16 border-b border-white/5 pb-12">
             
             {/* BRAND INFO */}
             <div className="md:col-span-5">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 bg-brand-green skew-x-[-10deg] flex items-center justify-center">
                        <Zap size={18} className="text-black fill-black" />
                   </div>
                   <span className="font-gaming text-3xl text-white tracking-wide">9T9<span className="text-brand-green">ESPORTS</span></span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 pr-4">
                   India's premier Esports ecosystem designed for the underdogs. We turn passion into profession with automated tournaments, instant payouts, and a fair-play environment.
                </p>
                <div className="flex gap-3">
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-brand-green hover:text-black transition-all duration-300 border border-white/5 hover:scale-110"><Instagram size={18}/></a>
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 border border-white/5 hover:scale-110"><Youtube size={18}/></a>
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 border border-white/5 hover:scale-110"><Globe size={18}/></a>
                </div>
             </div>

             {/* NEWSLETTER WIDGET */}
             <div className="md:col-span-7 flex flex-col justify-center bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">🚀 Stay Ahead of the Game</h3>
                <p className="text-gray-500 text-xs mb-4">Get tournament alerts, exclusive rewards, and esports news directly to your inbox.</p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input 
                        type="email" 
                        placeholder="Enter your email address..." 
                        className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand-green outline-none transition"
                        required 
                    />
                    <button type="submit" className="bg-brand-green text-black font-bold px-6 py-3 rounded-lg hover:bg-white transition flex items-center gap-2">
                        Subscribe <ArrowRight size={16}/>
                    </button>
                </form>
             </div>
          </div>

          {/* --- MIDDLE SECTION: LINKS --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
             
             {/* COLUMN 1 */}
             <div>
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Shield size={14} className="text-brand-green"/> EXPLORE</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                   <li><Link to="/" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Home</Link></li>
                   <li><Link to="/about" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> About Us</Link></li>
                   <li><Link to="/tournaments" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Tournaments</Link></li>
                   <li><Link to="/leaderboard" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Leaderboards</Link></li>
                </ul>
             </div>

             {/* COLUMN 2 */}
             <div>
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Shield size={14} className="text-brand-green"/> PLATFORM</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                   <li><Link to="/dashboard" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Player Dashboard</Link></li>
                   {/* ✅ FIXED ADMIN LOGIN LINK */}
                   <li><Link to="/admin" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Admin Login</Link></li>
                   <li><Link to="/terms" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Terms of Service</Link></li>
                   <li><Link to="/privacy" className="hover:text-brand-green transition flex items-center gap-1 hover:translate-x-1 duration-200"><ChevronRight size={12}/> Privacy Policy</Link></li>
                </ul>
             </div>

             {/* COLUMN 3 & 4 (MERGED FOR CONTACT) */}
             <div className="col-span-2">
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Phone size={14} className="text-brand-green"/> CONTACT SUPPORT</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 hover:border-brand-green/30 transition group">
                        <Mail size={20} className="text-brand-green mb-2 group-hover:scale-110 transition"/>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Email Us</p>
                        <a href="mailto:help@9t9esports.com" className="text-white text-sm hover:text-brand-green">help@9t9esports.com</a>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 hover:border-brand-green/30 transition group">
                        <Clock size={20} className="text-brand-green mb-2 group-hover:scale-110 transition"/>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Support Hours</p>
                        <p className="text-white text-sm">10:00 AM - 10:00 PM</p>
                    </div>
                </div>
             </div>
          </div>

          {/* --- BOTTOM BAR --- */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
             <p className="text-gray-600 text-xs">
                &copy; 2025 9T9 ESPORTS. All rights reserved. 
             </p>
             <div className="flex items-center gap-6">
                 <p className="text-gray-700 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> SYSTEM ONLINE
                 </p>
                 <p className="text-gray-700 text-[10px] uppercase tracking-widest">
                    DESIGNED FOR GAMERS
                 </p>
             </div>
          </div>
       </div>
    </footer>
  );
};

export default Footer;
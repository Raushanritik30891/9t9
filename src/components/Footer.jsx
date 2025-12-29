import { useState, useEffect } from 'react';
import { Mail, Instagram, Youtube, MapPin, Clock, Shield, Globe, Phone, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; // Database Import

const Footer = () => {
  // ✅ STATE FOR DYNAMIC STATS
  const [stats, setStats] = useState({ 
      users: '10K+', 
      visits: '50K+', 
      prize: '₹1L+' 
  });

  // ✅ FETCH STATS FROM FIREBASE (Jo Admin ne set kiya hai)
  useEffect(() => {
      const fetchStats = async () => {
          try {
              const docRef = doc(db, "settings", "footer_stats");
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  setStats(docSnap.data());
              }
          } catch (err) {
              console.log("Stats fetch error (using defaults)");
          }
      };
      fetchStats();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success("Subscribed to Newsletter! 🎮");
  };

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-6 w-full relative z-10 overflow-hidden">
        
       {/* BACKGROUND GLOW EFFECT */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="max-w-7xl mx-auto px-4 relative">
          
          

          {/* --- ✅ DYNAMIC STATS SECTION (Connects to Admin) --- */}
          <div className="grid grid-cols-3 border-b border-white/5 pb-10 mb-10 text-center">
             <div className="group">
                 <h3 className="text-3xl font-gaming text-white group-hover:text-brand-green transition duration-300">{stats.users}</h3>
                 <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Trusted Users</p>
             </div>
             <div className="group">
                 <h3 className="text-3xl font-gaming text-brand-green group-hover:text-white transition duration-300">{stats.visits}</h3>
                 <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Total Visits</p>
             </div>
             <div className="group">
                 <h3 className="text-3xl font-gaming text-white group-hover:text-yellow-500 transition duration-300">{stats.prize}</h3>
                 <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Prize Distributed</p>
             </div>
          </div>
          {/* --- TOP SECTION: NEWSLETTER & BRAND --- */}
          <div className="grid md:grid-cols-12 gap-10 mb-10 border-b border-white/5 pb-12">
             <div className="md:col-span-5">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 bg-brand-green skew-x-[-10deg] flex items-center justify-center">
                        <Zap size={18} className="text-black fill-black" />
                   </div>
                   <span className="font-gaming text-3xl text-white tracking-wide">9T9<span className="text-brand-green">ESPORTS</span></span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 pr-4">
                   India's premier Esports ecosystem. We provide automated tournaments, instant payouts, and a fair-play environment for underdogs.
                </p>
                <div className="flex gap-3">
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-brand-green hover:text-black transition-all border border-white/5"><Instagram size={18}/></a>
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-red-600 hover:text-white transition-all border border-white/5"><Youtube size={18}/></a>
                   <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#151515] rounded-full hover:bg-blue-500 hover:text-white transition-all border border-white/5"><Globe size={18}/></a>
                </div>
             </div>

             <div className="md:col-span-7 flex flex-col justify-center bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">🚀 Stay Updated</h3>
                <p className="text-gray-500 text-xs mb-4">Get tournament alerts and news directly to your inbox.</p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input type="email" placeholder="Enter your email..." className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand-green outline-none transition" required />
                    <button type="submit" className="bg-brand-green text-black font-bold px-6 py-3 rounded-lg hover:bg-white transition flex items-center gap-2">Subscribe <ArrowRight size={16}/></button>
                </form>
             </div>
          </div>

          {/* --- LINKS SECTION --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
             <div>
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Shield size={14} className="text-brand-green"/> EXPLORE</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                   <li><Link to="/" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Home</Link></li>
                   <li><Link to="/about" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> About Us</Link></li>
                   {/* ✅ FIXED LINK: Ab Black Screen nahi aayegi */}
                   <li><a href="/#matches" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Tournaments</a></li>
                   <li><Link to="/leaderboard" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Leaderboards</Link></li>
                   <li><Link to="/blog" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Blog & News</Link></li>
                </ul>
             </div>

             <div>
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Shield size={14} className="text-brand-green"/> LEGAL</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                   <li><Link to="/privacy" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Privacy Policy</Link></li>
                   <li><Link to="/terms" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Terms of Service</Link></li>
                   <li><Link to="/contact" className="hover:text-brand-green transition flex items-center gap-1"><ChevronRight size={12}/> Help Center</Link></li>
                </ul>
             </div>

             <div className="col-span-2">
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Phone size={14} className="text-brand-green"/> CONTACT</h4>
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

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
             <p className="text-gray-600 text-xs">&copy; 2025 9T9 ESPORTS. All rights reserved.</p>
             <div className="flex items-center gap-6">
                 <p className="text-gray-700 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> SYSTEM ONLINE
                 </p>
             </div>
          </div>
       </div>
    </footer>
  );
};

export default Footer;
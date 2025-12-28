import { Mail, Instagram, Youtube, MapPin, Clock, Shield, Globe, Phone } from 'lucide-react';
import toast from 'react-hot-toast'; // ✅ ADD THIS LINE

const Footer = () => {
  return (
    <footer className="bg-[#080808] border-t border-white/5 pt-16 pb-8 w-full relative z-10">
       <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
             
             {/* 1. BRAND & ABOUT */}
             <div className="col-span-1 md:col-span-2 pr-4">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 bg-brand-green skew-x-[-10deg]"></div>
                   <span className="font-gaming text-2xl text-white">9T9<span className="text-brand-green">ESPORTS</span></span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                   India's fastest-growing Esports platform dedicated to underdog gamers. 
                   We provide a fair, competitive environment with automated slot booking, 
                   instant payments, and 24/7 support. Join the revolution today!
                </p>
                <div className="flex gap-3">
                   <a href="#" className="p-2 bg-[#222] rounded hover:bg-brand-green hover:text-black transition"><Instagram size={18}/></a>
                   <a href="#" className="p-2 bg-[#222] rounded hover:bg-red-600 hover:text-white transition"><Youtube size={18}/></a>
                   <a href="#" className="p-2 bg-[#222] rounded hover:bg-blue-500 hover:text-white transition"><Globe size={18}/></a>
                </div>
             </div>

             {/* 2. QUICK LINKS */}
             <div>
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Shield size={14} className="text-brand-green"/> PLATFORM</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                   <li><a href="/" className="hover:text-brand-green transition block">Home</a></li>
                   <li><a href="/#matches" className="hover:text-brand-green transition block">Live Tournaments</a></li>
                   <li><a href="/dashboard" className="hover:text-brand-green transition block">Player Dashboard</a></li>
                   <li><a href="/admin" className="hover:text-brand-green transition block">Admin Login</a></li>
                   <li><a href="#" className="hover:text-brand-green transition block">Terms & Conditions</a></li>
                </ul>
             </div>

             {/* 3. CONTACT INFO */}
             <div id="contact-footer">
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Phone size={14} className="text-brand-green"/> CONTACT US</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                   <li className="flex items-start gap-3">
                      <Mail size={16} className="text-brand-green mt-0.5"/> 
                      <span>
                        <span className="block text-xs text-gray-600 uppercase">Email Support</span>
                        help@9t9esports.com
                      </span>
                   </li>
                   <li className="flex items-start gap-3">
                      <Clock size={16} className="text-brand-green mt-0.5"/> 
                      <span>
                        <span className="block text-xs text-gray-600 uppercase">Working Hours</span>
                        10:00 AM - 10:00 PM (Daily)
                      </span>
                   </li>
                   <li className="flex items-start gap-3">
                      <MapPin size={16} className="text-brand-green mt-0.5"/> 
                      <span>
                        <span className="block text-xs text-gray-600 uppercase">Location</span>
                        India
                      </span>
                   </li>
                </ul>
             </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
             <p className="text-gray-600 text-xs">
                &copy; 2025 9T9 ESPORTS. All rights reserved. 
             </p>
             <p className="text-gray-700 text-[10px] uppercase tracking-widest">
                DESIGNED FOR GAMERS
             </p>
          </div>
       </div>
    </footer>
  );
};

export default Footer;
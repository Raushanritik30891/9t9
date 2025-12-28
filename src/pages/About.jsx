import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast'; // ✅ ADD THIS LINE
import { Shield, Target, Users, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <Navbar />
      
      {/* Header */}
      <div className="pt-40 pb-20 text-center px-4 bg-gradient-to-b from-brand-green/10 to-[#050505]">
        <h1 className="text-5xl md:text-7xl font-gaming text-white mb-4">WHO WE <span className="text-brand-green">ARE</span></h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">9T9 Esports is India's leading platform dedicated to promoting competitive mobile gaming at the grassroots level.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-12 items-center">
         <div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
                We started 9T9 Esports with a simple goal: To provide a **fair, secure, and professional** environment for underdog players.
            </p>
            <p className="text-gray-400 leading-relaxed">
                Unlike local WhatsApp groups where payments are insecure and slots are manual, we bring **Automation**. Our system ensures you get your Slot instantly, ID/Pass on time, and Winnings directly to your bank.
            </p>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                <Shield className="text-brand-green mx-auto mb-2" size={32}/>
                <h4 className="font-bold">100% Secure</h4>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                <Target className="text-red-500 mx-auto mb-2" size={32}/>
                <h4 className="font-bold">Fair Play</h4>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                <Users className="text-blue-500 mx-auto mb-2" size={32}/>
                <h4 className="font-bold">Community</h4>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                <Award className="text-yellow-500 mx-auto mb-2" size={32}/>
                <h4 className="font-bold">Big Prizes</h4>
            </div>
         </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
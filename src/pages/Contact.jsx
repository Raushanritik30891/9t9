import { useState } from 'react';
import { db } from '../firebase';
import toast from 'react-hot-toast'; // ✅ ADD THIS LINE
import { collection, addDoc } from 'firebase/firestore';
import { Mail, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.name || !formData.message) return alert("Please fill details");
    
    setLoading(true);
    try {
      // Messages collection mein save karega (Admin baad mein padh sakta hai)
      await addDoc(collection(db, "contact_messages"), {
        ...formData,
        timestamp: new Date(),
        status: 'unread'
      });
      toast.success("Message Sent! We will contact you shortly. ✅");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error("Error sending message.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-gaming text-white mb-4">GET IN <span className="text-brand-green">TOUCH</span></h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Have a query regarding tournaments, payments, or just want to say hi? Fill the form below or reach us directly.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-brand-green/30 transition">
                <h3 className="text-2xl font-bold text-white mb-6">Contact Info</h3>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-green/10 p-3 rounded-lg text-brand-green"><Mail size={24}/></div>
                        <div><p className="text-xs text-gray-500 uppercase font-bold">Email Us</p><p className="text-lg">help@9t9esports.com</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500"><MessageCircle size={24}/></div>
                        <div><p className="text-xs text-gray-500 uppercase font-bold">WhatsApp Support</p><p className="text-lg">+91 98765 43210</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg text-purple-500"><MapPin size={24}/></div>
                        <div><p className="text-xs text-gray-500 uppercase font-bold">Location</p><p className="text-lg">India (Online)</p></div>
                    </div>
                </div>
            </div>

            {/* Direct WhatsApp Button */}
            <button onClick={() => window.open('https://wa.me/919876543210', '_blank')} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white hover:text-[#25D366] transition text-lg">
                <MessageCircle size={24}/> CHAT ON WHATSAPP
            </button>
          </div>

          {/* Contact Form */}
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h3 className="text-2xl font-bold text-white mb-6">Send Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold ml-1">Your Name</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none mt-1" placeholder="Enter name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold ml-1">Email Address</label>
                    <input type="email" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none mt-1" placeholder="Enter email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold ml-1">Message / Complaint</label>
                    <textarea className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none mt-1" placeholder="Type your message here..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>
                <button disabled={loading} className="w-full bg-brand-green text-black font-bold py-4 rounded-xl hover:bg-white transition flex items-center justify-center gap-2">
                    {loading ? 'SENDING...' : <><Send size={18}/> SUBMIT MESSAGE</>}
                </button>
            </form>
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
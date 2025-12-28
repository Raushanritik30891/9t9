import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebase';
import { Megaphone, Zap } from 'lucide-react';

const Ticker = () => {
  const [messages, setMessages] = useState([
    "WELCOME TO 9T9 ESPORTS", 
    "REGISTER NOW FOR DAILY SCRIMS"
  ]);

  useEffect(() => {
    // Database ke 'settings/ticker' document ko suno
    const unsub = onSnapshot(doc(db, "settings", "ticker"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Check karo ki naya 'messages' array hai ya purana 'message' string
        if (data.messages && Array.isArray(data.messages)) {
           setMessages(data.messages); // Naya Multi-Ticker logic
        } else if (data.message) {
           setMessages([data.message]); // Purana fallback
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="fixed top-20 left-0 w-full bg-brand-green text-black py-2 overflow-hidden z-40 border-y-2 border-black shadow-[0_0_20px_rgba(0,255,65,0.4)]">
      <div className="animate-marquee whitespace-nowrap flex gap-10 font-bold font-gaming text-sm tracking-wider items-center">
        {/* Messages Loop */}
        {messages.map((msg, index) => (
          <span key={index} className="flex items-center gap-2 uppercase">
             <Megaphone size={16}/> {msg}
          </span>
        ))}
        
        {/* Spacer for loop smoothness */}
        <span className="text-transparent">___</span>

        {/* Duplicate for Infinite Loop Effect */}
        {messages.map((msg, index) => (
          <span key={`dup-${index}`} className="flex items-center gap-2 uppercase">
             <Zap size={16}/> {msg}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
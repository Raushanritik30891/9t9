import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Users, Trophy, ChevronRight, X, MessageCircle, 
  LogIn, Gamepad2, Upload, Copy, Check, ArrowRight, Calendar, History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTS ---
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Ticker from '../components/Ticker'; 
import toast from 'react-hot-toast';

// YAHAN APNA UPI ID DAALO
const ADMIN_UPI_ID = "9t9esports@upi"; 
const SITE_DATA = { whatsappChannel: "https://whatsapp.com/channel/0029VbBphx8EquiQa4UI2e3Y" };

// CLOUDINARY CONFIG
const CLOUDINARY_CLOUD_NAME = "dvmla7g1o"; 
const CLOUDINARY_UPLOAD_PRESET = "oso1twpu"; 

const Home = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [blogs, setBlogs] = useState([]); 
  const [user, setUser] = useState(null);
  
  // ✅ NEW: MATCH FILTER TAB STATE
  const [matchTab, setMatchTab] = useState('live'); // 'live' or 'results'

  // Modals & Forms
  const [bookingMatch, setBookingMatch] = useState(null);
  const [teamListMatch, setTeamListMatch] = useState(null);
  const [resultMatch, setResultMatch] = useState(null);
  const [bookingForm, setBookingForm] = useState({ playerName: '', whatsapp: '' });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. FETCH DATA (Tournaments & Blogs)
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
    
    // Fetch Tournaments
    const qTourney = query(collection(db, "tournaments"), orderBy("createdAt", "desc"));
    const unsubTourney = onSnapshot(qTourney, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Latest Blogs for Moving Cards
    const fetchBlogs = async () => {
        try {
            const qBlog = query(collection(db, "blogs"), orderBy("timestamp", "desc"), limit(6));
            const snap = await getDocs(qBlog);
            setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(err) { console.log(err); }
    };
    fetchBlogs();

    return () => { unsubAuth(); unsubTourney(); };
  }, []);

  // ✅ 2. FILTER LOGIC (Time Based)
  const now = new Date();
  
  const liveMatches = tournaments.filter(m => {
      const matchTime = new Date(m.time);
      // Logic: Status NOT Completed AND (Time is future OR Time is less than 3 hours ago - buffer for ongoing)
      return m.status !== 'Completed' && (matchTime > now || (now - matchTime) < 3 * 60 * 60 * 1000);
  });

  const pastMatches = tournaments.filter(m => {
      const matchTime = new Date(m.time);
      // Logic: Status IS Completed OR Time is way past (older than 3 hours)
      return m.status === 'Completed' || (now - matchTime) >= 3 * 60 * 60 * 1000;
  });

  const displayMatches = matchTab === 'live' ? liveMatches : pastMatches;

  const handleCopy = () => {
      navigator.clipboard.writeText(ADMIN_UPI_ID);
      toast.success("UPI ID Copied! 📋");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    
    if (!bookingForm.playerName || !bookingForm.whatsapp) {
        return toast.error("Please fill Name & WhatsApp! ❌");
    }

    // ✅ 3. DUPLICATE TEAM NAME CHECK
    // Slot List format: ["TeamName (UID: 123)", ...]
    // Hum check karenge ki kya enter kiya hua naam pehle se slot list mein exist karta hai?
    if (bookingMatch.slotList && bookingMatch.slotList.length > 0) {
        const isDuplicate = bookingMatch.slotList.some(entry => 
            entry.toLowerCase().includes(bookingForm.playerName.toLowerCase())
        );

        if (isDuplicate) {
            setIsSubmitting(false);
            return toast.error("⚠️ This Team Name is already registered! Please use a different name.");
        }
    }

    if (bookingMatch.fee > 0 && !screenshotFile) {
        return toast.error("Please upload payment screenshot! ⚠️");
    }
    
    setIsSubmitting(true);

    try {
      let url = "";
      if (bookingMatch.fee > 0 && screenshotFile) {
          const formData = new FormData();
          formData.append("file", screenshotFile);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 
          formData.append("cloud_name", CLOUDINARY_CLOUD_NAME); 

          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (!data.secure_url) throw new Error("Upload Failed");
          url = data.secure_url;
      }

      await addDoc(collection(db, "bookings"), {
        playerName: bookingForm.playerName,
        whatsapp: bookingForm.whatsapp,
        screenshotUrl: url,
        userId: user.uid,
        tournamentId: bookingMatch.id,
        status: 'pending',
        createdAt: new Date()
      });

      setBookingMatch(null);
      setBookingForm({ playerName: '', whatsapp: '' });
      setScreenshotFile(null);
      toast.success("Booking Request Sent! Wait for Approval. ✅");

    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative flex flex-col">
      <Navbar />
      
      {/* ✅ OLD TICKER RESTORED */}
      <div className="fixed top-20 left-0 w-full z-40 bg-black border-b border-brand-green/30 shadow-lg">
        <Ticker />
      </div>

      {/* HERO SECTION */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-40 pb-20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/90 to-[#050505]"></div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/30 bg-brand-green/5 text-brand-green text-[10px] font-bold tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span> LIVE TOURNAMENTS
            </div>
            <h1 className="text-5xl md:text-8xl font-gaming leading-none mb-6 text-white drop-shadow-2xl">
                PLAY. COMPETE.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">EARN.</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-10 text-sm md:text-lg leading-relaxed font-medium">
                India's premium Esports platform. Automated Slots, Instant ID/Pass, and Daily Cash Prizes.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              {!user ? (
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-brand-green text-black px-10 py-4 rounded font-bold font-gaming text-lg hover:scale-105 transition skew-x-[-10deg] flex items-center justify-center gap-2"><LogIn size={20}/> LOGIN / JOIN</button>
              ) : (
                <button onClick={() => document.getElementById('matches')?.scrollIntoView({behavior:'smooth'})} className="w-full sm:w-auto bg-brand-green text-black px-10 py-4 rounded font-bold font-gaming text-lg hover:scale-105 transition skew-x-[-10deg] flex items-center justify-center gap-2"><Gamepad2 size={20}/> PLAY MATCH</button>
              )}
              <button onClick={() => window.open(SITE_DATA.whatsappChannel, '_blank')} className="w-full sm:w-auto border border-white/20 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] text-white px-10 py-4 rounded font-bold font-gaming text-lg transition skew-x-[-10deg] flex items-center justify-center gap-2"><MessageCircle size={20}/> JOIN WHATSAPP</button>
            </div>
          </motion.div>
        </div>
      </div>

      
      {/* MATCHES LIST SECTION */}
      <div id="matches" className="max-w-7xl mx-auto px-4 py-24 w-full">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 bg-brand-green shadow-[0_0_15px_#00ff41]"></div>
                <div>
                    <h2 className="text-4xl md:text-5xl font-gaming text-white">GAME <span className="text-brand-green">ZONE</span></h2>
                    <p className="text-gray-500 text-sm uppercase tracking-widest mt-1">Select a match & book your slot</p>
                </div>
            </div>

            {/* ✅ FILTER TABS */}
            <div className="flex bg-[#111] p-1 rounded-lg border border-white/10">
                <button 
                    onClick={() => setMatchTab('live')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${matchTab === 'live' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <Gamepad2 size={16}/> LIVE LOBBIES
                </button>
                <button 
                    onClick={() => setMatchTab('results')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${matchTab === 'results' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <History size={16}/> PAST RESULTS
                </button>
            </div>
        </div>
        
        {/* MATCH GRID */}
        {displayMatches.length === 0 ? (
            <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-white/10">
                <Trophy size={48} className="mx-auto text-gray-600 mb-4"/>
                <p className="text-gray-500">No {matchTab === 'live' ? 'live matches' : 'past results'} found.</p>
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayMatches.map((match) => {
                const isFull = match.filledSlots >= match.totalSlots;
                // Determine Live Status based on time
                const matchDate = new Date(match.time);
                const isEnded = match.status === 'Completed';
                const isLiveNow = !isEnded && (now >= matchDate); 

                return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-[#0a0a0a] border rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isEnded ? 'border-white/5 opacity-80 hover:opacity-100' : 'border-white/10 hover:border-brand-green/50'}`}>
                
                <div className="bg-[#111] p-4 flex justify-between items-center border-b border-white/5 relative">
                    <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${match.category === 'CS' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {match.category} • {match.map}
                        </span>
                        {isEnded ? (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold">ENDED</span>
                        ) : isLiveNow ? (
                            <span className="text-[10px] bg-green-500 text-black px-2 py-1 rounded font-bold animate-pulse">LIVE NOW</span>
                        ) : (
                            <span className="text-[10px] bg-white/10 text-white px-2 py-1 rounded font-bold">UPCOMING</span>
                        )}
                    </div>
                    <div className="text-right"><span className="text-brand-green font-bold text-lg leading-none block">₹{match.prizePool}</span><span className="text-[9px] text-gray-500 uppercase font-bold">PRIZE</span></div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4 truncate font-gaming tracking-wide">{match.title}</h3>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2"><span className="flex items-center gap-2"><Calendar size={14}/> Date</span><span className="text-white font-mono">{new Date(match.time).toLocaleDateString()}</span></div>
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2"><span className="flex items-center gap-2"><Clock size={14}/> Time</span><span className="text-white font-mono">{new Date(match.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2"><span className="flex items-center gap-2"><Trophy size={14}/> Entry Fee</span><span className="text-white font-mono">{match.fee > 0 ? `₹${match.fee}` : <span className="text-green-500 font-bold">FREE</span>}</span></div>
                        <div className="flex justify-between text-sm text-gray-400"><span className="flex items-center gap-2"><Users size={14}/> Slots</span><span className={`${isFull ? 'text-red-500' : 'text-brand-green'} font-mono`}>{match.filledSlots}/{match.totalSlots}</span></div>
                    </div>
                    
                    {!isEnded && (
                        <div className="w-full bg-gray-800 h-1.5 rounded-full mb-6 overflow-hidden"><div className={`h-full ${isFull ? 'bg-red-500' : 'bg-brand-green'}`} style={{ width: `${(match.filledSlots / match.totalSlots) * 100}%` }}></div></div>
                    )}

                    <div className="mt-auto space-y-2">
                        {isEnded ? (
                            <button onClick={() => setResultMatch(match)} className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2">
                                <Trophy size={16}/> VIEW WINNERS
                            </button>
                        ) : (
                            <button onClick={() => setBookingMatch(match)} disabled={isFull} className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${isFull ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-brand-green text-black hover:bg-white transition'}`}>
                                {isFull ? 'SLOTS FULL' : 'BOOK SLOT NOW'}
                            </button>
                        )}
                        <button onClick={() => setTeamListMatch(match)} className="w-full bg-black border border-white/10 text-gray-400 hover:text-white py-2 rounded-lg text-xs font-bold transition">
                            VIEW TEAM LIST
                        </button>
                    </div>
                </div>
                </motion.div>
            )})}
            </div>
        )}
      </div>

      {/* ✅ MOVING BLOG CARDS (Existing) */}
      {blogs.length > 0 && (
        <div className="py-12 bg-black border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-gaming text-white">LATEST <span className="text-brand-green">NEWS</span></h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Updates from the Arena</p>
                </div>
                <button onClick={() => navigate('/blog')} className="text-xs font-bold text-brand-green hover:text-white transition flex items-center gap-1">VIEW ALL <ChevronRight size={14}/></button>
            </div>
            
            <div className="relative w-full overflow-hidden group">
                <div className="flex gap-6 animate-marquee w-max hover:[animation-play-state:paused]">
                    {[...blogs, ...blogs].map((blog, idx) => (
                        <div 
                            key={`${blog.id}-${idx}`} 
                            onClick={() => navigate('/blog')} 
                            className="w-[300px] h-[350px] bg-[#111] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-green/50 transition-all hover:-translate-y-2 shrink-0 flex flex-col"
                        >
                            <div className="h-48 bg-gray-900 overflow-hidden relative">
                                {blog.image ? (
                                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 font-gaming text-4xl">9T9</div>
                                )}
                                <div className="absolute top-3 left-3 bg-brand-green text-black text-[10px] font-bold px-2 py-1 rounded uppercase">
                                    {blog.category || 'News'}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2">{blog.title}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">{blog.content}</p>
                                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className="text-[10px] text-gray-600">{new Date(blog.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                                    <span className="text-brand-green text-xs font-bold flex items-center gap-1">READ <ArrowRight size={12}/></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      <Footer /> 
      <div className="fixed bottom-6 right-6 z-50"><button onClick={() => window.open(SITE_DATA.whatsappChannel, '_blank')} className="bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition flex items-center justify-center"><MessageCircle size={28} fill="white" /></button></div>

      {/* MODALS SECTION */}
      <AnimatePresence>
        {bookingMatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/20 w-full max-w-md p-6 rounded-2xl relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setBookingMatch(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X/></button>
              <div className="text-center mb-6"><h3 className="text-xl font-bold text-white font-gaming">CONFIRM SLOT</h3><p className="text-xs text-gray-400">{bookingMatch.title} • Fee: <span className="text-brand-green font-bold">{bookingMatch.fee > 0 ? `₹${bookingMatch.fee}` : "FREE"}</span></p></div>

              {bookingMatch.fee > 0 && (
                  <>
                    <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center relative group">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${ADMIN_UPI_ID}&pn=9T9Esports&am=${bookingMatch.fee}`} alt="Payment QR" className="w-full h-full object-contain"/>
                    </div>
                    <div className="bg-[#050505] border border-white/10 rounded-lg p-3 flex justify-between items-center mb-6">
                        <div><p className="text-[10px] text-gray-500 uppercase font-bold">UPI ID</p><p className="text-sm font-mono text-white select-all">{ADMIN_UPI_ID}</p></div>
                        <button onClick={handleCopy} className="text-brand-green hover:text-white transition">{copied ? <Check size={18}/> : <Copy size={18}/>}</button>
                    </div>
                  </>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">In-Game Name / Team Name</label><input type="text" placeholder="Ex: Soul Mortal" required className="w-full bg-black border border-white/20 rounded p-3 text-white text-sm outline-none focus:border-brand-green mt-1" value={bookingForm.playerName} onChange={e => setBookingForm({...bookingForm, playerName: e.target.value})}/></div>
                <div><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">WhatsApp Number</label><input type="number" placeholder="Ex: 9876543210" required className="w-full bg-black border border-white/20 rounded p-3 text-white text-sm outline-none focus:border-brand-green mt-1" value={bookingForm.whatsapp} onChange={e => setBookingForm({...bookingForm, whatsapp: e.target.value})}/></div>
                
                {bookingMatch.fee > 0 ? (
                    <div className="bg-black border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-brand-green/50 transition cursor-pointer relative mb-4">
                        <input type="file" accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setScreenshotFile(e.target.files[0])}/>
                        <div className="flex flex-col items-center gap-2">
                            {screenshotFile ? (
                                <><Check size={24} className="text-brand-green"/><span className="text-sm text-brand-green font-bold truncate max-w-[200px]">{screenshotFile.name}</span><span className="text-[10px] text-gray-500">Click to change</span></>
                            ) : (
                                <><Upload size={24} className="text-gray-400"/><span className="text-sm text-gray-300 font-bold">Upload Payment Screenshot</span><span className="text-[10px] text-gray-500">Max 2MB (JPG/PNG)</span></>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center mb-4">
                        <p className="text-green-500 font-bold text-lg flex items-center justify-center gap-2">🎉 FREE ENTRY MATCH</p>
                        <p className="text-gray-400 text-xs mt-1">No payment screenshot required.</p>
                    </div>
                )}
                <button disabled={isSubmitting} className="w-full bg-brand-green text-black font-bold py-4 rounded-xl hover:bg-white transition flex items-center justify-center gap-2">{isSubmitting ? 'Processing...' : <>CONFIRM BOOKING <ChevronRight size={18}/></>}</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{teamListMatch && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white"><div className="bg-[#111] p-6 rounded-2xl w-full max-w-md"><h3 className="mb-4 font-bold border-b border-white/10 pb-2 flex justify-between">Registered Teams <button onClick={() => setTeamListMatch(null)}><X/></button></h3><div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">{teamListMatch.slotList?.map((t,i)=><div key={i} className="bg-white/5 p-2 rounded flex gap-2"><span className="text-brand-green">#{i+1}</span>{t}</div>) || <p className="text-gray-500">No teams yet.</p>}</div></div></div>}</AnimatePresence>
      <AnimatePresence>{resultMatch && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white"><div className="bg-[#111] p-6 rounded-2xl w-full max-w-md"><h3 className="mb-4 font-bold border-b border-white/10 pb-2 flex justify-between">Match Results <button onClick={() => setResultMatch(null)}><X/></button></h3>{resultMatch.results?.gfx && <img src={resultMatch.results.gfx} className="w-full mb-4 rounded"/>}{resultMatch.results?.pt && <img src={resultMatch.results.pt} className="w-full rounded"/>}{!resultMatch.results?.pt && !resultMatch.results?.gfx && <p>Results uploading...</p>}</div></div>}</AnimatePresence>
    </div>
  );
};

export default Home;
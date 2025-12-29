import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, MessageSquare, AlertTriangle, 
  FileText, User, LogOut, Copy, Eye, Bell, Mail, 
  Trophy, Upload, DollarSign, CreditCard, ChevronRight,
  Users, Calendar, Wallet, MapPin
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

// ✅ Cloudinary Config
const CLOUDINARY_CLOUD_NAME = "dvmla7g1o";
const CLOUDINARY_UPLOAD_PRESET = "oso1twpu";

const Dashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [myBookings, setMyBookings] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [matchesData, setMatchesData] = useState({}); 
  const [profileData, setProfileData] = useState({ gameName: '', uid: '' });
  const [activeTab, setActiveTab] = useState('matches'); 
  const [inboxMessages, setInboxMessages] = useState([]); 
  const [unreadCount, setUnreadCount] = useState(0); 
  
  // ✅ QR UPLOAD STATE
  const [qrFile, setQrFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate('/login');

    // 1. FETCH USER PROFILE
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setProfileData(userDoc.data());
      } catch (error) { console.error("Error fetching profile:", error); }
    };
    fetchProfile();

    // 2. FETCH BOOKINGS
    const qBookings = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const unsubBookings = onSnapshot(qBookings, async (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort bookings: Active/Won first, then others
        bookings.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setMyBookings(bookings);

        const matchInfo = {};
        for (const b of bookings) {
            if (b.tournamentId) {
                try {
                  const matchDoc = await getDoc(doc(db, "tournaments", b.tournamentId));
                  if (matchDoc.exists()) matchInfo[b.tournamentId] = matchDoc.data();
                } catch (error) { console.error("Error fetching match:", error); }
            }
        }
        setMatchesData(matchInfo);
    });

    // 3. FETCH CONTACT MESSAGES
    const qContact = query(collection(db, "contact_messages"), where("userId", "==", user.uid));
    const unsubContact = onSnapshot(qContact, (snapshot) => {
        setContactMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. FETCH INBOX
    const qInbox = query(collection(db, "user_inbox"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubInbox = onSnapshot(qInbox, async (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp }));
      setInboxMessages(messages);
      const unread = messages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
      
      if (activeTab === 'inbox' && unread > 0) {
        messages.forEach(async (msg) => {
          if (!msg.read) await updateDoc(doc(db, "user_inbox", msg.id), { read: true, readAt: serverTimestamp() });
        });
      }
    });

    return () => { unsubBookings(); unsubContact(); unsubInbox(); };
  }, [user, loading, navigate, activeTab]);

  // ✅ HANDLE QR UPLOAD
  const handleQrSubmit = async (bookingId) => {
    if (!qrFile) return toast.error("Please select a QR Code image!");
    setUploadingId(bookingId);
    
    try {
      const formData = new FormData();
      formData.append("file", qrFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      
      if(data.secure_url) {
        await updateDoc(doc(db, "bookings", bookingId), {
          userQr: data.secure_url,
          status: 'processing'
        });
        toast.success("QR Uploaded! Admin will verify soon.");
        setQrFile(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed.");
    }
    setUploadingId(null);
  };

  // ✅ COPY TO CLIPBOARD FUNCTION
  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message || "Copied to clipboard!");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };
  
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green"></div></div>;

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* USER PROFILE HEADER */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-transparent"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                  <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=00FF41&color=000`} alt="Profile" className="w-full h-full object-cover"/>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-brand-green text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black shadow-lg">PLAYER</div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-white font-gaming uppercase tracking-wide">{user?.displayName || "Gamer"}</h1>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <div className="flex justify-center md:justify-start gap-3 mt-3">
                  <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Matches</span>
                    <span className="text-white font-bold">{myBookings.length}</span>
                  </div>
                  <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Messages</span>
                    <span className="text-brand-green font-bold">{inboxMessages.length}</span>
                  </div>
                  <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Winnings</span>
                    <span className="text-yellow-500 font-bold">₹{myBookings.reduce((acc, curr) => acc + (curr.prizeAmount || 0), 0)}</span>
                  </div>
                  <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Status</span>
                    <span className="text-green-500 font-bold text-xs">ACTIVE</span>
                  </div>
                </div>
              </div>

              <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-xs">
                <LogOut size={14}/> LOGOUT
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'matches', label: 'MY MATCHES', icon: Trophy },
              { id: 'inbox', label: 'INBOX', icon: Mail, count: unreadCount },
              { id: 'notifications', label: 'SUPPORT', icon: MessageSquare },
              { id: 'profile', label: 'PROFILE', icon: User },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-green text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]' : 'bg-[#111] text-gray-400 border border-white/5 hover:bg-white/5'}`}
              >
                <tab.icon size={16}/>
                {tab.label}
                {tab.count > 0 && <span className="bg-red-600 text-white text-[10px] px-2 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* --- TAB: MY MATCHES --- */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-gaming text-white mb-6 flex items-center gap-3">
                <Trophy className="text-brand-green"/> MY MATCHES
              </h2>
              
              {myBookings.length === 0 && (
                 <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#111]">
                   <AlertTriangle className="mx-auto text-gray-600 mb-2" size={48}/>
                   <p className="text-gray-500">You haven't booked any slots yet.</p>
                   <button onClick={() => navigate('/')} className="mt-4 text-brand-green hover:underline">Find a Match</button>
                 </div>
              )}

              {myBookings.map((booking) => {
                const match = matchesData[booking.tournamentId] || {};
                
                // WINNING STATUS CHECK
                const isWinner = booking.status === 'won';
                const isProcessing = booking.status === 'processing';
                const isPaid = booking.status === 'paid';
                const isWinnerSection = isWinner || isProcessing || isPaid;

                return (
                  <div key={booking.id} id={`booking-${booking.id}`} className={`bg-[#111] rounded-2xl border overflow-hidden relative transition-all ${isWinnerSection ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white/10'}`}>
                    
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                      {isWinnerSection && (
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                          <Trophy size={12} fill="black"/> WINNER
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 ${
                        booking.status === 'approved' ? 'bg-green-500/20 text-green-500' : 
                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 
                        isWinnerSection ? 'bg-black/40 text-yellow-500 border border-yellow-500/30' : 
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {booking.status === 'approved' ? <CheckCircle size={12}/> : 
                         booking.status === 'rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                        {booking.status}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{match.title || `Match #${booking.tournamentId}`}</h3>
                          <p className="text-gray-400 text-xs">Player: {booking.playerName}</p>
                          <p className="text-gray-400 text-xs">Map: {match.map} • Type: {match.category} • {match.type}</p>
                        </div>
                      </div>

                      {/* --- WINNER ZONE (NEW) --- */}
                      {isWinnerSection && (
                        <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500 p-4 rounded-r-lg">
                          <h4 className="text-yellow-500 font-bold text-lg flex items-center gap-2 mb-2">
                            <Trophy size={20}/> CONGRATULATIONS! YOU WON ₹{booking.prizeAmount}
                          </h4>
                          
                          {/* CASE 1: WON (Needs QR) */}
                          {isWinner && (
                            <div className="mt-3">
                              <p className="text-gray-300 text-sm mb-3">Please upload your Payment QR Code to receive the prize.</p>
                              <div className="flex gap-2 items-center">
                                <label className="cursor-pointer bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition flex items-center gap-2">
                                   <Upload size={16}/> {qrFile ? "Change QR" : "Select QR Image"}
                                   <input type="file" className="hidden" onChange={e => setQrFile(e.target.files[0])} accept="image/*"/>
                                </label>
                                {qrFile && (
                                  <button 
                                    onClick={() => handleQrSubmit(booking.id)} 
                                    disabled={uploadingId === booking.id}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-500 transition"
                                  >
                                    {uploadingId === booking.id ? "Uploading..." : "Submit to Admin"}
                                  </button>
                                )}
                              </div>
                              {qrFile && <p className="text-gray-500 text-xs mt-2">Selected: {qrFile.name}</p>}
                            </div>
                          )}

                          {/* CASE 2: PROCESSING */}
                          {isProcessing && (
                            <div className="flex items-center gap-3 mt-2 bg-yellow-500/20 p-3 rounded border border-yellow-500/30">
                               <Clock className="text-yellow-500 animate-spin-slow" size={20}/>
                               <div>
                                 <p className="text-white text-sm font-bold">Processing Payment...</p>
                                 <p className="text-gray-400 text-xs">Admin is verifying your QR. Amount will be sent shortly.</p>
                               </div>
                            </div>
                          )}

                          {/* CASE 3: PAID */}
                          {isPaid && (
                            <div className="mt-2">
                               <div className="bg-green-500/10 p-3 rounded border border-green-500/20 flex items-center gap-3 mb-2">
                                  <CheckCircle className="text-green-500" size={20}/>
                                  <div>
                                    <p className="text-green-400 font-bold text-sm">PAYMENT SUCCESSFUL</p>
                                    <p className="text-gray-400 text-xs">Amount transferred to your account.</p>
                                  </div>
                               </div>
                               {booking.paymentProof && (
                                 <a href={booking.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs flex items-center gap-1 hover:underline">
                                   <Eye size={12}/> View Payment Proof
                                 </a>
                               )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* MATCH DETAILS GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <p className="text-gray-500 text-xs font-bold flex items-center gap-1"><Calendar size={10}/> TYPE</p>
                            <p className="text-white text-sm">{match.category} • {match.type}</p>
                         </div>
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1"><Clock size={10}/> TIME</span>
                            <span className="text-white text-sm">{match.time ? new Date(match.time).toLocaleString() : 'TBA'}</span>
                         </div>
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1"><Wallet size={10}/> ENTRY FEE</span>
                            <span className="text-white text-sm">₹{match.fee || "Free"}</span>
                         </div>
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1"><Users size={10}/> SLOTS</span>
                            <span className="text-white text-sm">{match.filledSlots || 0}/{match.totalSlots || 0}</span>
                         </div>
                      </div>

                      {/* ID/PASS DISPLAY (Only if Approved) */}
                      {booking.status === 'approved' && match.status === 'ID Released' && (
                        <div className="bg-[#0a0a0a] border border-brand-green/30 p-4 rounded-xl mb-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-brand-green text-black text-[9px] font-bold px-2 py-0.5 rounded-bl">LIVE</div>
                           <p className="text-brand-green text-xs font-bold mb-2 flex items-center gap-2"><CreditCard size={12}/> ROOM DETAILS</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500 text-[10px]">ROOM ID</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-white font-mono font-bold select-all">{match.roomId}</p>
                                  <Copy 
                                    size={14} 
                                    className="text-brand-green cursor-pointer hover:scale-110" 
                                    onClick={() => copyToClipboard(match.roomId, "Room ID copied!")}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 text-[10px]">PASSWORD</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-white font-mono font-bold select-all">{match.password || "No Password"}</p>
                                  {match.password && (
                                    <Copy 
                                      size={14} 
                                      className="text-brand-green cursor-pointer hover:scale-110" 
                                      onClick={() => copyToClipboard(match.password, "Password copied!")}
                                    />
                                  )}
                                </div>
                              </div>
                           </div>
                        </div>
                      )}

                      {/* ADMIN MESSAGES */}
                      {booking.adminMessage && (
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg mb-4 animate-pulse">
                          <p className="text-blue-400 text-xs font-bold flex items-center gap-2 mb-1"><Bell size={12}/> ADMIN MESSAGE</p>
                          <p className="text-gray-300 text-sm bg-black/50 p-2 rounded">{booking.adminMessage}</p>
                          {booking.messageTime && (
                            <p className="text-gray-500 text-xs mt-1">
                              Sent: {new Date(booking.messageTime?.seconds * 1000).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* PAYMENT SCREENSHOT */}
                      {booking.screenshotUrl && (
                        <div className="mt-3">
                          <a 
                            href={booking.screenshotUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-white text-sm bg-black/30 px-3 py-1 rounded"
                          >
                            <Eye size={14}/> View Payment Screenshot
                          </a>
                        </div>
                      )}

                      {/* RULES */}
                      <div className="bg-white/5 p-3 rounded-lg mt-4">
                        <p className="text-gray-500 text-[10px] font-bold mb-1 flex items-center gap-1"><FileText size={10}/> RULES</p>
                        <p className="text-gray-400 text-xs line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                          {match.rules || "Standard rules apply. No hacking allowed."}
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- TAB: INBOX --- */}
          {activeTab === 'inbox' && (
             <div className="space-y-6">
                <h2 className="text-2xl font-gaming text-white mb-6 flex items-center gap-3">
                  <Mail className="text-brand-green"/> ADMIN MESSAGES
                  {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                      {unreadCount} UNREAD
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                   {inboxMessages.length === 0 && (
                     <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#111]">
                       <MessageSquare className="mx-auto text-gray-600 mb-2" size={48}/>
                       <p className="text-gray-500">No messages from admin yet.</p>
                       <p className="text-gray-600 text-sm mt-1">You'll see tournament updates and support replies here.</p>
                       <button onClick={() => navigate('/contact')} className="mt-4 text-brand-green hover:underline">Contact Admin</button>
                     </div>
                   )}
                   
                   {inboxMessages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`bg-[#111] p-5 rounded-xl border ${msg.read ? 'border-white/5' : 'border-brand-green/30'} relative transition-all duration-300 hover:border-brand-green/50`}
                        id={`message-${msg.id}`}
                      >
                        {!msg.read && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                          <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-1">
                              {msg.title || "Admin Message"}
                              {msg.type === 'direct' && (
                                <span className="bg-brand-green/20 text-brand-green text-xs px-2 py-1 rounded">TOURNAMENT UPDATE</span>
                              )}
                              {msg.type === 'reply' && (
                                <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded">SUPPORT REPLY</span>
                              )}
                            </h3>
                            <p className="text-gray-500 text-xs">
                              {msg.timestamp?.seconds ? 
                                new Date(msg.timestamp.seconds * 1000).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                "Recently"}
                            </p>
                          </div>
                          
                          <div className="mt-2 md:mt-0">
                            {msg.read ? (
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <CheckCircle size={12}/> Read
                              </span>
                            ) : (
                              <span className="text-brand-green text-xs flex items-center gap-1">
                                <Bell size={12}/> Unread
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5 mt-3">
                          <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                        
                        {msg.tournamentId && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button 
                              onClick={() => {
                                setActiveTab('matches');
                                setTimeout(() => {
                                  const bookingElement = document.getElementById(`booking-${msg.tournamentId}`);
                                  if (bookingElement) {
                                    bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    bookingElement.classList.add('ring-2', 'ring-brand-green', 'ring-opacity-50');
                                    setTimeout(() => {
                                      bookingElement.classList.remove('ring-2', 'ring-brand-green', 'ring-opacity-50');
                                    }, 3000);
                                  }
                                }, 100);
                              }}
                              className="text-brand-green hover:text-white text-sm flex items-center gap-2 bg-brand-green/10 hover:bg-brand-green/20 px-3 py-1.5 rounded transition"
                            >
                              <Clock size={14}/>
                              View Related Match
                            </button>
                            
                            {matchesData[msg.tournamentId] && (
                              <span className="text-gray-400 text-sm flex items-center gap-2">
                                Match: {matchesData[msg.tournamentId]?.title?.substring(0, 30)}...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* --- TAB: SUPPORT --- */}
          {activeTab === 'notifications' && (
             <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10 text-center">
                    <img 
                      src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=00FF41&color=000`} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-brand-green object-cover"
                    />
                    <h2 className="text-xl font-bold text-white">{user?.displayName || "Gamer"}</h2>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                  </div>

                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                     <h3 className="text-brand-green font-bold mb-4">NEED HELP?</h3>
                     <button onClick={() => navigate('/contact')} className="w-full bg-brand-green text-black font-bold py-3 rounded-lg hover:bg-white transition">CONTACT ADMIN</button>
                     <p className="text-gray-500 text-xs text-center mt-3">Got questions? We're here to help!</p>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2">
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                     <h3 className="text-brand-green font-bold mb-4 flex items-center gap-2">
                       <MessageSquare size={18}/> SUPPORT INBOX ({contactMessages.length})
                     </h3>
                     <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                       {contactMessages.map(msg => (
                          <div key={msg.id} className="bg-black p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-gray-400 text-sm">
                                <span className="font-bold text-white">You:</span> {msg.message.substring(0, 100)}{msg.message.length > 100 ? '...' : ''}
                              </p>
                              <span className="text-gray-600 text-xs">
                                {msg.timestamp?.toDate().toLocaleString()}
                              </span>
                            </div>
                            
                            {msg.adminReply ? (
                              <div className="bg-brand-green/10 p-3 rounded mt-2 border-l-2 border-brand-green">
                                <p className="text-brand-green text-xs font-bold flex items-center gap-1">
                                  <CheckCircle size={12}/> ADMIN REPLY:
                                </p>
                                <p className="text-white text-sm mt-1">{msg.adminReply}</p>
                                {msg.repliedAt && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    Replied: {msg.repliedAt?.toDate().toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="bg-yellow-500/10 p-2 rounded mt-2 border-l-2 border-yellow-500">
                                <p className="text-yellow-500 text-xs font-bold flex items-center gap-1">
                                  <Clock size={12}/> PENDING REPLY
                                </p>
                                <p className="text-gray-400 text-xs mt-1">Admin will reply soon...</p>
                              </div>
                            )}
                          </div>
                       ))}
                       
                       {contactMessages.length === 0 && (
                         <div className="text-center py-10">
                           <MessageSquare className="mx-auto text-gray-600 mb-2" size={32}/>
                           <p className="text-gray-600">No messages yet.</p>
                           <button onClick={() => navigate('/contact')} className="mt-3 text-brand-green text-sm hover:underline">Send your first message</button>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
             </div>
          )}

          {/* --- TAB: PROFILE --- */}
          {activeTab === 'profile' && (
             <div className="max-w-2xl mx-auto">
                <div className="bg-[#111] border border-white/10 p-8 rounded-2xl shadow-xl">
                   <h3 className="text-2xl font-gaming text-white mb-6 flex items-center gap-3"><User className="text-brand-green"/> GAMER PROFILE</h3>
                   
                   <div className="space-y-6">
                      <div>
                         <label className="text-xs text-gray-500 uppercase font-bold block mb-2">DISPLAY NAME</label>
                         <div className="bg-black/50 border border-white/20 p-3 rounded text-white">{user?.displayName || "Not set"}</div>
                      </div>
                      
                      <div>
                         <label className="text-xs text-gray-500 uppercase font-bold block mb-2">IN-GAME NAME (Free Fire)</label>
                         <div className="bg-black/50 border border-white/20 p-3 rounded text-white">{profileData.gameName || "Not set"}</div>
                         <p className="text-gray-500 text-xs mt-1">This name should match your payment screenshot</p>
                      </div>
                      
                      <div>
                         <label className="text-xs text-gray-500 uppercase font-bold block mb-2">FREE FIRE UID</label>
                         <div className="bg-black/50 border border-white/20 p-3 rounded text-white font-mono">{profileData.uid || "Not set"}</div>
                      </div>
                      
                      <div>
                         <label className="text-xs text-gray-500 uppercase font-bold block mb-2">ACCOUNT STATUS</label>
                         <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-3 rounded flex items-center gap-2">
                            <CheckCircle size={16}/>
                            <span className="font-bold">ACTIVE & VERIFIED</span>
                         </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10">
                         <button onClick={() => navigate('/contact')} className="w-full bg-brand-green text-black font-bold py-3 rounded hover:bg-white transition">UPDATE PROFILE INFO (Contact Admin)</button>
                         <p className="text-gray-500 text-xs text-center mt-3">To update your game name or UID, please contact admin</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
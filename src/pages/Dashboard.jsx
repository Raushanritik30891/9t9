import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, serverTimestamp, orderBy, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, MessageSquare, AlertTriangle, 
  FileText, User, LogOut, Copy, Eye, Bell, Mail, 
  Trophy, Upload, DollarSign, CreditCard, ChevronRight,
  Users, Calendar, Wallet, MapPin, Edit2, Save, X
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
  
  // Data States
  const [myBookings, setMyBookings] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [matchesData, setMatchesData] = useState({}); 
  const [profileData, setProfileData] = useState({ gameName: '', uid: '', walletBalance: 0 });
  const [inboxMessages, setInboxMessages] = useState([]); 
  const [unreadCount, setUnreadCount] = useState(0); 

  // UI States
  const [activeTab, setActiveTab] = useState('matches'); 
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ gameName: '', uid: '' });
  
  // Action States (Upload/Report)
  const [qrFile, setQrFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [reportMatch, setReportMatch] = useState(null); // Which match is being reported
  const [issueText, setIssueText] = useState(""); // Issue description

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate('/login');

    // 1. Fetch Profile
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            setProfileData(userDoc.data());
            setEditForm({ gameName: userDoc.data().gameName || '', uid: userDoc.data().uid || '' });
        }
      } catch (error) { console.error("Error fetching profile:", error); }
    };
    fetchProfile();

    // 2. Fetch Bookings (Real-time)
    const qBookings = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const unsubBookings = onSnapshot(qBookings, async (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort: Newest first
        bookings.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setMyBookings(bookings);

        // Fetch Match Details for each booking
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

    // 3. Fetch Support Messages
    const qContact = query(collection(db, "contact_messages"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubContact = onSnapshot(qContact, (snapshot) => {
        setContactMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Fetch Inbox Messages
    const qInbox = query(collection(db, "user_inbox"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubInbox = onSnapshot(qInbox, async (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp }));
      setInboxMessages(messages);
      const unread = messages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
      
      // Auto-read logic if tab is active
      if (activeTab === 'inbox' && unread > 0) {
        messages.forEach(async (msg) => {
          if (!msg.read) await updateDoc(doc(db, "user_inbox", msg.id), { read: true, readAt: serverTimestamp() });
        });
      }
    });

    return () => { unsubBookings(); unsubContact(); unsubInbox(); };
  }, [user, loading, navigate, activeTab]);

  // ✅ SMART QR UPLOAD (Handles Winner Prize & Refund Claim)
  const handleQrSubmit = async (bookingId, isRefund) => {
    if (!qrFile) return toast.error("Please select a QR Code image!");
    setUploadingId(bookingId);
    
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", qrFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      
      if(data.secure_url) {
        // Decide status based on flow (Refund or Win)
        const nextStatus = isRefund ? 'refund_processing' : 'processing';
        
        await updateDoc(doc(db, "bookings", bookingId), {
          userQr: data.secure_url,
          status: nextStatus
        });
        toast.success(isRefund ? "Refund Request Sent! 💸" : "Prize Claim Sent! 🏆");
        setQrFile(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed.");
    }
    setUploadingId(null);
  };

  // ✅ REPORT ISSUE HANDLER (Linked to Match)
  const handleReportIssue = async (e) => {
      e.preventDefault();
      if(!issueText) return toast.error("Please describe the issue");
      
      try {
          await addDoc(collection(db, "contact_messages"), {
              userId: user.uid,
              name: user.displayName,
              email: user.email,
              message: `[MATCH ISSUE: #${reportMatch.tournamentId.slice(0,6)}] ${issueText}`,
              type: 'match_issue',
              matchId: reportMatch.tournamentId,
              status: 'open',
              timestamp: new Date()
          });
          toast.success("Issue Reported! Check Support Tab.");
          setReportMatch(null);
          setIssueText("");
      } catch (err) {
          toast.error("Failed to report.");
      }
  };

  // ✅ SAVE PROFILE CHANGES
  const handleSaveProfile = async () => {
      try {
          await updateDoc(doc(db, "users", user.uid), { gameName: editForm.gameName, uid: editForm.uid });
          setProfileData(prev => ({ ...prev, ...editForm }));
          setIsEditingProfile(false);
          toast.success("Profile Updated! ✅");
      } catch (error) { toast.error("Update failed."); }
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message || "Copied!");
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };
  
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green"></div></div>;

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* USER PROFILE HEADER CARD */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-transparent"></div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center overflow-hidden">
                  <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover"/>
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
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Winnings</span>
                    <span className="text-yellow-500 font-bold">₹{myBookings.filter(b=>b.status==='paid').reduce((a,c)=>a+(Number(c.prizeAmount)||0),0)}</span>
                  </div>
                  <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 text-center">
                     <span className="text-[10px] text-gray-500 uppercase block font-bold">Status</span>
                     <span className="text-green-500 font-bold text-xs">ACTIVE</span>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-xs"><LogOut size={14}/> LOGOUT</button>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'matches', label: 'MY MATCHES', icon: Trophy },
              { id: 'inbox', label: 'INBOX', icon: Mail, count: unreadCount },
              { id: 'wallet', label: 'WALLET & HELP', icon: DollarSign },
              { id: 'profile', label: 'PROFILE', icon: User },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-green text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]' : 'bg-[#111] text-gray-400 border border-white/5 hover:bg-white/5'}`}>
                <tab.icon size={16}/> {tab.label} {tab.count > 0 && <span className="bg-red-600 text-white text-[10px] px-2 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* =======================
              TAB CONTENT: MY MATCHES
             ======================= */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              {myBookings.length === 0 && (
                <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-white/10">
                   <AlertTriangle className="mx-auto text-gray-600 mb-2" size={48}/>
                   <p className="text-gray-500">You haven't booked any slots yet.</p>
                   <button onClick={() => navigate('/')} className="mt-4 text-brand-green hover:underline">Find a Match</button>
                </div>
              )}

              {myBookings.map((booking) => {
                const match = matchesData[booking.tournamentId] || {};
                
                // --- STATUS HELPERS ---
                const isWinner = booking.status === 'won';
                const isRefund = booking.status === 'refund_pending';
                const isProcessing = booking.status === 'processing' || booking.status === 'refund_processing';
                const isPaid = booking.status === 'paid';
                const isRefunded = booking.status === 'refund_paid';
                
                const showActionSection = isWinner || isRefund || isProcessing || isPaid || isRefunded;
                const isRefundFlow = isRefund || booking.status === 'refund_processing' || isRefunded;

                return (
                  <div key={booking.id} id={`booking-${booking.id}`} className={`bg-[#111] rounded-2xl border overflow-hidden relative transition-all ${isWinner ? 'border-yellow-500/50' : isRefundFlow ? 'border-orange-500/50' : 'border-white/10'}`}>
                    
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 p-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 ${
                        isWinner ? 'bg-yellow-500 text-black' : 
                        isRefundFlow ? 'bg-orange-500 text-black' : 
                        booking.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {isWinner ? <Trophy size={12}/> : isRefundFlow ? <DollarSign size={12}/> : null}
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{match.title || `Match #${booking.tournamentId}`}</h3>
                          <div className="flex gap-3 text-xs text-gray-400">
                             <span className="bg-white/5 px-2 py-0.5 rounded flex items-center gap-1"><MapPin size={10}/> {match.map}</span>
                             <span className="bg-white/5 px-2 py-0.5 rounded">{match.category}</span>
                             {match.perKill > 0 && <span className="bg-white/5 px-2 py-0.5 rounded text-brand-green font-bold">Per Kill: ₹{match.perKill}</span>}
                          </div>
                        </div>
                      </div>

                      {/* --- ACTION ZONE (WINNER OR REFUND) --- */}
                      {showActionSection && (
                        <div className={`mb-6 p-4 rounded-r-lg border-l-4 ${isRefundFlow ? 'bg-orange-500/10 border-orange-500' : 'bg-yellow-500/10 border-yellow-500'}`}>
                          <h4 className={`font-bold text-lg flex items-center gap-2 mb-2 ${isRefundFlow ? 'text-orange-500' : 'text-yellow-500'}`}>
                            {isRefundFlow ? <><AlertTriangle size={20}/> MATCH CANCELLED - REFUND</> : <><Trophy size={20}/> CONGRATULATIONS! YOU WON</>}
                          </h4>
                          
                          {/* 1. UPLOAD QR FORM */}
                          {(isWinner || isRefund) && (
                            <div className="mt-3">
                              <p className="text-gray-300 text-sm mb-3">
                                {isRefundFlow ? 'We are sorry! Upload QR to get instant refund of ' : 'Great Game! Upload QR to claim prize of '} 
                                <span className="font-bold text-white">₹{booking.prizeAmount || match.fee}</span>
                              </p>
                              <div className="flex gap-2 items-center">
                                <label className={`cursor-pointer text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition flex items-center gap-2 ${isRefundFlow ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                                   <Upload size={16}/> {qrFile ? "Change QR" : "Select QR"}
                                   <input type="file" className="hidden" onChange={e => setQrFile(e.target.files[0])} accept="image/*"/>
                                </label>
                                {qrFile && (
                                  <button onClick={() => handleQrSubmit(booking.id, isRefundFlow)} disabled={uploadingId === booking.id} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-500 transition">
                                    {uploadingId === booking.id ? "Uploading..." : "Submit to Admin"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 2. PROCESSING STATE */}
                          {isProcessing && (
                            <div className="flex items-center gap-3 mt-2">
                               <Clock className={isRefundFlow ? 'text-orange-500' : 'text-yellow-500'} size={20}/>
                               <p className="text-gray-300 text-sm">Verifying QR... Payment will be sent soon.</p>
                            </div>
                          )}

                          {/* 3. PAID / REFUNDED STATE */}
                          {(isPaid || isRefunded) && (
                            <div className="mt-2 flex items-center gap-3">
                               <CheckCircle className="text-green-500" size={20}/>
                               <div>
                                 <p className="text-green-400 font-bold text-sm">{isRefundFlow ? 'REFUND SUCCESSFUL' : 'PRIZE PAID'}</p>
                                 {booking.paymentProof && <a href={booking.paymentProof} target="_blank" className="text-blue-400 text-xs hover:underline flex gap-1 items-center"><Eye size={10}/> View Proof</a>}
                               </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* DETAILED INFO GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                         <div className="bg-black/40 p-2 rounded border border-white/5"><span className="text-gray-500 block mb-1">Time</span><span className="text-white">{match.time ? new Date(match.time).toLocaleString() : 'TBA'}</span></div>
                         <div className="bg-black/40 p-2 rounded border border-white/5"><span className="text-gray-500 block mb-1">Prize Pool</span><span className="text-white">₹{match.prizePool}</span></div>
                         <div className="bg-black/40 p-2 rounded border border-white/5"><span className="text-gray-500 block mb-1">ID/Pass</span><span className={match.status === 'ID Released' ? 'text-green-500 font-bold' : 'text-gray-500'}>{match.status === 'ID Released' ? 'RELEASED' : 'WAITING'}</span></div>
                         <div className="bg-black/40 p-2 rounded border border-white/5"><span className="text-gray-500 block mb-1">Slot</span><span className="text-white">{booking.slotNo || 'Pending'}</span></div>
                      </div>

                      {/* ID/PASS DISPLAY */}
                      {booking.status === 'approved' && match.status === 'ID Released' && (
                        <div className="bg-[#0a0a0a] border border-brand-green/30 p-4 rounded-xl mb-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-brand-green text-black text-[9px] font-bold px-2 py-0.5 rounded-bl">LIVE</div>
                           <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-gray-500 text-[10px]">ROOM ID</p><div className="flex items-center gap-2"><p className="text-white font-mono font-bold select-all">{match.roomId}</p><Copy size={12} className="text-brand-green cursor-pointer" onClick={() => copyToClipboard(match.roomId)}/></div></div>
                              <div><p className="text-gray-500 text-[10px]">PASSWORD</p><div className="flex items-center gap-2"><p className="text-white font-mono font-bold select-all">{match.password}</p><Copy size={12} className="text-brand-green cursor-pointer" onClick={() => copyToClipboard(match.password)}/></div></div>
                           </div>
                        </div>
                      )}

                      {/* ADMIN MESSAGE */}
                      {booking.adminMessage && (
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg mb-4 animate-pulse">
                          <p className="text-blue-400 text-xs font-bold flex items-center gap-2 mb-1"><Bell size={12}/> ADMIN MESSAGE</p>
                          <p className="text-gray-300 text-sm bg-black/50 p-2 rounded">{booking.adminMessage}</p>
                        </div>
                      )}

                      {/* REPORT ISSUE BUTTON */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                         <div className="text-xs text-gray-500">Ref: {booking.id.slice(0,8)}</div>
                         <button onClick={() => setReportMatch(booking)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/20 px-3 py-1 rounded hover:bg-red-500/10 transition">
                            <AlertTriangle size={12}/> Report Issue
                         </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- TAB: INBOX --- */}
          {activeTab === 'inbox' && (
             <div className="space-y-4">
                {inboxMessages.length === 0 && <p className="text-gray-500 text-center py-10">No messages.</p>}
                {inboxMessages.map(msg => (
                   <div key={msg.id} className={`bg-[#111] p-5 rounded-xl border ${msg.read ? 'border-white/5' : 'border-brand-green/30'} relative`}>
                      {!msg.read && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></span>}
                      <h3 className="text-white font-bold text-lg mb-1">{msg.title}</h3>
                      <p className="text-gray-500 text-xs mb-2">{msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : ''}</p>
                      <p className="text-gray-300 text-sm bg-black/30 p-3 rounded">{msg.message}</p>
                   </div>
                ))}
             </div>
          )}

          {/* --- TAB: WALLET & HELP --- */}
          {activeTab === 'wallet' && (
             <div className="grid lg:grid-cols-2 gap-8">
                {/* Winnings Display */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 h-fit">
                   <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Wallet className="text-brand-green"/> TOTAL WINNINGS</h3>
                   <div className="bg-gradient-to-r from-brand-green/20 to-green-900/20 p-6 rounded-xl text-center mb-6 border border-brand-green/30">
                      <h2 className="text-5xl font-bold text-white">₹{myBookings.filter(b=>b.status==='paid' || b.status==='won').reduce((a,c)=>a+(Number(c.prizeAmount)||0),0)}</h2>
                      <p className="text-brand-green text-xs font-bold uppercase tracking-wider mt-2">Lifetime Earnings</p>
                   </div>
                   <p className="text-gray-500 text-xs text-center">Note: Payments are processed manually via QR Code verification.</p>
                </div>

                {/* Ticket History */}
                <div className="lg:col-span-1">
                   <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare className="text-blue-500"/> TICKET HISTORY</h3>
                   <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {contactMessages.map(msg => (
                         <div key={msg.id} className="bg-[#111] p-4 rounded-xl border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${msg.type === 'match_issue' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{msg.type?.replace('_', ' ') || 'Support'}</span>
                               <span className="text-gray-600 text-[10px]">{msg.timestamp?.toDate().toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300 text-xs mb-2">{msg.message}</p>
                            {msg.adminReply ? <div className="bg-brand-green/10 p-2 rounded border-l-2 border-brand-green text-xs text-white"><span className="text-brand-green font-bold">Admin:</span> {msg.adminReply}</div> : <p className="text-yellow-500 text-[10px]">Pending Reply...</p>}
                         </div>
                      ))}
                      {contactMessages.length === 0 && <p className="text-gray-500 text-center py-4">No tickets raised.</p>}
                   </div>
                </div>
             </div>
          )}

          {/* --- TAB: PROFILE --- */}
          {activeTab === 'profile' && (
             <div className="max-w-xl mx-auto bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2"><User className="text-brand-green"/> GAMER PROFILE</h3>
                    <button onClick={() => { if(isEditingProfile) handleSaveProfile(); else setIsEditingProfile(true); }} className={`text-xs px-4 py-2 rounded font-bold flex items-center gap-2 transition ${isEditingProfile ? 'bg-brand-green text-black' : 'bg-white/10 text-white'}`}>
                        {isEditingProfile ? <><Save size={14}/> SAVE</> : <><Edit2 size={14}/> EDIT</>}
                    </button>
                </div>
                <div className="space-y-5">
                   <div><label className="text-gray-500 text-xs font-bold uppercase">Display Name</label><div className="bg-black border border-white/10 p-3 rounded text-gray-400 mt-1 flex items-center gap-2"><img src={user?.photoURL} className="w-5 h-5 rounded-full" alt=""/>{user?.displayName} <span className="text-[10px] bg-white/10 px-1 rounded ml-auto">LOCKED</span></div></div>
                   <div><label className="text-gray-500 text-xs font-bold uppercase">In-Game Name</label>{isEditingProfile ? <input type="text" className="w-full bg-black border border-brand-green p-3 rounded text-white mt-1 outline-none" value={editForm.gameName} onChange={e => setEditForm({...editForm, gameName: e.target.value})}/> : <div className="bg-black border border-white/10 p-3 rounded text-white mt-1">{profileData.gameName || "Not Set"}</div>}</div>
                   <div><label className="text-gray-500 text-xs font-bold uppercase">Free Fire UID</label>{isEditingProfile ? <input type="number" className="w-full bg-black border border-brand-green p-3 rounded text-white mt-1 font-mono outline-none" value={editForm.uid} onChange={e => setEditForm({...editForm, uid: e.target.value})}/> : <div className="bg-black border border-white/10 p-3 rounded text-white font-mono mt-1">{profileData.uid || "Not Set"}</div>}</div>
                </div>
             </div>
          )}

        </div>
      </div>

      {/* REPORT ISSUE MODAL */}
      {reportMatch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/20 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle className="text-red-500"/> REPORT ISSUE</h3>
                    <button onClick={() => setReportMatch(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                <div className="bg-white/5 p-3 rounded mb-4 text-xs text-gray-400">
                    <p><span className="text-white font-bold">Match:</span> {matchesData[reportMatch.tournamentId]?.title || 'Unknown'}</p>
                    <p><span className="text-white font-bold">ID:</span> {reportMatch.tournamentId}</p>
                </div>
                <textarea rows="4" className="w-full bg-black border border-white/20 rounded p-3 text-white text-sm outline-none focus:border-red-500 mb-4" placeholder="Describe your issue (e.g. Prize not received, Wrong refund amount)..." value={issueText} onChange={e => setIssueText(e.target.value)}></textarea>
                <button onClick={handleReportIssue} className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-500 transition">SUBMIT TICKET</button>
            </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Dashboard;
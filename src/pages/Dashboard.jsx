import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, MessageSquare, AlertTriangle, FileText, User, LogOut, Copy, Eye, Bell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast'; // ✅ ADD THIS LINE

const Dashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [myBookings, setMyBookings] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [matchesData, setMatchesData] = useState({}); // To store match details like Rules
  const [profileData, setProfileData] = useState({ gameName: '', uid: '' });
  const [activeTab, setActiveTab] = useState('matches'); // matches | notifications | profile
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate('/login');

    // 1. FETCH USER PROFILE DATA
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();

    // 2. FETCH MY BOOKINGS
    const qBookings = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const unsubBookings = onSnapshot(qBookings, async (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyBookings(bookings);

        // Fetch related match details (Rules etc.) for each booking
        const matchInfo = {};
        for (const b of bookings) {
            if (b.tournamentId) {
                try {
                  const matchDoc = await getDoc(doc(db, "tournaments", b.tournamentId));
                  if (matchDoc.exists()) {
                      matchInfo[b.tournamentId] = matchDoc.data();
                  }
                } catch (error) {
                  console.error("Error fetching match data:", error);
                }
            }
        }
        setMatchesData(matchInfo);
    });

    // 3. FETCH MY CONTACT MESSAGES (For Admin Replies)
    const qContact = query(collection(db, "contact_messages"), where("userId", "==", user.uid));
    const unsubContact = onSnapshot(qContact, (snapshot) => {
        setContactMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubBookings(); 
      unsubContact(); 
    };
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* USER PROFILE HEADER */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-transparent"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center overflow-hidden">
                  <img 
                    src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User") + "&background=0A0A0A&color=00FF41"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-brand-green text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black">
                  PLAYER
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-white font-gaming uppercase">
                  {user?.displayName || "Gamer"}
                </h1>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <div className="flex justify-center md:justify-start gap-4 mt-3">
                  <div className="bg-black/50 px-3 py-1 rounded border border-white/10">
                    <span className="text-xs text-gray-500 uppercase block">Matches</span>
                    <span className="text-brand-green font-bold">{myBookings.length}</span>
                  </div>
                  <div className="bg-black/50 px-3 py-1 rounded border border-white/10">
                    <span className="text-xs text-gray-500 uppercase block">Status</span>
                    <span className="text-green-500 font-bold text-xs">ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-xs"
              >
                <LogOut size={14}/> LOGOUT
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('matches')} 
              className={`px-4 py-2 font-bold text-sm ${activeTab === 'matches' ? 'text-white border-b-2 border-brand-green' : 'text-gray-500 hover:text-white'}`}
            >
              MY MATCHES
            </button>
            <button 
              onClick={() => setActiveTab('notifications')} 
              className={`px-4 py-2 font-bold text-sm ${activeTab === 'notifications' ? 'text-white border-b-2 border-brand-green' : 'text-gray-500 hover:text-white'}`}
            >
              SUPPORT INBOX ({contactMessages.length})
            </button>
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`px-4 py-2 font-bold text-sm ${activeTab === 'profile' ? 'text-white border-b-2 border-brand-green' : 'text-gray-500 hover:text-white'}`}
            >
              GAME PROFILE
            </button>
          </div>

          {/* TAB CONTENT: MY MATCHES */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-gaming text-white mb-6 flex items-center gap-3">
                <Clock className="text-brand-green"/> MY MATCHES
              </h2>
              
              <div className="space-y-4">
                {myBookings.map((booking) => {
                  const match = matchesData[booking.tournamentId] || {};
                  return (
                    <div key={booking.id} className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden relative">
                      {/* Status Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1
                          ${booking.status === 'approved' ? 'bg-green-500/20 text-green-500' : 
                            booking.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {booking.status === 'approved' ? <CheckCircle size={12}/> : 
                         booking.status === 'rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                        {booking.status}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-1">{match.title || "Tournament Match"}</h3>
                        <p className="text-gray-400 text-sm mb-4">Player: {booking.playerName}</p>
                        
                        {/* MATCH DETAILS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                            <p className="text-gray-500 text-xs font-bold">TYPE</p>
                            <p className="text-white text-sm">{match.category} • {match.type}</p>
                          </div>
                          <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                            <p className="text-gray-500 text-xs font-bold">TIME</p>
                            <p className="text-white text-sm">{match.time || "TBA"}</p>
                          </div>
                          <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                            <p className="text-gray-500 text-xs font-bold">ENTRY FEE</p>
                            <p className="text-white text-sm">₹{match.fee || "Free"}</p>
                          </div>
                          <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                            <p className="text-gray-500 text-xs font-bold">SLOTS</p>
                            <p className="text-white text-sm">{match.filledSlots || 0}/{match.totalSlots || 0}</p>
                          </div>
                        </div>

                        {/* IMPORTANT: ADMIN MESSAGE (ROOM ID / PASS) */}
                        {booking.adminMessage && (
                          <div className="bg-blue-600/10 border border-blue-600/30 p-3 rounded-lg mb-4 animate-pulse">
                            <p className="text-blue-400 text-xs font-bold mb-1 flex items-center gap-2">
                              <Bell size={12}/> ADMIN MESSAGE (ROOM ID/PASS):
                            </p>
                            <p className="text-white text-sm font-mono bg-black/50 p-2 rounded">{booking.adminMessage}</p>
                            {booking.messageTime && (
                              <p className="text-gray-500 text-xs mt-1">
                                Sent: {new Date(booking.messageTime?.seconds * 1000).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* ROOM DETAILS FROM MATCH */}
                        {match.roomId && match.status === 'ID Released' && (
                          <div className="bg-green-600/10 border border-green-600/30 p-3 rounded-lg mb-4">
                            <p className="text-green-400 text-xs font-bold mb-2">ROOM DETAILS RELEASED:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-gray-500 text-xs">ROOM ID:</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-white font-mono text-sm">{match.roomId}</p>
                                  <Copy 
                                    size={14} 
                                    className="text-brand-green cursor-pointer hover:scale-110" 
                                    onClick={() => {
                                      navigator.clipboard.writeText(match.roomId);
                                      alert("Room ID copied!");
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">PASSWORD:</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-white font-mono text-sm">{match.password || "No Password"}</p>
                                  {match.password && (
                                    <Copy 
                                      size={14} 
                                      className="text-brand-green cursor-pointer hover:scale-110" 
                                      onClick={() => {
                                        navigator.clipboard.writeText(match.password);
                                        alert("Password copied!");
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* RULES SECTION */}
                        <div className="bg-black/50 p-4 rounded-lg border border-white/5 mt-4">
                          <p className="text-gray-500 text-xs font-bold mb-2 flex items-center gap-2">
                            <FileText size={12}/> MATCH RULES:
                          </p>
                          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                            {match.rules || "Standard Tournament Rules Apply. No hacking, no teaming."}
                          </p>
                        </div>

                        {/* PAYMENT SCREENSHOT */}
                        {booking.screenshotUrl && (
                          <div className="mt-4">
                            <a 
                              href={booking.screenshotUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-white text-sm"
                            >
                              <Eye size={14}/> View Payment Screenshot
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {myBookings.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#111]">
                    <AlertTriangle className="mx-auto text-gray-600 mb-2" size={48}/>
                    <p className="text-gray-500">You haven't booked any slots yet.</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="mt-4 text-brand-green text-sm underline hover:text-white"
                    >
                      Find a Match
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: SUPPORT INBOX */}
          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: USER PROFILE CARD */}
              <div className="space-y-6">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 text-center">
                  <img 
                    src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User") + "&background=0A0A0A&color=00FF41"} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-brand-green object-cover"
                  />
                  <h2 className="text-xl font-bold text-white">{user?.displayName || "Gamer"}</h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>

                {/* CONTACT ADMIN */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                  <h3 className="text-brand-green font-bold mb-4">NEED HELP?</h3>
                  <button 
                    onClick={() => navigate('/contact')}
                    className="w-full bg-brand-green text-black font-bold py-3 rounded hover:bg-white transition"
                  >
                    CONTACT ADMIN
                  </button>
                  <p className="text-gray-500 text-xs text-center mt-3">
                    Got questions? We're here to help!
                  </p>
                </div>
              </div>

              {/* RIGHT: ADMIN REPLIES */}
              <div className="lg:col-span-2">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                  <h3 className="text-brand-green font-bold mb-4 flex items-center gap-2">
                    <MessageSquare size={18}/> SUPPORT INBOX
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {contactMessages.map(msg => (
                      <div key={msg.id} className="bg-black p-4 rounded border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-gray-400 text-sm">
                            <span className="font-bold text-white">You:</span> {msg.message.substring(0, 100)}{msg.message.length > 100 ? '...' : ''}
                          </p>
                          <span className="text-gray-600 text-xs">
                            {msg.timestamp?.toDate().toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Agar Admin ne reply diya hai */}
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
                        <button 
                          onClick={() => navigate('/contact')}
                          className="mt-3 text-brand-green text-sm hover:underline"
                        >
                          Send your first message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: GAME PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#111] border border-white/10 p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-gaming text-white mb-6 flex items-center gap-3">
                  <User className="text-brand-green"/> GAMER PROFILE
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">
                      DISPLAY NAME
                    </label>
                    <div className="bg-black/50 border border-white/20 p-3 rounded text-white">
                      {user?.displayName || "Not set"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">
                      IN-GAME NAME (Free Fire)
                    </label>
                    <div className="bg-black/50 border border-white/20 p-3 rounded text-white">
                      {profileData.gameName || "Not set"}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      This name should match your payment screenshot
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">
                      FREE FIRE UID
                    </label>
                    <div className="bg-black/50 border border-white/20 p-3 rounded text-white font-mono">
                      {profileData.uid || "Not set"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">
                      ACCOUNT STATUS
                    </label>
                    <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-3 rounded flex items-center gap-2">
                      <CheckCircle size={16}/>
                      <span className="font-bold">ACTIVE & VERIFIED</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={() => navigate('/contact')}
                      className="w-full bg-brand-green text-black font-bold py-3 rounded hover:bg-white transition"
                    >
                      UPDATE PROFILE INFO (Contact Admin)
                    </button>
                    <p className="text-gray-500 text-xs text-center mt-3">
                      To update your game name or UID, please contact admin
                    </p>
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
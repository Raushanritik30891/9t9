import { useState, useEffect } from 'react';
import { db, auth, SUPER_ADMIN_EMAIL, verifyAdmin, logActivity } from '../firebase';
import { 
  collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, 
  setDoc, getDoc, getDocs, query, orderBy, where, writeBatch, 
  arrayUnion, arrayRemove, increment, serverTimestamp, runTransaction
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Trash2, Plus, Skull, Map, Users, Swords, Megaphone, 
  X, Layers, Key, CheckCircle, Bell, Eye, 
  List, Image as ImageIcon, BarChart2, Settings, 
  Upload, Check, MessageSquare, Send, Home,
  Shield, UserPlus, Activity, Clock, XCircle,
  CreditCard, Edit
} from 'lucide-react';

// ✅ CLOUDINARY CONFIGURATION
const CLOUDINARY_CLOUD_NAME = "dvmla7g1o";
const CLOUDINARY_UPLOAD_PRESET = "oso1twpu";

const Admin = () => {
  const navigate = useNavigate();
  
  // ==========================
  // 1. SECURITY CHECK
  // ==========================
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/admin-login');
        return;
      }
      
      const adminInfo = await verifyAdmin(user.email);
      
      if (!adminInfo) {
        navigate('/');
        return;
      }
      
      setUserRole(adminInfo.role);
      setUserName(adminInfo.name);
      
      await logActivity(db, user.email, `Logged into admin panel`);
    };

    const timer = setTimeout(checkAdminAccess, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // ==========================
  // 2. STATE MANAGEMENT
  // ==========================
  
  // Data States
  const [tournaments, setTournaments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tickers, setTickers] = useState([]); 
  const [adminList, setAdminList] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Navigation State
  const [activeSection, setActiveSection] = useState('dashboard');

  // Modal States
  const [showIdModal, setShowIdModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false); 
  const [showResultModal, setShowResultModal] = useState(false); 
  const [showNotifyModal, setShowNotifyModal] = useState(false); 
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Selection & Input States
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null); 
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [roomDetails, setRoomDetails] = useState({ roomId: '', password: '' });
  const [slotListInput, setSlotListInput] = useState(""); 
  
  // Result File States
  const [ptFile, setPtFile] = useState(null);
  const [gfxFile, setGfxFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newTicker, setNewTicker] = useState("");
  
  // Blog & Leaderboard States
  const [blogs, setBlogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [blogForm, setBlogForm] = useState({ title: '', category: 'News', content: '' });
  const [lbForm, setLbForm] = useState({ teamName: '', wins: 0, points: 0 });
  const [blogImage, setBlogImage] = useState(null);
  const [customMsg, setCustomMsg] = useState("");
  const [replyText, setReplyText] = useState(""); 
  
  // Booking Tabs
  const [bookingTab, setBookingTab] = useState('pending');
  const [messageText, setMessageText] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  
  // ✅ NEW STATES FOR EDIT, REFUND & PAYOUTS
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMatchId, setEditMatchId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [payoutProof, setPayoutProof] = useState(null);
  // ... purane states ke neeche ...
  
  // ✅ NEW: WINNER SELECTION STATES
  const [winners, setWinners] = useState({ rank1: '', rank2: '', rank3: '' }); // BR ke liye
  const [csWinner, setCsWinner] = useState(''); // CS ke liye

  // Counters
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const unreadMsgCount = messages.filter(m => m.status === 'unread').length;

  // Match Creation Form State
  const [form, setForm] = useState({
    title: '', category: 'BR', map: 'Bermuda', matchCount: 1, time: '', fee: '', type: 'Squad',
    headshotOnly: false, totalSlots: 48, filledSlots: 0,
    prizePool: '', rank1: '', rank2: '', rank3: '', perKill: '', status: 'Open',
    rules: '1. No Emulator allowed\n2. Screenshot mandatory\n3. ID/Pass 10 mins before start.' 
  });

  // Footer Stats
  const [footerStats, setFooterStats] = useState({ 
    users: '10K+', 
    visits: '50K+', 
    prize: '₹1L+' 
  });

  const brTypes = ["Solo", "Duo", "Squad"];
  const csTypes = ["1v1", "2v2", "3v3", "4v4", "6v6"];

  // ==========================
  // 3. CLOUDINARY UPLOAD FUNCTION
  // ==========================
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    return data.secure_url;
  };

  // ==========================
  // 4. DATABASE LISTENERS
  // ==========================
  useEffect(() => {
    // A. Load Matches
    const unsubTourney = onSnapshot(query(collection(db, "tournaments"), orderBy("createdAt", "desc")), (snap) => {
      setTournaments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // B. Load Bookings
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // C. Load Contact Messages
    const unsubMessages = onSnapshot(query(collection(db, "contact_messages"), orderBy("timestamp", "desc")), (snap) => {
        setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // D. Load Blogs
    const unsubBlogs = onSnapshot(query(collection(db, "blogs"), orderBy("timestamp", "desc")), (snap) => {
        setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // E. Load Leaderboard
    const unsubLb = onSnapshot(query(collection(db, "leaderboard"), orderBy("points", "desc")), (snap) => {
        setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // F. Load Tickers
    const loadTicker = async () => {
        try {
            const docSnap = await getDoc(doc(db, "settings", "ticker"));
            if (docSnap.exists()) setTickers(docSnap.data().messages || []);
        } catch (err) { console.log("Ticker init error", err); }
    };
    loadTicker();

    // G. Load Admin List (Only for Super Admin)
    const loadAdmins = async () => {
      const user = auth.currentUser;
      if (user && user.email === SUPER_ADMIN_EMAIL) {
        return onSnapshot(collection(db, "admins"), (snap) => {
          setAdminList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    };

    // H. Load Activity Logs (Only for Super Admin)
    const loadLogs = async () => {
      const user = auth.currentUser;
      if (user && user.email === SUPER_ADMIN_EMAIL) {
        return onSnapshot(query(collection(db, "admin_logs"), orderBy("timestamp", "desc")), (snap) => {
          setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    };

    // Load admin data variables
    let unsubAdmins, unsubLogs;
    const user = auth.currentUser;
    if (user && user.email === SUPER_ADMIN_EMAIL) {
      loadAdmins().then(unsub => { unsubAdmins = unsub; });
      loadLogs().then(unsub => { unsubLogs = unsub; });
    }

    return () => { 
      unsubTourney(); 
      unsubBookings(); 
      unsubMessages();
      unsubBlogs();
      unsubLb();
      if (unsubAdmins) unsubAdmins();
      if (unsubLogs) unsubLogs();
    };
  }, [navigate]);

  // ==========================
  // 5. CORE FUNCTIONS
  // ==========================

  // Helper function to log activities
  const logAction = async (action) => {
    const user = auth.currentUser;
    if (user) {
      await logActivity(db, user.email, action);
    }
  };

  // --- A. MATCH CREATION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.time) return toast.error("Error: Title and Time are required!");
    
    await addDoc(collection(db, "tournaments"), { 
        ...form, 
        slotList: [], 
        results: { pt: '', gfx: '' }, 
        roomId: "", password: "", createdAt: new Date() 
    });
    
    await logAction(`Created match: ${form.title}`);
    
    setForm(prev => ({ 
        ...prev, title: '', time: '', fee: '', filledSlots: 0, 
        prizePool: '', rank1: '', rank2: '', rank3: '', perKill: '' 
    }));
    
    toast.success("Match Created Successfully! 🔥");
    setActiveSection('manage'); 
  };

  // --- B. BOOKING APPROVAL ---
  const handleBookingAction = async (booking, action) => {
      if (action === 'approve') {
          await updateDoc(doc(db, "bookings", booking.id), { status: 'approved' });
          
          const teamEntry = `${booking.teamName || booking.playerName} (UID: ${booking.gameId || 'N/A'})`;
          
          await updateDoc(doc(db, "tournaments", booking.tournamentId), { 
              filledSlots: increment(1),
              slotList: arrayUnion(teamEntry)
          });

          const matchRef = doc(db, "tournaments", booking.tournamentId);
          const matchSnap = await getDoc(matchRef);
          let rules = "Follow fair play.";
          if(matchSnap.exists()) rules = matchSnap.data().rules || rules;
          
          await addDoc(collection(db, "notifications"), {
              userId: booking.userId, 
              title: "✅ Booking Approved", 
              message: `Your slot for Match #${booking.tournamentId.slice(0,4)} is confirmed.\n\nRULES:\n${rules}`,
              read: false, 
              timestamp: new Date()
          });
          
          await logAction(`Approved & Added ${booking.playerName} to Match ${booking.tournamentId}`);
          toast.success("User Approved & Added to Slot List! ✅");

      } else {
          await updateDoc(doc(db, "bookings", booking.id), { status: 'rejected' });
          await addDoc(collection(db, "notifications"), {
              userId: booking.userId,
              title: "❌ Booking Rejected",
              message: "Your payment screenshot or details were invalid. Contact Admin.",
              read: false, 
              timestamp: new Date()
          });
          
          await logAction(`Rejected booking for ${booking.playerName}`);
          toast.error("User Rejected.");
      }
  };

  // --- Simple Status Update ---
  const handleUpdateStatus = async (id, newStatus) => {
      try {
          await updateDoc(doc(db, "bookings", id), { status: newStatus });
          await logAction(`Updated booking ${id} to ${newStatus}`);
          toast.success(`Booking Marked as ${newStatus}`);
      } catch (error) {
          console.error("Error updating status:", error);
          toast.error("Failed to update status");
      }
  };
  
  // --- Send Message to User ---
  const handleSendMessage = async (bookingId) => {
    if(!messageText) return;
    
    try {
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            await updateDoc(doc(db, "bookings", bookingId), {
                adminMessage: messageText,
                messageTime: new Date(),
                lastUpdated: new Date()
            });
            
            await addDoc(collection(db, "notifications"), {
                userId: booking.userId,
                title: "📨 Admin Message",
                message: `Admin sent you a message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
                read: false,
                timestamp: new Date()
            });
            
            await addDoc(collection(db, "user_inbox"), {
                userId: booking.userId,
                title: "Tournament Update 🏆",
                message: messageText,
                type: 'direct',
                tournamentId: booking.tournamentId,
                timestamp: new Date(),
                read: false
            });
            
            await logAction(`Sent message to player ${booking.playerName}`);
            setMessageText('');
            setSelectedBookingId(null);
            toast.success("Message sent successfully! 📨");
        } else {
            toast.error("Booking not found");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
    }
  };

  // --- C. ID/PASS RELEASE ---
  const saveIdPass = async () => {
      if (!selectedMatch) return;
      
      await updateDoc(doc(db, "tournaments", selectedMatch.id), {
          roomId: roomDetails.roomId,
          password: roomDetails.password,
          status: 'ID Released'
      });

      await logAction(`Released ID/Pass for match: ${selectedMatch.title}`);

      const q = query(collection(db, "bookings"), where("tournamentId", "==", selectedMatch.id), where("status", "==", "approved"));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((userDoc) => {
          const notifRef = doc(collection(db, "notifications")); 
          batch.set(notifRef, {
              userId: userDoc.data().userId,
              title: "🔑 ID/PASS RELEASED!",
              message: `Room ID for ${selectedMatch.title} is out! Check Dashboard immediately.`,
              read: false, 
              timestamp: new Date()
          });
      });
      await batch.commit();

      setShowIdModal(false);
      toast.success(`ID Released! Notification sent to ${querySnapshot.size} players. 🚀`);
  };

  // --- D. SLOT LIST UPDATE ---
  const saveSlotList = async () => {
      if(!selectedMatch) return;
      const teams = slotListInput.split('\n').filter(line => line.trim() !== "");
      
      await updateDoc(doc(db, "tournaments", selectedMatch.id), {
          slotList: teams,
          filledSlots: teams.length 
      });

      await logAction(`Updated slot list for match: ${selectedMatch.title}`);

      const q = query(collection(db, "bookings"), where("tournamentId", "==", selectedMatch.id), where("status", "==", "approved"));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((userDoc) => {
          const notifRef = doc(collection(db, "notifications"));
          batch.set(notifRef, {
              userId: userDoc.data().userId,
              title: "📋 SLOT LIST UPDATED",
              message: `Team list for ${selectedMatch.title} has been updated. Check your slot number.`,
              read: false, 
              timestamp: new Date()
          });
      });
      await batch.commit();

      setShowSlotModal(false);
      toast.success(`Slot List Updated & Players Notified!`);
  };

const handleDeclareResult = async () => {
    if(!selectedMatch) return;
    
    // Validation: Check if winners selected for BR or CS
    if (selectedMatch.category === 'BR' && (!winners.rank1)) {
        return toast.error("Please select at least Rank #1 Team");
    }
    if (selectedMatch.category === 'CS' && !csWinner) {
        return toast.error("Please select the Winner Team");
    }

    setIsUploading(true);
    
    try {
        // 1. Upload Images (Optional)
        let ptUrl = "", gfxUrl = "";
        if(ptFile) ptUrl = await uploadToCloudinary(ptFile);
        if(gfxFile) gfxUrl = await uploadToCloudinary(gfxFile);

        // 2. Identify Winning Team Names
        let winningTeams = [];
        if (selectedMatch.category === 'BR') {
            winningTeams = [winners.rank1, winners.rank2, winners.rank3].filter(n => n && n !== "None");
        } else {
            winningTeams = [csWinner].filter(n => n && n !== "None");
        }

        // 3. Update Bookings (Find User by Team Name and mark WON)
        const q = query(collection(db, "bookings"), where("tournamentId", "==", selectedMatch.id));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        let winnerCount = 0;

        snapshot.forEach((docSnap) => {
            const booking = docSnap.data();
            // Logic: Check if the booking's team name OR player name exists in the winningTeams array
            // Hum Slot List se name utha rahe hain, to exact match hona chahiye
            
            // Extract pure name from "TeamName (UID: xxx)" format if needed, or match directly
            // Assuming Dropdown values match booking names exactly.
            
            let isWinner = false;
            const bookingName = booking.teamName || booking.playerName; // Booking ka naam
            
            // Check loop
            winningTeams.forEach(winner => {
                if(bookingName && winner.includes(bookingName)) { 
                    isWinner = true; 
                }
            });
            
            if (isWinner) {
                batch.update(doc(db, "bookings", docSnap.id), { 
                    status: 'won', // ✅ Ye status change user dashboard pe QR upload trigger karega
                    prizeAmount: 0 // Amount baad me set hoga ya auto-calc kar sakte ho
                });
                winnerCount++;
            }
        });

        // 4. Close Match
        batch.update(doc(db, "tournaments", selectedMatch.id), {
            results: { pt: ptUrl, gfx: gfxUrl },
            status: 'Completed'
        });

        await batch.commit();
        await logAction(`Declared results for ${selectedMatch.title}. Winners: ${winnerCount}`);
        
        toast.success(`Result Published! ${winnerCount} Users marked as Winners.`);
        setShowResultModal(false);
        setPtFile(null); setGfxFile(null);
        setWinners({ rank1: '', rank2: '', rank3: '' });
        setCsWinner('');

    } catch(err) {
        console.error(err);
        toast.error("Failed to declare result.");
    }
    setIsUploading(false);
};
  // --- F. MESSAGE REPLY ---
  const handleReplyToMessage = async () => {
    if (!selectedMessage || !replyText) return;

    try {
        if (selectedMessage.userId) {
            await addDoc(collection(db, "notifications"), {
                userId: selectedMessage.userId,
                title: "💬 Admin Reply",
                message: `Replying to your query:\n"${selectedMessage.message.substring(0, 50)}..."\n\nAdmin: ${replyText}`,
                read: false,
                timestamp: new Date()
            });
            
            await addDoc(collection(db, "user_inbox"), {
                userId: selectedMessage.userId,
                title: "Admin Reply 💬",
                message: `Your Question: ${selectedMessage.message}\n\nAdmin Response: ${replyText}`,
                type: 'reply',
                timestamp: new Date(),
                read: false
            });
        }

        await updateDoc(doc(db, "contact_messages", selectedMessage.id), { 
            status: 'replied',
            adminReply: replyText,
            repliedAt: new Date()
        });
        
        await logAction(`Replied to ${selectedMessage.name}`);
        setReplyText("");
        setShowReplyModal(false);
        toast.success("Reply sent to user! ✅");

    } catch (error) {
        console.error(error);
        toast.error("Failed to send reply");
    }
  };

  const handleDeleteMessage = async (id) => {
    if(confirm("Delete this message?")) {
      await deleteDoc(doc(db, "contact_messages", id));
      await logAction(`Deleted a contact message`);
    }
  };

  // --- NEW: EDIT MATCH LOGIC ---
  const handleEditClick = (match) => {
    setForm(match);
    setIsEditMode(true);
    setEditMatchId(match.id);
    setActiveSection('create');
    toast('Edit Mode ON: Update details and click Update', { icon: '✏️' });
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    if (!editMatchId) return;

    try {
      await updateDoc(doc(db, "tournaments", editMatchId), form);
      await logAction(`Updated match details: ${form.title}`);
      
      setIsEditMode(false);
      setEditMatchId(null);
      setForm({
        title: '', category: 'BR', map: 'Bermuda', matchCount: 1, time: '', fee: '', type: 'Squad',
        headshotOnly: false, totalSlots: 48, filledSlots: 0,
        prizePool: '', rank1: '', rank2: '', rank3: '', perKill: '', status: 'Open',
        rules: '1. No Emulator allowed\n2. Screenshot mandatory\n3. ID/Pass 10 mins before start.' 
      });
      toast.success("Match Updated Successfully! ✅");
      setActiveSection('manage');
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    }
  };

// --- CANCEL MATCH LOGIC (With Refund QR Trigger) ---
const handleCancelMatch = async () => {
    if (!matchToDelete) return;

    // Safety Prompt
    const confirmCancel = window.confirm(`Are you sure you want to CANCEL "${matchToDelete.title}"? \nThis will ask all players to upload QR for Refund.`);
    if (!confirmCancel) return;

    const toastId = toast.loading("Cancelling Match & Enabling Refunds...");

    try {
        // 1. Is match ke saare Approved bookings dhundo
        const q = query(collection(db, "bookings"), where("tournamentId", "==", matchToDelete.id), where("status", "==", "approved"));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);

        // 2. Har user ka status 'refund_pending' karo (Taki wo QR daal sake)
        snapshot.forEach((docSnap) => {
            batch.update(doc(db, "bookings", docSnap.id), { 
                status: 'refund_pending', // ✅ Isse user ko QR upload ka option dikhega
                prizeAmount: matchToDelete.fee || 0, // ✅ Refund amount = Entry Fee
                adminMessage: "Match Cancelled. Please upload QR for refund."
            });
        });

        // 3. Match ka status 'Cancelled' karo
        batch.update(doc(db, "tournaments", matchToDelete.id), {
            status: 'Cancelled',
            slotList: [] // Slot list saaf kar do
        });

        await batch.commit();

        await logAction(`Cancelled match ${matchToDelete.title}. Refunds enabled for ${snapshot.size} players.`);
        toast.success(`Match Cancelled! ${snapshot.size} players can now claim refund via QR.`, { id: toastId });
        setShowDeleteModal(false);
        setMatchToDelete(null);

    } catch (error) {
        console.error("Cancel Error:", error);
        toast.error("Failed to cancel match.", { id: toastId });
    }
};
// --- FORCE DELETE FUNCTION (Missing Tha) ---
const processForceDelete = async () => {
    if (!matchToDelete) return;
    
    // Safety confirm
    const confirmDelete = window.confirm("⚠️ WARNING: This will permanently delete the match. Are you sure?");
    if (!confirmDelete) return;

    try {
        // 1. Delete Tournament Doc
        await deleteDoc(doc(db, "tournaments", matchToDelete.id));
        
        // 2. Log Action
        await logAction(`Force deleted match: ${matchToDelete.title} (ID: ${matchToDelete.id})`);
        
        toast.success("Match Deleted Permanently! 🗑️");
        setShowDeleteModal(false);
        setMatchToDelete(null);
    } catch (error) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete match.");
    }
};
// --- HANDLE PAYOUT / REFUND DONE ---
const handleMarkPaid = async (bookingId, userId, amount, isRefund = false) => {
    
    // ✅ पहले check करो कि user ने QR upload किया है या नहीं
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingDoc.exists()) {
        toast.error("Booking not found");
        return;
    }

    const bookingData = bookingDoc.data();
    
    if (!bookingData.userQr) {
        toast.error("User hasn't uploaded QR yet!");
        return;
    }

    // Agar Refund hai to status 'refund_paid' hoga, jeeta hai to 'paid'
    const newStatus = isRefund ? 'refund_paid' : 'paid'; 

    let proofUrl = "";
    if (payoutProof) {
        toast.loading("Uploading Proof...");
        proofUrl = await uploadToCloudinary(payoutProof);
        toast.dismiss();
    }

    try {
        await updateDoc(doc(db, "bookings", bookingId), {
            status: newStatus,
            paymentProof: proofUrl,
            paidAt: new Date(),
            paidBy: userName || 'Admin' // ✅ Yeh line add karo
        });

        // Notification bhejo
        await addDoc(collection(db, "notifications"), {
            userId: userId,
            title: isRefund ? "💸 REFUND SUCCESSFUL" : "💰 PRIZE PAID!",
            message: isRefund 
                ? `Your refund of ₹${amount} has been processed successfully.`
                : `Congrats! Your winning amount ₹${amount} has been paid.`,
            read: false,
            timestamp: new Date()
        });

        // ✅ User inbox में भी notification bhejo
        await addDoc(collection(db, "user_inbox"), {
            userId: userId,
            title: isRefund ? "💸 REFUND PROCESSED" : "💰 PAYMENT RECEIVED",
            message: isRefund 
                ? `Your refund of ₹${amount} has been sent to your UPI.`
                : `You received ₹${amount} for winning. Check your UPI app.`,
            type: 'announcement',
            timestamp: new Date(),
            read: false
        });

        await logAction(`Paid ₹${amount} (${isRefund ? 'Refund' : 'Prize'}) to User ${userId}`);
        setPayoutProof(null);
        toast.success(isRefund ? "Refund Marked as Paid! ✅" : "Prize Marked as Paid! ✅");

    } catch (error) {
        console.error(error);
        toast.error("Error updating status");
    }
};
  // --- G. ADMIN MANAGEMENT FUNCTIONS ---
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return toast.error("Only Owner can create new admins!");
    }
    
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      return toast.error("Please fill all fields!");
    }
    
    try {
      const q = query(collection(db, "admins"), where("email", "==", newAdmin.email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return toast.error("Admin with this email already exists!");
      }
      
      await addDoc(collection(db, "admins"), {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        role: 'sub_admin',
        createdAt: new Date()
      });
      
      await logAction(`Created new admin: ${newAdmin.name} (${newAdmin.email})`);
      
      setNewAdmin({ name: '', email: '', password: '' });
      setShowCreateAdminModal(false);
      toast.success("New Admin Created Successfully! ✅");
      
    } catch (err) {
      console.error("Error creating admin:", err);
      toast.error("Failed to create admin. Check console.");
    }
  };

  const handleDeleteAdmin = async (id, email) => {
    const user = auth.currentUser;
    
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return toast.error("Only Owner can delete admins!");
    }
    
    if (!window.confirm(`Are you sure you want to delete admin: ${email}?`)) return;
    
    try {
      await deleteDoc(doc(db, "admins", id));
      await logAction(`Deleted admin: ${email}`);
      toast.success("Admin deleted successfully!");
    } catch (err) {
      console.error("Error deleting admin:", err);
      toast.error("Failed to delete admin. Check console.");
    }
  };

  // --- H. TICKER & MISC ---
  const addTicker = async () => {
      if(!newTicker) return;
      await updateDoc(doc(db, "settings", "ticker"), { messages: arrayUnion(newTicker) })
            .catch(() => setDoc(doc(db, "settings", "ticker"), { messages: [newTicker] }));
      setNewTicker("");
      const snap = await getDoc(doc(db, "settings", "ticker"));
      if(snap.exists()) setTickers(snap.data().messages);
      
      await logAction(`Added ticker: ${newTicker.substring(0, 50)}...`);
  };
  
  const removeTicker = async (msg) => {
      await updateDoc(doc(db, "settings", "ticker"), { messages: arrayRemove(msg) });
      const snap = await getDoc(doc(db, "settings", "ticker"));
      if(snap.exists()) setTickers(snap.data().messages);
      
      await logAction(`Removed ticker: ${msg.substring(0, 50)}...`);
  };

  // --- Footer Stats Update ---
  const handleUpdateStats = async () => {
    try {
        await setDoc(doc(db, "settings", "footer_stats"), footerStats);
        toast.success("Footer Stats Updated Live! 🚀");
    } catch (error) {
        console.error(error);
        toast.error("Failed to update stats");
    }
  };

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setForm({ ...form, category: newCat, type: newCat === 'CS' ? '4v4' : 'Squad', totalSlots: newCat === 'CS' ? 2 : 48 });
  };
  
  const handleCreateBlog = async (e) => {
      e.preventDefault();
      if (!blogForm.title || !blogForm.content) return toast.error("Fill all details!");

      let imageUrl = "";
      if (blogImage) {
          toast.loading("Uploading Image...");
          imageUrl = await uploadToCloudinary(blogImage);
          toast.dismiss();
      }

      await addDoc(collection(db, "blogs"), {
          ...blogForm,
          image: imageUrl,
          timestamp: serverTimestamp()
      });

      setBlogForm({ title: '', category: 'News', content: '' });
      setBlogImage(null);
      toast.success("Blog Published! 📰");
  };

  const handleDeleteBlog = async (id) => {
      if(confirm("Delete this post?")) {
          await deleteDoc(doc(db, "blogs", id));
          toast.success("Blog Deleted!");
      }
  };

  // --- J. LEADERBOARD LOGIC ---
  const handleUpdateLeaderboard = async (e) => {
      e.preventDefault();
      await addDoc(collection(db, "leaderboard"), lbForm);
      setLbForm({ teamName: '', wins: 0, points: 0 });
      toast.success("Leaderboard Updated! 🏆");
  };

  const handleDeleteLbEntry = async (id) => {
      await deleteDoc(doc(db, "leaderboard", id));
      toast.success("Entry Removed");
  };

  // Show loading while checking role
  if (!userRole) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative font-sans text-sm text-gray-200 pb-20">
      
      {/* NAVBAR */}
      <div className="fixed top-0 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 z-50 px-4 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 text-white transition border border-white/10" 
                title="Go to Website"
              >
                  <Home size={20}/>
              </button>

              <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-600/20">
                <Swords size={20} className="text-white"/>
              </div>
              <div>
                  <h1 className="font-gaming text-lg text-white tracking-widest leading-none">ADMIN <span className="text-brand-green">PANEL</span></h1>
                  <p className="text-[9px] text-gray-500 font-mono uppercase">V 4.0 • {userName} • {userRole === 'super_admin' ? 'OWNER' : 'STAFF'}</p>
              </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                  { id: 'dashboard', icon: BarChart2, label: 'Dash' },
                  { id: 'create', icon: Plus, label: 'Create' },
                  { id: 'manage', icon: Layers, label: 'Manage' },
                  { id: 'bookings', icon: Bell, label: 'Requests', badge: pendingCount },
                  { id: 'payouts', icon: CreditCard, label: 'Payouts', badge: bookings.filter(b => b.status === 'processing' || b.status === 'won').length },
                  { id: 'messages', icon: MessageSquare, label: 'Support', badge: unreadMsgCount },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                  { id: 'leaderboard', icon: BarChart2, label: 'Leaderboard' },
                  { id: 'blog', icon: Megaphone, label: 'Blog CMS' },
                  ...(userRole === 'super_admin' ? [{ id: 'team', icon: Shield, label: 'Team' }] : []),
              ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border whitespace-nowrap ${
                        activeSection === item.id 
                        ? 'bg-brand-green text-black font-bold border-brand-green shadow-[0_0_15px_rgba(0,255,65,0.3)]' 
                        : 'bg-[#151515] border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                      <item.icon size={16}/>
                      <span className="hidden md:block">{item.label}</span>
                      {item.badge > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{item.badge}</span>}
                  </button>
              ))}
          </div>
      </div>

      <div className="max-w-7xl mx-auto pt-28 px-4">

        {/* --- DASHBOARD VIEW --- */}
        {activeSection === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:border-blue-500/50 transition duration-300">
                    <div className="bg-blue-500/10 p-4 rounded-full text-blue-500"><Layers size={32}/></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold">Total Matches</p><h2 className="text-4xl font-bold text-white">{tournaments.length}</h2></div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:border-yellow-500/50 transition duration-300">
                    <div className="bg-yellow-500/10 p-4 rounded-full text-yellow-500"><Bell size={32}/></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold">Pending Requests</p><h2 className="text-4xl font-bold text-white">{pendingCount}</h2></div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:border-purple-500/50 transition duration-300">
                    <div className="bg-purple-500/10 p-4 rounded-full text-purple-500"><MessageSquare size={32}/></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold">Messages</p><h2 className="text-4xl font-bold text-white">{messages.length}</h2></div>
                </div>
            </div>
        )}

        {/* --- VIEW: CREATE MATCH FORM --- */}
        {activeSection === 'create' && (
            <div className="max-w-3xl mx-auto bg-[#111] border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-transparent"></div>
                <h2 className="text-2xl font-gaming text-white mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
                   {isEditMode ? <Edit className="text-yellow-500"/> : <Plus className="text-brand-green"/>} 
                   {isEditMode ? "EDIT TOURNAMENT" : "LAUNCH NEW TOURNAMENT"}
                </h2>
                
                <form onSubmit={isEditMode ? handleUpdateMatch : handleSubmit} className="space-y-5">
                    
                    {/* 1. Game Mode & Format */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">Game Mode</label>
                            <select 
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-brand-green outline-none" 
                                value={form.category} 
                                onChange={(e) => {
                                    const newCat = e.target.value;
                                    setForm({ 
                                        ...form, 
                                        category: newCat, 
                                        type: newCat === 'CS' ? '4v4' : 'Squad', 
                                        totalSlots: newCat === 'CS' ? 2 : 48 
                                    });
                                }}
                            >
                                <option value="BR">Battle Royale (BR)</option>
                                <option value="CS">Clash Squad (CS)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">Format</label>
                            <select 
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-brand-green outline-none" 
                                value={form.type} 
                                onChange={e => setForm({...form, type: e.target.value})}
                            >
                                {form.category === 'CS' ? (
                                    <>
                                        <option value="1v1">1 vs 1</option>
                                        <option value="2v2">2 vs 2</option>
                                        <option value="3v3">3 vs 3</option>
                                        <option value="4v4">4 vs 4</option>
                                        <option value="6v6">6 vs 6</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Solo">Solo</option>
                                        <option value="Duo">Duo</option>
                                        <option value="Squad">Squad</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* 2. Map & Round Count */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">Map</label>
                            <select className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-brand-green outline-none" value={form.map} onChange={e => setForm({...form, map: e.target.value})}>
                                <option value="Bermuda">Bermuda</option>
                                <option value="Purgatory">Purgatory</option>
                                <option value="Alpine">Alpine</option>
                                <option value="Nexterra">Nexterra</option>
                                <option value="Kalahari">Kalahari</option>
                                <option value="Random">Random Map</option>
                                <option value="Random">Multiple Map</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">No. of Matches</label>
                            <select className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-brand-green outline-none" value={form.matchCount} onChange={e => setForm({...form, matchCount: Number(e.target.value)})}>
                                <option value="1">1 Match</option>
                                <option value="2">2 Matches (Back to Back)</option>
                                <option value="3">3 Matches (Bo3)</option>
                                <option value="4">4 Matches (Bo4)</option>
                                <option value="5">5 Matches (Bo5)</option>
                                <option value="6">6 Matches (Bo6)</option>
                            </select>
                        </div>
                    </div>

                    {/* 3. CS Special Toggle */}
                    {form.category === 'CS' && (
                        <div 
                            className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition px-4 ${form.headshotOnly ? 'bg-red-900/20 border-red-500' : 'bg-black border-white/20'}`} 
                            onClick={() => setForm({...form, headshotOnly: !form.headshotOnly})}
                        >
                            <span className="font-bold text-white flex items-center gap-2">
                                <Skull size={16} className={form.headshotOnly ? 'text-red-500' : 'text-gray-500'}/> 
                                HEADSHOT ONLY MODE
                            </span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.headshotOnly ? 'bg-red-500' : 'bg-gray-700'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.headshotOnly ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    )}

                    {/* 4. Title & Time */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">Match Title</label>
                            <input type="text" placeholder="Ex: Daily Scrims #50" className="bg-black border border-white/20 rounded-lg p-3 text-white w-full focus:border-brand-green outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 mb-1 block">Start Date & Time</label>
                            <input 
                                type="datetime-local" 
                                className="bg-black border border-white/20 rounded-lg p-3 text-white w-full focus:border-brand-green outline-none font-mono" 
                                value={form.time} 
                                onChange={e => setForm({...form, time: e.target.value})}
                            />
                        </div>  
                    </div>

                    {/* 5. Slots & Fees Configuration */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-brand-green uppercase tracking-wider">Configuration</span></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="text-[10px] text-gray-500 block mb-1">TOTAL SLOTS</label><input type="number" className="w-full bg-black border border-white/20 rounded p-2 text-white" value={form.totalSlots} onChange={e => setForm({...form, totalSlots: Number(e.target.value)})}/></div>
                            <div><label className="text-[10px] text-gray-500 block mb-1">ENTRY FEE ₹</label><input type="number" className="w-full bg-black border border-white/20 rounded p-2 text-white" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})}/></div>
                            <div><label className="text-[10px] text-gray-500 block mb-1">PRIZE POOL ₹</label><input type="number" className="w-full bg-black border border-white/20 rounded p-2 text-white" value={form.prizePool} onChange={e => setForm({...form, prizePool: e.target.value})}/></div>
                        </div>
                        
                        {/* BR Prize Distribution */}
                        {form.category === 'BR' && (
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                                <input type="number" placeholder="#1 Prize" className="bg-black border border-yellow-500/50 rounded p-2 text-white text-xs" value={form.rank1} onChange={e => setForm({...form, rank1: e.target.value})}/>
                                <input type="number" placeholder="#2 Prize" className="bg-black border border-gray-500/50 rounded p-2 text-white text-xs" value={form.rank2} onChange={e => setForm({...form, rank2: e.target.value})}/>
                                <input type="number" placeholder="#3 Prize" className="bg-black border border-orange-500/50 rounded p-2 text-white text-xs" value={form.rank3} onChange={e => setForm({...form, rank3: e.target.value})}/>
                            </div>
                        )}
                        <input type="number" placeholder="Per Kill Prize ₹" className="w-full bg-black border border-white/20 rounded p-2 text-white text-xs" value={form.perKill} onChange={e => setForm({...form, perKill: e.target.value})}/>
                    </div>

                    {/* 6. Rules */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-xs font-bold text-gray-400 mb-2 block flex items-center gap-2"><Settings size={12}/> MATCH RULES</label>
                        <textarea className="w-full h-24 bg-black border border-white/20 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-green outline-none" value={form.rules} onChange={e => setForm({...form, rules: e.target.value})}></textarea>
                    </div>

                    <button className={`w-full font-bold py-4 rounded-xl hover:bg-white transition text-lg shadow-lg flex items-center justify-center gap-2 ${isEditMode ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-brand-green text-black shadow-brand-green/20'}`}>
                      {isEditMode ? "UPDATE MATCH DETAILS 🔄" : "LAUNCH TOURNAMENT 🚀"}
                    </button>
                    {isEditMode && (
                        <button type="button" onClick={()=>{
                            setIsEditMode(false); 
                            setForm({
                                title: '', category: 'BR', map: 'Bermuda', matchCount: 1, time: '', fee: '', type: 'Squad',
                                headshotOnly: false, totalSlots: 48, filledSlots: 0,
                                prizePool: '', rank1: '', rank2: '', rank3: '', perKill: '', status: 'Open',
                                rules: '1. No Emulator allowed\n2. Screenshot mandatory\n3. ID/Pass 10 mins before start.' 
                            }); 
                            setActiveSection('manage');
                        }} className="w-full text-gray-500 mt-2 text-sm">Cancel Edit</button>
                    )}
                </form>
            </div>
        )}

        {/* --- MANAGE MATCHES VIEW --- */}
        {activeSection === 'manage' && (
            <div className="space-y-4">
                {tournaments.length === 0 && <p className="text-center text-gray-500 py-10">No matches found.</p>}
                {tournaments.map((match) => (
                    <div key={match.id} className="bg-[#111] border border-white/10 p-6 rounded-xl flex flex-col xl:flex-row gap-6 items-start xl:items-center group hover:border-brand-green/30 transition-all">
                        <div className="flex-1 w-full">
                            <div className="flex gap-2 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${match.status === 'Completed' ? 'bg-red-500/20 text-red-500' : match.status === 'ID Released' ? 'bg-green-500/20 text-green-500 animate-pulse' : 'bg-blue-500/20 text-blue-500'}`}>{match.status || 'OPEN'}</span>
                                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">{match.category} • {match.type}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white font-gaming tracking-wide">{match.title}</h3>
                            <div className="flex gap-6 text-sm text-gray-400 mt-2">
                                <span className="flex items-center gap-1"><Map size={14}/> {match.map}</span>
                                <span className="text-brand-green font-bold flex items-center gap-1"><Users size={14}/> {match.filledSlots}/{match.totalSlots} Slots</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full xl:w-auto">
                            <button onClick={() => { setSelectedMatch(match); setSlotListInput(match.slotList ? match.slotList.join('\n') : ''); setShowSlotModal(true); }} className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded hover:bg-blue-500/20 hover:text-blue-400 border border-white/5 transition"><List size={20} className="mb-1"/><span className="text-[10px] font-bold">SLOT LIST</span></button>
                            <button onClick={() => { setSelectedMatch(match); setRoomDetails({roomId: match.roomId, password: match.password}); setShowIdModal(true); }} className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded hover:bg-brand-green/20 hover:text-brand-green border border-white/5 transition"><Key size={20} className="mb-1"/><span className="text-[10px] font-bold">ID/PASS</span></button>
                            <button onClick={() => { setSelectedMatch(match); setShowResultModal(true); }} className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded hover:bg-yellow-500/20 hover:text-yellow-400 border border-white/5 transition"><ImageIcon size={20} className="mb-1"/><span className="text-[10px] font-bold">RESULTS</span></button>
                            <button onClick={() => handleEditClick(match)} className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded hover:bg-blue-500/20 hover:text-blue-400 border border-white/5 transition"><Edit size={20} className="mb-1"/><span className="text-[10px] font-bold">EDIT</span></button>
                            <button onClick={() => { setMatchToDelete(match); setShowDeleteModal(true); }} className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded hover:bg-red-500/20 hover:text-red-500 border border-white/5 transition"><Trash2 size={20} className="mb-1"/><span className="text-[10px] font-bold">DELETE</span></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- BOOKING REQUESTS VIEW --- */}
        {activeSection === 'bookings' && (
            <div className="max-w-6xl mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[60vh]">
                <div className="p-5 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><Bell className="text-brand-green"/> BOOKING MANAGEMENT</h3>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setBookingTab('pending')} 
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${bookingTab === 'pending' ? 'bg-brand-green text-black' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                        >
                            PENDING ({bookings.filter(b => b.status === 'pending').length})
                        </button>
                        <button 
                            onClick={() => setBookingTab('approved')} 
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${bookingTab === 'approved' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                        >
                            ACTIVE SLOTS ({bookings.filter(b => b.status === 'approved').length})
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {bookings
                        .filter(b => bookingTab === 'pending' ? b.status === 'pending' : b.status === 'approved')
                        .length === 0 ? (
                            <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                                <CheckCircle size={40} className="mb-2 text-gray-700"/>
                                <p>No {bookingTab} bookings found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-500 border-b border-white/10 bg-black/40">
                                        <th className="p-5">PLAYER DETAILS</th>
                                        <th className="p-5">MATCH INFO</th>
                                        <th className="p-5">PAYMENT PROOF</th>
                                        <th className="p-5">STATUS</th>
                                        <th className="p-5 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings
                                        .filter(b => bookingTab === 'pending' ? b.status === 'pending' : b.status === 'approved')
                                        .map((booking) => (
                                        <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="p-5">
                                                <p className="font-bold text-white text-base">{booking.playerName}</p>
                                                <p className="text-xs text-gray-500 font-mono">{booking.whatsapp}</p>
                                                <p className="text-xs text-gray-600 mt-1">User ID: {booking.userId?.substring(0, 8)}...</p>
                                                
                                                {booking.adminMessage && bookingTab === 'approved' && (
                                                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                                                        <p className="text-blue-400 text-xs font-bold">Sent Message:</p>
                                                        <p className="text-white text-xs">"{booking.adminMessage}"</p>
                                                        {booking.messageTime && (
                                                            <p className="text-gray-500 text-[10px]">
                                                                {new Date(booking.messageTime?.seconds * 1000).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            <td className="p-5">
                                                <span className="bg-white/10 text-gray-300 px-3 py-1 rounded text-xs font-mono block mb-1">
                                                    Match ID: {booking.tournamentId?.slice(0,5) || 'N/A'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(booking.createdAt?.seconds * 1000).toLocaleString()}
                                                </span>
                                            </td>
                                            
                                            <td className="p-5">
                                                <a href={booking.screenshotUrl} target="_blank" rel="noreferrer" 
                                                   className="flex items-center gap-2 text-blue-400 hover:text-white transition text-xs font-bold bg-blue-500/10 px-3 py-1 rounded w-fit border border-blue-500/20">
                                                    <Eye size={14}/> VIEW SCREENSHOT
                                                </a>
                                            </td>
                                            
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded text-xs font-bold ${booking.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                    {booking.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            
                                            <td className="p-5 text-right">
                                                {bookingTab === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleBookingAction(booking, 'reject')} 
                                                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded font-bold hover:bg-red-500 hover:text-white transition text-xs">
                                                            REJECT
                                                        </button>
                                                        <button onClick={() => handleBookingAction(booking, 'approve')} 
                                                                className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded font-bold hover:bg-green-500 hover:text-black transition text-xs">
                                                            APPROVE
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <button onClick={() => setSelectedBookingId(selectedBookingId === booking.id ? null : booking.id)} 
                                                                className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2">
                                                            <MessageSquare size={14}/> MESSAGE USER
                                                        </button>
                                                        
                                                        {selectedBookingId === booking.id && (
                                                            <div className="mt-2 flex gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    className="flex-1 bg-black border border-white/20 text-white text-xs p-2 rounded"
                                                                    placeholder="Room ID/Password or any note..."
                                                                    value={messageText}
                                                                    onChange={(e) => setMessageText(e.target.value)}
                                                                />
                                                                <button onClick={() => handleSendMessage(booking.id)} 
                                                                        className="bg-brand-green text-black px-3 py-2 rounded text-xs font-bold hover:bg-white">
                                                                    SEND
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex gap-2 mt-1">
                                                            <button onClick={() => handleUpdateStatus(booking.id, 'completed')} 
                                                                    className="flex-1 bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded text-xs hover:bg-purple-600 hover:text-white">
                                                                MARK COMPLETE
                                                            </button>
                                                            <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} 
                                                                    className="flex-1 bg-red-600/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs hover:bg-red-600 hover:text-white">
                                                                CANCEL
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                </div>
            </div>
        )}

        {/* --- MESSAGES (SUPPORT) VIEW --- */}
        {activeSection === 'messages' && (
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[60vh]">
                <div className="p-5 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><MessageSquare className="text-purple-500"/> SUPPORT MESSAGES</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {messages.length === 0 && <p className="text-center text-gray-500 py-10">No messages yet.</p>}
                    {messages.map((msg) => (
                        <div key={msg.id} className="p-5 hover:bg-white/5 transition flex flex-col md:flex-row gap-4 justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold">{msg.name}</span>
                                    <span className="text-xs text-gray-500 bg-white/10 px-2 rounded">{msg.email}</span>
                                    <span className="text-[10px] text-gray-600">{msg.timestamp?.toDate().toLocaleString()}</span>
                                    {msg.status === 'replied' && <span className="text-[9px] bg-green-500/10 text-green-500 px-1 rounded border border-green-500/20">REPLIED</span>}
                                </div>
                                <p className="text-gray-300 text-sm mt-2 bg-black/30 p-3 rounded border border-white/5">{msg.message}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setSelectedMessage(msg); setShowReplyModal(true); }} className="bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-2 rounded text-xs font-bold transition flex items-center gap-1"><Send size={14}/> REPLY</button>
                                <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- NEW: PAYOUTS VIEW --- */}
{activeSection === 'payouts' && (
    <div className="max-w-6xl mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[60vh]">
        <div className="p-5 bg-white/5 border-b border-white/10">
            <h3 className="font-bold text-white text-lg flex items-center gap-2"><CreditCard className="text-yellow-500"/> PAYOUTS & REFUNDS</h3>
            <p className="text-gray-500 text-sm">Process winnings and refunds here</p>
            {/* Tabs for Winnings vs Refunds */}
<div className="flex gap-2 mt-3">
    <button 
        onClick={() => setBookingTab('winnings')} 
        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            bookingTab === 'winnings' 
            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
            : 'bg-white/10 text-gray-400 hover:text-white'
        }`}
    >
        WINNINGS ({bookings.filter(b => b.status === 'won').length})
    </button>
    <button 
        onClick={() => setBookingTab('refunds')} 
        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            bookingTab === 'refunds' 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
            : 'bg-white/10 text-gray-400 hover:text-white'
        }`}
    >
        REFUNDS ({bookings.filter(b => b.status === 'refund_pending').length})
    </button>
    </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="text-xs text-gray-500 border-b border-white/10 bg-black/40">
                    <tr>
                        <th className="p-5">PLAYER</th>
                        <th className="p-5">AMOUNT</th>
                        <th className="p-5">USER QR</th>
                        <th className="p-5 text-right">ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Updated Filter Logic */}
                    {bookings.filter(b => ['won', 'processing', 'paid', 'refund_processing', 'refund_paid'].includes(b.status)).length === 0 && (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-gray-500">
                                No payouts or refunds pending.
                            </td>
                        </tr>
                    )}
                    
                    {/* Updated Map Logic with Tags */}
                    {bookings
                        .filter(b => ['won', 'processing', 'paid', 'refund_processing', 'refund_paid'].includes(b.status))
                        .map((b) => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-5">
                                <p className="font-bold text-white">{b.playerName}</p>
                                <p className="text-xs text-gray-500">Match ID: {b.tournamentId?.slice(0,8)}</p>
                                {/* Tag dikhao ki ye Winning hai ya Refund */}
                                {b.status.includes('refund') ? (
                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded mt-1 inline-block">REFUND</span>
                                ) : (
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mt-1 inline-block">WINNING</span>
                                )}
                            </td>
                            <td className="p-5 text-green-400 font-bold font-mono">₹{b.prizeAmount || 0}</td>
                            <td className="p-5">
                                {b.userQr ? (
                                    <a href={b.userQr} target="_blank" rel="noreferrer" className="text-blue-400 text-xs flex items-center gap-1 underline">
                                        <Eye size={12}/> View QR
                                    </a>
                                ) : <span className="text-gray-600 text-xs">Waiting for User QR...</span>}
                            </td>
                            <td className="p-5 text-right">
                                {(b.status === 'paid' || b.status === 'refund_paid') ? (
                                    <span className="text-green-500 text-xs border border-green-500/20 px-2 py-1 rounded">
                                        PAID ✅
                                    </span>
                                ) : (
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                onChange={e => setPayoutProof(e.target.files[0])} 
                                                className="w-20 text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-gray-800 file:text-white"
                                            />
                                        </div>
                                       <button 
                                        onClick={() => handleMarkPaid(b.id, b.userId, b.prizeAmount, b.status.includes('refund'))} disabled={!b.userQr} // 👈 YE LINE ZARURI HAI (Button Disable agar QR nahi hai)
                                        className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${ !b.userQr 
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' // Disabled Style
        : 'bg-yellow-500 text-black hover:bg-white' // Active Style
    }`}
>
    {!b.userQr ? (
        <>⏳ WAIT FOR QR</> 
    ) : (
        <>✅ MARK PAID</>
    )}
</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}
        {/* --- SETTINGS VIEW --- */}
        {activeSection === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8">
              
              <div className="bg-[#111] border border-white/10 p-8 rounded-2xl shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xl">
                      <Megaphone size={24} className="text-brand-green"/> LIVE TICKER MANAGER
                  </h3>
                  <div className="flex gap-3 mb-6">
                      <input 
                          type="text" 
                          className="flex-1 bg-black border border-white/20 rounded-lg p-3 text-white outline-none focus:border-brand-green" 
                          placeholder="Type new announcement..." 
                          value={newTicker} 
                          onChange={e => setNewTicker(e.target.value)}
                      />
                      <button onClick={addTicker} className="bg-brand-green text-black px-6 font-bold rounded-lg hover:bg-white transition">ADD</button>
                  </div>
                  <div className="space-y-2">
                      {tickers.map((msg, idx) => (
                          <div key={idx} className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/5 group hover:border-brand-green/30">
                              <span className="text-gray-300 text-sm">{msg}</span>
                              <button onClick={() => removeTicker(msg)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-[#111] border border-white/10 p-8 rounded-2xl shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xl">
                      <BarChart2 size={24} className="text-blue-500"/> FOOTER STATS CONTROL
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Trusted Users</label>
                          <input 
                              value={footerStats.users} 
                              onChange={e => setFooterStats({...footerStats, users: e.target.value})} 
                              className="bg-black border border-white/20 p-3 rounded-lg text-white w-full outline-none focus:border-blue-500"
                              placeholder="e.g. 15K+"
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Total Visits</label>
                          <input 
                              value={footerStats.visits} 
                              onChange={e => setFooterStats({...footerStats, visits: e.target.value})} 
                              className="bg-black border border-white/20 p-3 rounded-lg text-white w-full outline-none focus:border-blue-500"
                              placeholder="e.g. 1M+"
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Prize Distributed</label>
                          <input 
                              value={footerStats.prize} 
                              onChange={e => setFooterStats({...footerStats, prize: e.target.value})} 
                              className="bg-black border border-white/20 p-3 rounded-lg text-white w-full outline-none focus:border-blue-500"
                              placeholder="e.g. ₹5L+"
                          />
                      </div>
                  </div>
                  <button 
                      onClick={handleUpdateStats} 
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                  >
                      UPDATE LIVE SITE STATS ⚡
                  </button>
              </div>
          </div>
        )}

        {/* --- BLOG CMS VIEW --- */}
        {activeSection === 'blog' && (
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Megaphone size={18} className="text-brand-green"/> WRITE NEW POST</h3>
                <form onSubmit={handleCreateBlog} className="space-y-4">
                   <input type="text" placeholder="Blog Title" className="w-full bg-black border border-white/20 p-3 rounded text-white focus:border-brand-green outline-none" value={blogForm.title} onChange={e=>setBlogForm({...blogForm, title: e.target.value})} />
                   <select className="w-full bg-black border border-white/20 p-3 rounded text-white outline-none" value={blogForm.category} onChange={e=>setBlogForm({...blogForm, category: e.target.value})}>
                      <option>News</option><option>Highlight</option><option>Update</option>
                   </select>
                   <textarea placeholder="Write content here..." className="w-full h-32 bg-black border border-white/20 p-3 rounded text-white focus:border-brand-green outline-none" value={blogForm.content} onChange={e=>setBlogForm({...blogForm, content: e.target.value})}></textarea>
                   <div className="bg-black border border-dashed border-white/20 p-3 rounded text-center relative cursor-pointer hover:border-brand-green">
                        <span className="text-xs text-gray-500">{blogImage ? blogImage.name : "Click to Upload Cover Image"}</span>
                        <input type="file" onChange={e => setBlogImage(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                   </div>
                   <button className="bg-brand-green text-black font-bold w-full py-3 rounded hover:bg-white transition">PUBLISH POST</button>
                </form>
             </div>
             <div className="bg-[#111] p-6 rounded-xl border border-white/10 h-[500px] overflow-y-auto">
                <h3 className="text-white font-bold mb-4">📚 MANAGED POSTS</h3>
                {blogs.length === 0 && <p className="text-gray-600 text-xs">No blogs posted yet.</p>}
                {blogs.map(b => (
                   <div key={b.id} className="flex justify-between items-center bg-black p-3 mb-2 rounded border border-white/10 group hover:border-brand-green/30">
                      <div className="flex gap-3 items-center">
                          {b.image && <img src={b.image} alt="" className="w-10 h-10 object-cover rounded"/>}
                          <div>
                              <p className="text-white text-sm font-bold truncate w-40">{b.title}</p>
                              <p className="text-[10px] text-gray-500">{new Date(b.timestamp?.seconds * 1000).toLocaleDateString()}</p>
                          </div>
                      </div>
                      <button onClick={() => handleDeleteBlog(b.id)} className="text-gray-600 hover:text-red-500 transition"><Trash2 size={16}/></button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* --- LEADERBOARD VIEW --- */}
        {activeSection === 'leaderboard' && (
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-yellow-500"/> UPDATE STANDINGS</h3>
                <form onSubmit={handleUpdateLeaderboard} className="space-y-4">
                   <input type="text" placeholder="Team Name" className="w-full bg-black border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none" value={lbForm.teamName} onChange={e=>setLbForm({...lbForm, teamName: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Total Wins" className="bg-black border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none" value={lbForm.wins} onChange={e=>setLbForm({...lbForm, wins: Number(e.target.value)})} />
                      <input type="number" placeholder="Total Points" className="bg-black border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none" value={lbForm.points} onChange={e=>setLbForm({...lbForm, points: Number(e.target.value)})} />
                   </div>
                   <button className="bg-yellow-500 text-black font-bold w-full py-3 rounded hover:bg-white transition">ADD TEAM ENTRY</button>
                </form>
             </div>
             <div className="bg-[#111] p-6 rounded-xl border border-white/10 h-[500px] overflow-y-auto">
                <h3 className="text-white font-bold mb-4">🏆 CURRENT RANKINGS</h3>
                {leaderboard.map((team, idx) => (
                   <div key={team.id} className="flex justify-between items-center bg-black p-3 mb-2 rounded border border-white/10 group hover:border-yellow-500/30">
                      <div className="flex items-center gap-4">
                          <span className={`font-bold text-lg w-8 text-center ${idx < 3 ? 'text-yellow-500' : 'text-gray-600'}`}>#{idx+1}</span>
                          <div>
                              <p className="text-white text-sm font-bold">{team.teamName}</p>
                              <p className="text-[10px] text-gray-500">{team.wins} Booyahs</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <p className="text-brand-green text-sm font-bold">{team.points} Pts</p>
                          <button onClick={() => handleDeleteLbEntry(team.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* ================= MODALS ================= */}
        
        {/* 1. SLOT LIST MODAL */}
        {showSlotModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <div className="bg-[#111] border border-white/20 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between mb-4 border-b border-white/10 pb-2"><h3 className="font-bold text-white flex items-center gap-2"><List className="text-brand-green"/> SLOT LIST</h3><button onClick={() => setShowSlotModal(false)}><X className="text-gray-500 hover:text-white"/></button></div>
                    <textarea className="w-full h-64 bg-black border border-white/10 rounded p-4 text-white font-mono text-sm resize-none focus:border-brand-green outline-none" value={slotListInput} onChange={e => setSlotListInput(e.target.value)} placeholder={`Slot 1: Team Name\nSlot 2: ...`}></textarea>
                    <button onClick={saveSlotList} className="w-full mt-4 bg-brand-green text-black font-bold py-3 rounded hover:bg-white transition">SAVE LIST & NOTIFY 🔔</button>
                </div>
            </div>
        )}

        {/* 2. RESULT MODAL (UPDATED) */}
{showResultModal && (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
        <div className="bg-[#111] border border-white/20 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ImageIcon className="text-yellow-500"/> DECLARE WINNERS</h3>
            
            {/* Registered Teams Dropdown Logic */}
            <div className="mb-4 space-y-3 bg-white/5 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Select Winners from Slot List</p>
                
                {selectedMatch?.slotList && selectedMatch.slotList.length > 0 ? (
                    <>
                        {selectedMatch?.category === 'BR' ? (
                            <>
                                <select className="w-full bg-black border border-yellow-500/50 p-2 rounded text-white text-xs mb-2" value={winners.rank1} onChange={e => setWinners({...winners, rank1: e.target.value})}>
                                    <option value="">Select Rank #1 (Winner)</option>
                                    {selectedMatch.slotList.map((team, i) => <option key={i} value={team}>{team}</option>)}
                                </select>

                                <select className="w-full bg-black border border-gray-500/50 p-2 rounded text-white text-xs mb-2" value={winners.rank2} onChange={e => setWinners({...winners, rank2: e.target.value})}>
                                    <option value="">Select Rank #2 (Runner Up)</option>
                                    <option value="None">None</option>
                                    {selectedMatch.slotList.map((team, i) => <option key={i} value={team}>{team}</option>)}
                                </select>

                                <select className="w-full bg-black border border-orange-500/50 p-2 rounded text-white text-xs" value={winners.rank3} onChange={e => setWinners({...winners, rank3: e.target.value})}>
                                    <option value="">Select Rank #3</option>
                                    <option value="None">None</option>
                                    {selectedMatch.slotList.map((team, i) => <option key={i} value={team}>{team}</option>)}
                                </select>
                            </>
                        ) : (
                            <select className="w-full bg-black border border-brand-green p-2 rounded text-white text-xs" value={csWinner} onChange={e => setCsWinner(e.target.value)}>
                                <option value="">Select Winning Team</option>
                                {selectedMatch.slotList.map((team, i) => <option key={i} value={team}>{team}</option>)}
                            </select>
                        )}
                    </>
                ) : (
                    <p className="text-red-500 text-xs">⚠ No teams registered in slot list yet.</p>
                )}
            </div>
            {/* Image Uploads (Existing) */}
            <div className="space-y-2">
                <div className="bg-black border border-dashed border-white/20 p-2 rounded text-center cursor-pointer relative">
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPtFile(e.target.files[0])}/>
                     <p className="text-gray-400 text-[10px]">{ptFile ? ptFile.name : "Upload Points Table (Img)"}</p>
                </div>
                <div className="bg-black border border-dashed border-white/20 p-2 rounded text-center cursor-pointer relative">
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setGfxFile(e.target.files[0])}/>
                     <p className="text-gray-400 text-[10px]">{gfxFile ? gfxFile.name : "Upload Winner Poster (Img)"}</p>
                </div>
            </div>

            <button onClick={handleDeclareResult} disabled={isUploading} className="w-full bg-yellow-500 text-black font-bold py-3 rounded mt-4 hover:bg-white transition flex items-center justify-center gap-2">
                {isUploading ? "PROCESSING..." : "DECLARE WINNERS & CLOSE"}
            </button>
            <button onClick={() => setShowResultModal(false)} className="w-full text-gray-500 text-xs text-center py-2 hover:text-white">Cancel</button>
        </div>
    </div>
)}

        {/* 3. ID/PASS MODAL */}
        {showIdModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <div className="bg-[#111] border border-white/20 w-full max-w-sm rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2"><Key className="text-brand-green"/> ROOM DETAILS</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-gray-500 font-bold ml-1">ROOM ID</label><input type="text" className="w-full bg-black border border-white/10 rounded p-3 text-white font-mono focus:border-brand-green outline-none" value={roomDetails.roomId} onChange={e => setRoomDetails({...roomDetails, roomId: e.target.value})}/></div>
                        <div><label className="text-xs text-gray-500 font-bold ml-1">PASSWORD</label><input type="text" className="w-full bg-black border border-white/10 rounded p-3 text-white font-mono focus:border-brand-green outline-none" value={roomDetails.password} onChange={e => setRoomDetails({...roomDetails, password: e.target.value})}/></div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowIdModal(false)} className="flex-1 bg-gray-800 text-white py-3 rounded font-bold hover:bg-gray-700">CANCEL</button>
                            <button onClick={saveIdPass} className="flex-1 bg-brand-green text-black py-3 rounded font-bold hover:bg-white">RELEASE & NOTIFY</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 4. PERSONAL NOTIFY MODAL */}
        {showNotifyModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <div className="bg-[#111] border border-white/20 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Bell className="text-blue-500"/> Message Player</h3>
                    <textarea className="w-full bg-black border border-white/10 rounded p-3 text-white mb-3 focus:border-blue-500 outline-none" rows="3" placeholder="Write message..." value={customMsg} onChange={e => setCustomMsg(e.target.value)}></textarea>
                    <div className="flex gap-2">
                        <button onClick={() => setShowNotifyModal(false)} className="flex-1 bg-gray-800 text-white py-2 rounded font-bold text-xs hover:bg-gray-700">CANCEL</button>
                        <button onClick={async () => { 
                            if(customMsg) {
                                await addDoc(collection(db, "notifications"), { userId: selectedPlayer.userId, title: "Admin Message 🛡️", message: customMsg, read: false, timestamp: new Date() });
                                await logAction(`Sent personal message to ${selectedPlayer.playerName}`);
                                setShowNotifyModal(false); setCustomMsg(""); alert("Sent!");
                            }
                        }} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-xs hover:bg-blue-500">SEND</button>
                    </div>
                </div>
            </div>
        )}

        {/* 5. REPLY MODAL */}
        {showReplyModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <div className="bg-[#111] border border-white/20 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Send size={18} className="text-purple-500"/> Reply to {selectedMessage?.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">This will send a notification to their Dashboard.</p>
                    <textarea className="w-full bg-black border border-white/10 rounded p-3 text-white mb-3 focus:border-purple-500 outline-none h-24" placeholder="Type reply..." value={replyText} onChange={e => setReplyText(e.target.value)}></textarea>
                    <div className="flex gap-2">
                        <button onClick={() => setShowReplyModal(false)} className="flex-1 bg-gray-800 text-white py-2 rounded font-bold text-xs hover:bg-gray-700">CANCEL</button>
                        <button onClick={handleReplyToMessage} className="flex-1 bg-purple-600 text-white py-2 rounded font-bold text-xs hover:bg-purple-500">SEND REPLY</button>
                    </div>
                </div>
            </div>
        )}

        {/* 6. CANCEL & DELETE MODAL */}
{showDeleteModal && matchToDelete && (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 backdrop-blur-md">
        <div className="bg-[#1a1a1a] border border-red-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-2 text-xl flex items-center gap-2"><Trash2 className="text-red-500"/> MANAGE MATCH</h3>
            <p className="text-gray-400 text-sm mb-6">Match: <span className="text-white font-bold">{matchToDelete.title}</span></p>
            
            <div className="flex flex-col gap-3">
                {/* CANCEL BUTTON */}
                <button onClick={handleCancelMatch} className="bg-orange-500 text-black py-3 rounded-lg font-bold hover:bg-orange-400 flex items-center justify-center gap-2">
                    🚫 CANCEL & ENABLE REFUNDS
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded">QR System</span>
                </button>
                
                {/* FORCE DELETE BUTTON */}
                <button onClick={processForceDelete} className="bg-red-600/20 text-red-500 border border-red-500/50 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white">
                    🗑️ FORCE DELETE (NO REFUND)
                </button>

                <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 text-sm mt-2 hover:text-white">Close</button>
            </div>
        </div>
    </div>
)}

      </div>
    </div>
  );
};

export default Admin;
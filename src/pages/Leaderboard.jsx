import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Trophy, Crown, Medal, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase se data fetch karo (Points ke hisaab se sort karke)
    const q = query(collection(db, "leaderboard"), orderBy("points", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-gaming text-white mb-4">WEEKLY <span className="text-brand-green">LEGENDS</span></h1>
            <p className="text-gray-500 uppercase tracking-widest text-sm">Top performing teams of the week</p>
        </div>

        {/* LOADING STATE */}
        {loading && <div className="text-center text-gray-500 py-10">Loading Standings...</div>}

        {/* EMPTY STATE */}
        {!loading && teams.length === 0 && (
            <div className="text-center border border-white/10 rounded-2xl p-10 bg-[#111]">
                <Trophy size={48} className="mx-auto text-gray-600 mb-4"/>
                <p className="text-gray-400">Leaderboard updates coming soon!</p>
            </div>
        )}

        {/* LEADERBOARD LIST */}
        <div className="space-y-3">
            {teams.map((team, index) => (
                <div key={team.id} className={`relative flex items-center justify-between p-4 md:p-6 rounded-xl border transition-all hover:scale-[1.01] ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : index === 1 ? 'bg-gray-400/10 border-gray-400/50' : index === 2 ? 'bg-orange-700/10 border-orange-700/50' : 'bg-[#111] border-white/10 hover:border-brand-green/30'}`}>
                    
                    {/* Rank & Name */}
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="flex items-center justify-center w-12 h-12">
                            {index === 0 ? <Crown size={32} className="text-yellow-500 fill-yellow-500 animate-pulse"/> : 
                             index === 1 ? <Medal size={28} className="text-gray-400"/> :
                             index === 2 ? <Medal size={28} className="text-orange-700"/> :
                             <span className="text-xl font-bold text-gray-600">#{index + 1}</span>}
                        </div>
                        <div>
                            <h3 className={`text-lg md:text-xl font-bold ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>{team.teamName}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Shield size={12}/> <span className="uppercase tracking-wider">Professional Team</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 md:gap-12 text-right">
                        <div className="hidden md:block">
                            <p className="text-xs text-gray-500 uppercase font-bold">Booyahs</p>
                            <p className="text-white font-mono text-lg">{team.wins}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Pts</p>
                            <p className="text-brand-green font-mono text-2xl font-bold">{team.points}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Leaderboard;
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Calendar, User, ArrowRight, Newspaper } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-gaming text-white mb-4">NEWS & <span className="text-brand-green">UPDATES</span></h1>
            <p className="text-gray-500">Latest announcements from the 9T9 Esports Universe</p>
         </div>

         {loading && <div className="text-center text-gray-500">Loading News...</div>}

         {!loading && posts.length === 0 && (
             <div className="text-center py-20 bg-[#111] rounded-2xl border border-white/10">
                 <Newspaper size={48} className="mx-auto text-gray-600 mb-4"/>
                 <p className="text-gray-400">No news posted yet.</p>
             </div>
         )}

         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
                <div key={post.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden group hover:border-brand-green/50 transition-all hover:-translate-y-1 duration-300">
                    {/* Image */}
                    <div className="h-48 overflow-hidden bg-gray-900 relative">
                        {post.image ? (
                            <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700 bg-[#111]"><Newspaper size={40}/></div>
                        )}
                        <div className="absolute top-4 left-4 bg-brand-green text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {post.category || 'News'}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleDateString() : 'Today'}</span>
                            <span className="flex items-center gap-1"><User size={12}/> Admin</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-brand-green transition line-clamp-2">{post.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">{post.content}</p>
                        
                        <button className="text-brand-green text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                            Read Full Story <ArrowRight size={14}/>
                        </button>
                    </div>
                </div>
            ))}
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
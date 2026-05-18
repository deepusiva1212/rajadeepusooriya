import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export default function Blog({ isDashboardMode = false, role = "" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [newPost, setNewPost] = useState({ title: "", excerpt: "", content: "", category: "Marketing", brand: "General", imageUrl: "" });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        dateStr: d.data().createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || "Recent" 
      })));
    } catch (e) {
      console.error("Failed to fetch blog posts", e);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        ...newPost,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "blog"), postData);
      // Reload posts to fetch authentic timestamps
      fetchPosts();
      setNewPost({ title: "", excerpt: "", content: "", category: "Marketing", brand: "General", imageUrl: "" });
      alert("Article published live to home page!");
    } catch (error) {
      alert("Failed to publish post.");
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this article from the public feed?")) return;
    try {
      await deleteDoc(doc(db, "blog", id));
      setPosts(posts.filter(p => p.id !== id));
    } catch (e) {
      alert("Failed to delete post.");
    }
  };

  const filteredPosts = filter === "All" ? posts : posts.filter(p => p.brand === filter || p.category === filter);

  if (loading) return <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-slate-400">Syncing public database...</div>;

  // --- DIRECTOR/ADMIN PUBLISHING MANAGEMENT DESK HUB ---
  if (isDashboardMode && role === "Super Admin") {
    return (
      <div className="grid lg:grid-cols-3 gap-8 animate-fade-in text-slate-800">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Compose Public Article</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Target Brand Focus</label>
                <select value={newPost.brand} onChange={e => setNewPost({...newPost, brand: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white outline-none">
                  <option value="General">Raja Deepu Sooriya (General)</option>
                  <option value="MyTripRaja">MyTripRaja (Travel)</option>
                  <option value="MarketerRaja">MarketerRaja (Marketing)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Category tag</label>
                <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white outline-none">
                  <option>Marketing</option>
                  <option>Travel Insights</option>
                  <option>Corporate News</option>
                  <option>Technology</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Headline Title</label>
                <input type="text" required placeholder="e.g., Scaling Travel Networks in 2026" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full p-2 border rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Brief Summary Excerpt</label>
                <input type="text" required placeholder="A single short sentence preview card..." value={newPost.excerpt} onChange={e => setNewPost({...newPost, excerpt: e.target.value})} className="w-full p-2 border rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Banner Cover Image URL (Optional)</label>
                <input type="url" placeholder="https://images.unsplash.com/..." value={newPost.imageUrl} onChange={e => setNewPost({...newPost, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Full Editorial Content</label>
                <textarea required rows="8" placeholder="Write comprehensive body content..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full p-2 border rounded-lg text-sm outline-none resize-none font-body" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-sm">Publish Post Live</button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-slate-900 mb-2">Live Corporate Feed Articles ({posts.length})</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">{post.brand}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{post.dateStr}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{post.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button onClick={() => handleDeletePost(post.id)} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">Remove Article</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- PUBLIC FRONT-FACING COMPONENT GRID LOOK ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in font-body text-slate-800">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Corporate Insights & Media</h2>
        <p className="mt-3 text-slate-500 text-sm">Strategic analytics and intelligence streams directly updated by executive leadership.</p>
        
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {["All", "General", "MyTripRaja", "MarketerRaja"].map(b => (
            <button key={b} onClick={() => setFilter(b)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${filter === b ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {b === "General" ? "Corporate" : b}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map(post => (
          <article key={post.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
              <img 
                src={post.imageUrl || "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=600"} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                {post.category}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">{post.brand} • {post.dateStr}</div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">{post.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">{post.excerpt}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => alert(`${post.title}\n\n${post.content}`)} className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1 uppercase tracking-wider">
                  Read Article →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="text-center py-16 text-slate-400 font-bold uppercase text-sm tracking-widest">No articles found in this stream.</div>
      )}
    </div>
  );
}

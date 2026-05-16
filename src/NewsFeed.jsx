import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export default function NewsFeed({ role, userName }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General" });
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (msg) => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: "" }), 3000); };

  const fetchNews = async () => {
    try {
      const q = query(collection(db, "news"), orderBy("postedAt", "desc"));
      const snap = await getDocs(q);
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().postedAt?.toDate().toLocaleString('en-IN') })));
    } catch (e) { console.error("Failed to load news"); }
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const handlePostNews = async (e) => {
    e.preventDefault();
    try {
      const postData = { ...newPost, postedBy: userName, postedAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "news"), postData);
      setNews([{ id: docRef.id, ...postData, dateStr: "Just now" }, ...news]);
      setNewPost({ title: "", content: "", category: "General" });
      showToast("Announcement Posted!");
    } catch (error) { showToast("Failed to post"); }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      setNews(news.filter(n => n.id !== id));
      showToast("Post deleted");
    } catch (error) { showToast("Failed to delete"); }
  };

  if (loading) return <div className="text-center text-gray-500 font-bold text-xs uppercase mt-12">Loading News...</div>;

  return (
    <div className="animate-fade-in relative">
      {/* Toast */}
      {toast.show && <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold">{toast.message}</div>}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* DIRECTOR POSTING TOOL */}
        {role === "Super Admin" && (
          <div className="lg:col-span-1">
            <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
              <h3 className="font-display text-xl font-bold mb-6">Post Announcement</h3>
              <form onSubmit={handlePostNews} className="space-y-4">
                <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Category</label><select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"><option>General</option><option>Important</option><option>Event</option><option>Policy Update</option></select></div>
                <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Headline</label><input type="text" required value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Message</label><textarea required rows="5" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none resize-none" /></div>
                <button type="submit" className="w-full py-3 bg-[#10b981] hover:bg-green-600 text-white font-bold text-[10px] uppercase rounded transition-colors shadow-sm">Publish News</button>
              </form>
            </div>
          </div>
        )}

        {/* NEWS FEED WALL */}
        <div className={role === "Super Admin" ? "lg:col-span-2" : "lg:col-span-3 max-w-4xl mx-auto w-full"}>
          <div className="space-y-4">
            {news.length === 0 ? (
              <div className="bg-white p-12 text-center border border-gray-200 rounded shadow-sm text-gray-500 text-sm font-bold uppercase tracking-widest">No announcements yet.</div>
            ) : (
              news.map(item => (
                <div key={item.id} className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${item.category === 'Important' ? 'bg-red-500' : item.category === 'Event' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.category} • {item.dateStr}</div>
                      <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                    </div>
                    {role === "Super Admin" && <button onClick={() => deletePost(item.id)} className="text-red-500 text-xs hover:underline font-bold">Delete</button>}
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap mt-2">{item.content}</p>
                  <div className="text-[10px] text-gray-400 mt-4 font-bold">Posted by: {item.postedBy}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export default function LearningHub({ role }) {
  const [modules, setModules] = useState([]);
  const [newModule, setNewModule] = useState({ title: "", videoUrl: "", steps: "" });

  useEffect(() => { fetchModules(); }, []);
  const fetchModules = async () => {
    const snap = await getDocs(query(collection(db, "learning"), orderBy("createdAt", "desc")));
    setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    const videoId = newModule.videoUrl.split('v=')[1]?.split('&')[0] || newModule.videoUrl.split('/').pop();
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const docRef = await addDoc(collection(db, "learning"), { ...newModule, embedUrl, createdAt: serverTimestamp() });
    setModules([{ id: docRef.id, ...newModule, embedUrl }, ...modules]);
    setNewModule({ title: "", videoUrl: "", steps: "" });
  };

  const deleteModule = async (id) => {
    if(!window.confirm("Delete module?")) return;
    await deleteDoc(doc(db, "learning", id));
    setModules(modules.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {role === "Super Admin" && (
        <form onSubmit={handleAddModule} className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 space-y-4">
          <h3 className="font-bold text-lg">Create Training Module</h3>
          <input type="text" placeholder="Module Title" required value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} className="w-full p-2 border rounded text-sm" />
          <input type="url" placeholder="YouTube Video URL" value={newModule.videoUrl} onChange={e => setNewModule({...newModule, videoUrl: e.target.value})} className="w-full p-2 border rounded text-sm" />
          <textarea placeholder="Step-by-step notes..." required rows="4" value={newModule.steps} onChange={e => setNewModule({...newModule, steps: e.target.value})} className="w-full p-2 border rounded text-sm" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Publish Module</button>
        </form>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        {modules.map(mod => (
          <div key={mod.id} className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
            {mod.embedUrl && <iframe className="w-full h-48" src={mod.embedUrl} frameBorder="0" allowFullScreen></iframe>}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg">{mod.title}</h4>
                {role === "Super Admin" && <button onClick={() => deleteModule(mod.id)} className="text-red-500 text-xs font-bold">Delete</button>}
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{mod.steps}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

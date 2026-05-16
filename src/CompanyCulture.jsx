import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function CompanyCulture({ userName }) {
  const [kudos, setKudos] = useState([]);
  const [newKudo, setNewKudo] = useState({ to: "", message: "" });
  const emojis = ["🤩 Great", "🙂 Good", "😐 Okay", "😫 Stressed", "🔥 Burnout"];

  useEffect(() => {
    getDocs(query(collection(db, "culture"), orderBy("timestamp", "desc"))).then(snap => {
      setKudos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const logMood = async (mood) => {
    await addDoc(collection(db, "culture"), { type: "Mood", name: userName, mood, timestamp: serverTimestamp() });
    alert(`Mood logged: ${mood}`);
  };

  const sendKudo = async (e) => {
    e.preventDefault();
    const data = { type: "Kudo", from: userName, to: newKudo.to, message: newKudo.message, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "culture"), data);
    setKudos([{ id: docRef.id, ...data }, ...kudos]);
    setNewKudo({ to: "", message: "" });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
      {/* Mood Tracker */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 h-fit">
        <h3 className="font-bold text-lg mb-2">Daily Pulse</h3>
        <p className="text-xs text-gray-500 mb-6">How are you feeling at work today? Your feedback helps leadership monitor team burnout.</p>
        <div className="flex flex-wrap gap-2">
          {emojis.map(e => (
            <button key={e} onClick={() => logMood(e)} className="bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-3 rounded font-bold text-sm transition-transform active:scale-95">{e}</button>
          ))}
        </div>
      </div>

      {/* Peer Recognition Wall */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Peer Recognition Wall 🏆</h3>
        <form onSubmit={sendKudo} className="mb-6 space-y-3 border-b pb-6">
          <input type="text" placeholder="Who are you praising?" required value={newKudo.to} onChange={e => setNewKudo({...newKudo, to: e.target.value})} className="w-full p-2 border rounded text-sm" />
          <textarea placeholder="Write a nice message..." required rows="2" value={newKudo.message} onChange={e => setNewKudo({...newKudo, message: e.target.value})} className="w-full p-2 border rounded text-sm resize-none" />
          <button type="submit" className="w-full bg-corp-gold text-white font-bold text-xs p-2 rounded uppercase tracking-widest hover:bg-yellow-600">Give Kudos</button>
        </form>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {kudos.filter(k => k.type === "Kudo").map(k => (
            <div key={k.id} className="bg-yellow-50 border border-yellow-100 p-4 rounded text-sm">
              <span className="font-bold">{k.from}</span> praised <span className="font-bold text-corp-blue">{k.to}</span>
              <p className="text-gray-700 mt-1 italic">"{k.message}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

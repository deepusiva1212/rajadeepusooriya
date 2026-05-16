import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export default function SafetyDirectory({ role }) {
  const [responders, setResponders] = useState([]);
  const [newResponder, setNewResponder] = useState({ name: "", phone: "", certification: "CPR & First Aid", location: "Main Office" });

  useEffect(() => {
    getDocs(query(collection(db, "safety"), orderBy("name", "asc"))).then(snap => setResponders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const addResponder = async (e) => {
    e.preventDefault();
    const docRef = await addDoc(collection(db, "safety"), newResponder);
    setResponders([...responders, { id: docRef.id, ...newResponder }]);
    setNewResponder({ name: "", phone: "", certification: "CPR & First Aid", location: "Main Office" });
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border-t-4 border-red-600 animate-fade-in">
      <h3 className="font-display text-2xl font-black mb-2 text-red-600">First Responder Directory 🚑</h3>
      <p className="text-gray-500 text-sm mb-8">In case of a medical emergency or fire, immediately contact the trained personnel listed below.</p>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            {responders.map(r => (
              <div key={r.id} className="p-4 border border-red-200 rounded bg-red-50 flex items-start gap-3">
                <div className="text-2xl mt-1">{r.certification.includes("Fire") ? "🧯" : "⚕️"}</div>
                <div>
                  <div className="font-bold text-gray-900">{r.name}</div>
                  <div className="text-[10px] font-black uppercase text-red-600 tracking-widest">{r.certification}</div>
                  <div className="text-xs text-gray-600 mt-1">📍 {r.location}</div>
                  <div className="text-xs font-mono font-bold mt-1">📞 {r.phone}</div>
                </div>
              </div>
            ))}
            {responders.length === 0 && <div className="text-gray-400 text-sm italic">No certified responders registered yet.</div>}
          </div>
        </div>

        {role === "Super Admin" && (
          <div className="md:col-span-1 bg-gray-50 p-6 border rounded-sm h-fit">
            <h3 className="font-bold mb-4 text-sm">Register Certified Staff</h3>
            <form onSubmit={addResponder} className="space-y-4">
              <input type="text" required placeholder="Employee Name" value={newResponder.name} onChange={e => setNewResponder({...newResponder, name: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <input type="text" required placeholder="Emergency Phone Number" value={newResponder.phone} onChange={e => setNewResponder({...newResponder, phone: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <select value={newResponder.certification} onChange={e => setNewResponder({...newResponder, certification: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>CPR & First Aid</option><option>Fire Warden</option><option>Mental Health First Aider</option></select>
              <button type="submit" className="w-full bg-red-600 text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Add to Directory</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

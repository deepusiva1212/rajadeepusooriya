import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

export default function ComplianceAdmin({ role, userName }) {
  const [handovers, setHandovers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [newHandover, setNewHandover] = useState({ title: "", description: "" });

  useEffect(() => {
    getDocs(query(collection(db, "handovers"), orderBy("status", "asc"))).then(snap => setHandovers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    if (role === "Super Admin") {
      getDocs(collection(db, "staff")).then(snap => setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [role]);

  const submitHandover = async (e) => {
    e.preventDefault();
    const docRef = await addDoc(collection(db, "handovers"), { ...newHandover, employee: userName, status: "Pending Director Review" });
    setHandovers([{ id: docRef.id, ...newHandover, employee: userName, status: "Pending Director Review" }, ...handovers]);
    setNewHandover({ title: "", description: "" });
    alert("Handover submitted to HR.");
  };

  const toggleLegalHold = async (staffId, currentHoldStatus) => {
    const confirmMsg = currentHoldStatus 
      ? "LIFT LEGAL HOLD? This allows data deletion again." 
      : "ACTIVATE LEGAL HOLD? This user's data will be frozen for subpoena auditing.";
    if (!window.confirm(confirmMsg)) return;
    
    await updateDoc(doc(db, "staff", staffId), { legalHold: !currentHoldStatus });
    setStaff(staff.map(s => s.id === staffId ? { ...s, legalHold: !currentHoldStatus } : s));
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* VR Onboarding Embed (Visible to all) */}
      <div className="bg-gray-900 text-white p-8 rounded-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Beta Feature</div>
        <h3 className="font-display text-2xl font-black mb-2">Digital VR Onboarding Lounge</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-2xl">Step into the Raja Deepu Sooriya interactive digital headquarters. Meet colleagues and explore company history in 3D.</p>
        <div className="w-full h-64 bg-black rounded border border-gray-700 flex items-center justify-center flex-col">
           {/* Note: This is where you would put a <iframe src="https://spatial.io/room/..." /> if you build a free room! */}
           <div className="text-4xl mb-2">🥽</div>
           <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Awaiting Spatial.io 3D Room Link</div>
           <a href="https://spatial.io" target="_blank" className="mt-2 text-corp-gold text-[10px] hover:underline">Create a free 3D room to embed here</a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Knowledge Handover Logs */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4 flex items-center gap-2">📂 Knowledge Handover Logs</h3>
          <p className="text-xs text-gray-500 mb-6">Offboarding checklist: Employees must submit passwords, SOPs, and current project statuses before role changes.</p>
          
          <form onSubmit={submitHandover} className="mb-6 space-y-3 border-b pb-6">
            <input type="text" required placeholder="Workflow or Folder Name (e.g. Q4 Client Files)" value={newHandover.title} onChange={e => setNewHandover({...newHandover, title: e.target.value})} className="w-full p-2 border rounded text-sm" />
            <textarea required rows="2" placeholder="Where are the files/keys located?" value={newHandover.description} onChange={e => setNewHandover({...newHandover, description: e.target.value})} className="w-full p-2 border rounded text-sm resize-none" />
            <button type="submit" className="w-full bg-gray-900 text-white font-bold text-xs p-2 rounded uppercase tracking-widest hover:bg-black">Log Handover</button>
          </form>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {handovers.map(h => (
              <div key={h.id} className="p-3 bg-gray-50 border rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{h.title} <span className="text-[10px] text-gray-500 ml-1">by {h.employee}</span></span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${h.status.includes('Pending') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{h.status}</span>
                </div>
                <div className="text-xs text-gray-600">"{h.description}"</div>
              </div>
            ))}
          </div>
        </div>

        {/* Subpoena & Legal Hold Lock (Director Only) */}
        {role === "Super Admin" && (
          <div className="bg-red-50 p-6 rounded-sm shadow-sm border border-red-200">
            <h3 className="font-bold mb-4 text-red-800 flex items-center gap-2">⚖️ Subpoena & Legal Hold</h3>
            <p className="text-xs text-red-600 mb-6">Activating a Legal Hold instantly freezes an employee's data. They cannot delete chats, files, or task histories while auditing is in progress.</p>
            
            <div className="space-y-3">
              {staff.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-red-100 rounded shadow-sm">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{s.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{s.email}</div>
                  </div>
                  <button 
                    onClick={() => toggleLegalHold(s.id, s.legalHold)}
                    className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-colors ${s.legalHold ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-700'}`}
                  >
                    {s.legalHold ? "🔒 HOLD ACTIVE" : "APPLY HOLD"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

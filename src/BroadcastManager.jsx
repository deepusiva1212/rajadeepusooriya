import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function BroadcastManager({ userName }) {
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState("All Active Staff");

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try {
      await addDoc(collection(db, "broadcasts"), {
        message: msg,
        sender: userName,
        channel: target,
        createdAt: serverTimestamp()
      });
      setMsg("");
      alert("Operational broadcast pushed across all standard user screens live!");
    } catch (e) {
      alert("Failed to sync message.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-fade-in text-slate-800 dark:text-slate-200">
      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Emergency Operations Broadcast Terminal</h3>
      <p className="text-xs text-slate-400 mb-6">Pushes high-priority alerts to the top header profile line of all active employee layout screens instantly.</p>
      
      <form onSubmit={sendBroadcast} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination Channel Group</label>
          <select value={target} onChange={e => setTarget(e.target.value)} className="p-2 w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm outline-none">
            <option>All Active Staff</option>
            <option>MyTripRaja Operations</option>
            <option>MarketerRaja Digital Squad</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Directive Message</label>
          <textarea 
            required 
            rows="3" 
            placeholder="Type directive (e.g., Q2 Server migration happening tonight at 11 PM. Sync files immediate.)" 
            value={msg} 
            onChange={e => setMsg(e.target.value)}
            className="p-2 w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm outline-none resize-none font-sans"
          />
        </div>
        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-md">Transmit Live Signal</button>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";

export default function BroadcastManager({ userName }) {
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState("All Active Staff");
  const [history, setHistory] = useState([]);
  const [staffMap, setStaffMap] = useState({}); // Maps emails to Names for easy reading
  const [loading, setLoading] = useState(true);

  // Load all broadcasts and all staff members to calculate read receipts
  const fetchDashboardData = async () => {
    try {
      // 1. Get all staff to know who should be reading these
      const staffSnap = await getDocs(collection(db, "staff"));
      const staffObj = {};
      staffSnap.docs.forEach(d => {
        const data = d.data();
        if (data.isActive) staffObj[data.email] = data.name;
      });
      setStaffMap(staffObj);

      // 2. Get broadcast history
      const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
      const bSnap = await getDocs(q);
      setHistory(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Failed to fetch broadcast data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try {
      await addDoc(collection(db, "broadcasts"), {
        message: msg,
        sender: userName,
        channel: target,
        createdAt: serverTimestamp(),
        isActive: true, // Used to turn it off later
        acknowledgedBy: [] // Array to store emails of who clicked "Got it"
      });
      setMsg("");
      fetchDashboardData(); // Refresh history
      alert("Operational broadcast pushed live!");
    } catch (e) {
      alert("Failed to sync message.");
    }
  };

  const stopBroadcast = async (id) => {
    if (!window.confirm("Turn off this directive? It will disappear from all employee screens.")) return;
    try {
      await updateDoc(doc(db, "broadcasts", id), { isActive: false });
      fetchDashboardData(); // Refresh history
    } catch (e) {
      alert("Failed to stop broadcast.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* TOP SECTION: SENDER FORM */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Emergency Operations Broadcast Terminal</h3>
        <p className="text-xs text-slate-400 mb-6">Pushes high-priority alerts to the top header profile line of all active employee layout screens instantly.</p>
        
        <form onSubmit={sendBroadcast} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination Channel Group</label>
            <select value={target} onChange={e => setTarget(e.target.value)} className="p-2 w-full border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none font-bold text-slate-700 dark:text-slate-200">
              <option>All Active Staff</option>
              <option>MyTripRaja Operations</option>
              <option>MarketerRaja Digital Squad</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Directive Message</label>
            <textarea 
              required rows="3" 
              placeholder="Type directive (e.g., Q2 Server migration happening tonight at 11 PM. Sync files immediate.)" 
              value={msg} onChange={e => setMsg(e.target.value)}
              className="p-3 w-full border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none resize-none font-sans"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-md flex justify-center items-center gap-2">
            <span className="text-lg">📡</span> Transmit Live Signal
          </button>
        </form>
      </div>

      {/* BOTTOM SECTION: AUDIT LOG & HISTORY */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Broadcast Audit History</h3>
        <p className="text-xs text-slate-400 mb-6">Track read receipts and historical directives.</p>

        {loading ? (
          <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading records...</div>
        ) : (
          <div className="space-y-4">
            {history.map(b => {
              const readers = b.acknowledgedBy || [];
              const allStaffEmails = Object.keys(staffMap);
              const unreadEmails = allStaffEmails.filter(email => !readers.includes(email));

              return (
                <div key={b.id} className={`p-4 rounded-lg border transition-colors ${b.isActive !== false ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/50' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'}`}>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${b.isActive !== false ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {b.isActive !== false ? 'LIVE NOW' : 'ENDED'}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{b.channel}</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">"{b.message}"</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(b.createdAt?.toDate()).toLocaleString()}</p>
                    </div>

                    {/* TURN OFF BUTTON */}
                    {b.isActive !== false && (
                      <button onClick={() => stopBroadcast(b.id)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap">
                        Turn Off Banner
                      </button>
                    )}
                  </div>

                  {/* READ RECEIPTS */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
                    <div>
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">✅ Acknowledged By ({readers.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {readers.length === 0 ? <span className="text-xs text-slate-400 italic">No one yet</span> : null}
                        {readers.map(email => (
                          <span key={email} className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">{staffMap[email] || email}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1">⏳ Waiting On ({unreadEmails.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {unreadEmails.length === 0 ? <span className="text-xs text-slate-400 italic">Everyone read it!</span> : null}
                        {unreadEmails.map(email => (
                          <span key={email} className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold">{staffMap[email] || email}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
            {history.length === 0 && <div className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest">No previous broadcasts</div>}
          </div>
        )}
      </div>

    </div>
  );
}

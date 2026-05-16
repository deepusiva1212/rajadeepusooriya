import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function PerformanceOKRs({ role, userName }) {
  const [okrs, setOkrs] = useState([]);
  const [newOkr, setNewOkr] = useState({ objective: "", quarter: "Q1 2026", progress: "0%" });

  useEffect(() => {
    getDocs(query(collection(db, "okrs"), orderBy("timestamp", "desc"))).then(snap => setOkrs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const submitOKR = async (e) => {
    e.preventDefault();
    const data = { ...newOkr, employee: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "okrs"), data);
    setOkrs([{ id: docRef.id, ...data }, ...okrs]);
    setNewOkr({ ...newOkr, objective: "" });
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <h3 className="font-display text-2xl font-black mb-6">OKRs & Performance</h3>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-bold mb-4">Set New Goal (OKR)</h3>
          <form onSubmit={submitOKR} className="space-y-4">
            <select value={newOkr.quarter} onChange={e => setNewOkr({...newOkr, quarter: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option></select>
            <textarea required rows="3" placeholder="Objective: What do you want to achieve?" value={newOkr.objective} onChange={e => setNewOkr({...newOkr, objective: e.target.value})} className="w-full p-2 border rounded text-sm resize-none" />
            <button type="submit" className="w-full bg-corp-gold text-white p-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-yellow-600">Lock In Goal</button>
          </form>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-bold mb-4">Active Objectives</h3>
          <div className="space-y-4">
            {okrs.map(o => (
              <div key={o.id} className="p-4 border rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-sm text-gray-900">{o.employee} <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] ml-2">{o.quarter}</span></div>
                  <div className="text-xs font-bold text-gray-500">Progress: {o.progress}</div>
                </div>
                <div className="text-sm text-gray-700">{o.objective}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3"><div className="bg-green-500 h-2 rounded-full" style={{ width: o.progress }}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

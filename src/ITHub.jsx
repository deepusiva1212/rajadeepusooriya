import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export default function ITHub({ role, userName }) {
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [newTicket, setNewTicket] = useState({ issue: "", priority: "Medium", category: "Hardware" });

  useEffect(() => {
    getDocs(query(collection(db, "tickets"), orderBy("timestamp", "desc"))).then(snap => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleString('en-IN') }))));
    getDocs(query(collection(db, "assets"), orderBy("assignedTo", "asc"))).then(snap => setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const submitTicket = async (e) => {
    e.preventDefault();
    const data = { ...newTicket, requestedBy: userName, status: "Open", timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "tickets"), data);
    setTickets([{ id: docRef.id, ...data, dateStr: "Just now" }, ...tickets]);
    setNewTicket({ issue: "", priority: "Medium", category: "Hardware" });
    alert("IT Ticket Submitted!");
  };

  const updateTicketStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "tickets", id), { status: newStatus });
    setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex gap-4 mb-8 border-b pb-4">
        <button onClick={() => setActiveTab("tickets")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'tickets' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>IT Helpdesk</button>
        {role === "Super Admin" && <button onClick={() => setActiveTab("assets")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'assets' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>Asset Registry</button>}
      </div>

      {activeTab === "tickets" && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="font-bold mb-4">Submit IT Request</h3>
            <form onSubmit={submitTicket} className="space-y-4">
              <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>Hardware (Laptop, Mouse)</option><option>Software/Access</option><option>Network/Wi-Fi</option></select>
              <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>Low</option><option>Medium</option><option>High (Urgent)</option></select>
              <textarea required rows="4" placeholder="Describe the issue..." value={newTicket.issue} onChange={e => setNewTicket({...newTicket, issue: e.target.value})} className="w-full p-2 border rounded text-sm resize-none" />
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Submit Ticket</button>
            </form>
          </div>
          <div className="md:col-span-2">
             <h3 className="font-bold mb-4">Ticket Queue</h3>
             <div className="space-y-3">
               {tickets.map(t => (
                 <div key={t.id} className="p-4 border rounded bg-gray-50 flex justify-between items-center">
                   <div>
                     <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{t.dateStr} • {t.requestedBy}</div>
                     <div className="font-bold text-sm text-gray-900">{t.category} Issue</div>
                     <div className="text-sm text-gray-700">"{t.issue}"</div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${t.priority === 'High (Urgent)' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{t.priority}</span>
                     {role === "Super Admin" ? (
                       <select value={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value)} className={`text-xs font-bold uppercase p-1 rounded border outline-none ${t.status === 'Open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}><option>Open</option><option>In Progress</option><option>Resolved</option></select>
                     ) : (
                       <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${t.status === 'Open' ? 'text-yellow-600' : 'text-green-600'}`}>{t.status}</span>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === "assets" && role === "Super Admin" && (
        <div>
          <h3 className="font-bold mb-4">Company Hardware Registry</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="bg-gray-50 border-b"><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Device Name & Specs</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Serial / ID</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Assigned To</th></tr></thead>
            <tbody>
              {/* Dummy data for preview, since we haven't built the "Add Asset" form yet */}
              <tr className="border-b"><td className="p-3 font-bold text-gray-800">MacBook Pro 14" (M2)</td><td className="p-3 font-mono text-xs text-gray-500">RDS-MAC-001</td><td className="p-3 font-bold text-corp-blue">Deepadharsan</td></tr>
              <tr className="border-b"><td className="p-3 font-bold text-gray-800">Dell XPS 15</td><td className="p-3 font-mono text-xs text-gray-500">RDS-WIN-004</td><td className="p-3 font-bold text-corp-blue">Raja</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

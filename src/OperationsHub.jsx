import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function OperationsHub({ role, userName }) {
  const [activeTab, setActiveTab] = useState("broadcasts");
  const [broadcasts, setBroadcasts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  const [newBroadcast, setNewBroadcast] = useState("");
  const [newMeeting, setNewMeeting] = useState({ title: "", date: "", time: "", teams: "Engineering" });

  useEffect(() => {
    getDocs(query(collection(db, "broadcasts"), orderBy("timestamp", "desc"))).then(snap => setBroadcasts(snap.docs.map(d => ({ id: d.id, ...d.data(), timeStr: d.data().timestamp?.toDate().toLocaleString('en-IN') }))));
    getDocs(query(collection(db, "meetings"), orderBy("timestamp", "desc"))).then(snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const sendEmergencyAlert = async (e) => {
    e.preventDefault();
    if(!window.confirm("WARNING: This sends an immediate alert to all staff. Proceed?")) return;
    const data = { message: newBroadcast, sender: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "broadcasts"), data);
    setBroadcasts([{ id: docRef.id, ...data, timeStr: "Just now" }, ...broadcasts]);
    setNewBroadcast("");
    alert("Emergency Broadcast Sent!");
  };

  const scheduleMeeting = async (e) => {
    e.preventDefault();
    const data = { ...newMeeting, host: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "meetings"), data);
    setMeetings([{ id: docRef.id, ...data }, ...meetings]);
    setNewMeeting({ title: "", date: "", time: "", teams: "Engineering" });
    alert("Smart Schedule Complete!");
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex gap-4 mb-8 border-b pb-4">
        {role === "Super Admin" && <button onClick={() => setActiveTab("broadcasts")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'broadcasts' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400'}`}>Emergency Broadcast</button>}
        <button onClick={() => setActiveTab("scheduling")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'scheduling' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>Smart Scheduling</button>
        <button onClick={() => setActiveTab("carpool")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'carpool' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>Carpool Map</button>
      </div>

      {activeTab === "broadcasts" && role === "Super Admin" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">⚠️ Issue Global Alert</h3>
            <form onSubmit={sendEmergencyAlert} className="space-y-4">
              <textarea required rows="4" placeholder="Enter emergency SMS/Push message to be sent to all active employees immediately..." value={newBroadcast} onChange={e => setNewBroadcast(e.target.value)} className="w-full p-4 border-2 border-red-200 rounded text-sm resize-none bg-red-50 focus:bg-white" />
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded font-black uppercase tracking-widest">Broadcast Alert Now</button>
            </form>
          </div>
          <div className="border-l pl-8">
            <h3 className="font-bold text-gray-500 mb-4 uppercase tracking-widest text-xs">Broadcast History</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {broadcasts.map(b => (
                <div key={b.id} className="p-3 bg-gray-50 border rounded text-sm"><div className="text-[10px] text-gray-400 font-bold mb-1">{b.timeStr} • By {b.sender}</div><div className="text-red-700 font-bold">"{b.message}"</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "scheduling" && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="font-bold mb-4">AI Meeting Suggestion</h3>
            <form onSubmit={scheduleMeeting} className="space-y-4">
              <input type="text" required placeholder="Meeting Subject" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <select value={newMeeting.teams} onChange={e => setNewMeeting({...newMeeting, teams: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>Engineering</option><option>HR & Admin</option><option>All Staff</option></select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full p-2 border rounded text-sm" />
                <input type="time" required value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full p-2 border rounded text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Book Slot</button>
            </form>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4">Upcoming Smart Schedules</h3>
            <div className="space-y-2">
              {meetings.map(m => (
                <div key={m.id} className="p-3 border rounded bg-gray-50 flex justify-between items-center"><div className="font-bold text-sm">{m.title} <span className="text-[10px] text-gray-500 uppercase ml-2 bg-gray-200 px-2 py-1 rounded">{m.teams}</span></div><div className="text-xs font-bold text-blue-600">{m.date} at {m.time}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "carpool" && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="font-display text-2xl font-bold mb-2">Commute & Carpool Map</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">Connect with colleagues who live nearby to share rides, reduce emissions, and save on transit costs.</p>
          <button className="bg-gray-900 text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-widest">Enable Location Sharing</button>
        </div>
      )}
    </div>
  );
}

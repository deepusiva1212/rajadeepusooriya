import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "firebase/firestore";

export default function Timesheets({ role, userName, userEmail }) {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState({ project: "", hours: "", type: "Billable" });
  const [breakActive, setBreakActive] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = role === "Super Admin" 
        ? query(collection(db, "timesheets"), orderBy("timestamp", "desc"))
        : query(collection(db, "timesheets"), where("email", "==", userEmail), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleDateString('en-IN') })));
    };
    fetchLogs();
  }, [role, userEmail]);

  const submitTime = async (e) => {
    e.preventDefault();
    const data = { ...newLog, hours: parseFloat(newLog.hours), email: userEmail, name: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "timesheets"), data);
    setLogs([{ id: docRef.id, ...data, dateStr: "Today" }, ...logs]);
    setNewLog({ project: "", hours: "", type: "Billable" });
  };

  const toggleBreak = async () => {
    if (!breakActive) {
      setBreakStartTime(new Date());
      setBreakActive(true);
    } else {
      const breakDurationMins = Math.round((new Date() - breakStartTime) / 60000);
      await addDoc(collection(db, "breaks"), { email: userEmail, name: userName, duration: breakDurationMins, timestamp: serverTimestamp() });
      setBreakActive(false);
      alert(`Break logged: ${breakDurationMins} minutes. Labor compliance updated.`);
    }
  };

  // Utilization Math (Billable vs Internal)
  const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const billableHours = logs.filter(l => l.type === "Billable").reduce((sum, log) => sum + (log.hours || 0), 0);
  const utilization = totalHours === 0 ? 0 : Math.round((billableHours / totalHours) * 100);

  return (
    <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
      <div className="md:col-span-1 space-y-6">
        {/* Compliance Break Timer */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 text-center">
          <h3 className="font-bold mb-2">Mandatory Rest Break</h3>
          <p className="text-xs text-gray-500 mb-4">Ensure labor compliance by logging your breaks.</p>
          <button onClick={toggleBreak} className={`w-full py-4 rounded font-black uppercase tracking-widest text-white transition-colors ${breakActive ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' : 'bg-gray-900 hover:bg-black'}`}>
            {breakActive ? "Stop Break & Clock In" : "Start Lunch / Rest Break"}
          </button>
          {breakActive && <div className="text-[10px] text-orange-600 font-bold mt-2">Break is currently active...</div>}
        </div>

        {/* Log Time */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4">Log Project Hours</h3>
          <form onSubmit={submitTime} className="space-y-4">
            <input type="text" required placeholder="Client or Project Name" value={newLog.project} onChange={e => setNewLog({...newLog, project: e.target.value})} className="w-full p-2 border rounded text-sm" />
            <div className="flex gap-2">
              <input type="number" step="0.5" required placeholder="Hours (e.g. 2.5)" value={newLog.hours} onChange={e => setNewLog({...newLog, hours: e.target.value})} className="w-1/2 p-2 border rounded text-sm" />
              <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})} className="w-1/2 p-2 border rounded text-sm bg-white"><option>Billable</option><option>Internal (Non-Billable)</option></select>
            </div>
            <button type="submit" className="w-full bg-corp-blue text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Submit Timesheet</button>
          </form>
        </div>
      </div>

      <div className="md:col-span-2 space-y-6">
        {/* Utilization Dashboard */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Utilization Rate</h3>
            <p className="text-xs text-gray-500">Billable vs Internal Hours</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${utilization >= 75 ? 'text-green-500' : utilization >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{utilization}%</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{billableHours} Billable / {totalHours} Total</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800">Timesheet Audit Log</div>
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b"><th className="p-3 text-[10px] text-gray-500 uppercase">Date & User</th><th className="p-3 text-[10px] text-gray-500 uppercase">Project</th><th className="p-3 text-[10px] text-gray-500 uppercase">Hours & Type</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><div className="font-bold">{log.dateStr}</div><div className="text-xs text-gray-500">{log.name}</div></td>
                  <td className="p-3 font-bold text-gray-800">{log.project}</td>
                  <td className="p-3"><span className="font-black text-lg">{log.hours}h</span> <span className={`ml-2 text-[9px] uppercase font-bold px-2 py-1 rounded ${log.type === 'Billable' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{log.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

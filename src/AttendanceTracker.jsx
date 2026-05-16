import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";

export default function AttendanceTracker({ userEmail, userName, role }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    const q = role === "Super Admin" ? query(collection(db, "attendance"), orderBy("timestamp", "desc")) : query(collection(db, "attendance"), where("email", "==", userEmail), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    setLogs(snap.docs.map(d => ({ id: d.id, ...d.data(), timeStr: d.data().timestamp?.toDate().toLocaleString('en-IN') })));
  };

  const recordAttendance = (type) => {
    setLoading(true);
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser.");
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const logData = { type, email: userEmail, name: userName, latitude, longitude, timestamp: serverTimestamp() };
      const docRef = await addDoc(collection(db, "attendance"), logData);
      setLogs([{ id: docRef.id, ...logData, timeStr: "Just now" }, ...logs]);
      setLoading(false);
    }, () => { alert("Location access denied. Cannot log attendance."); setLoading(false); });
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-xl">Daily Attendance & GPS Logs</h3>
        {role !== "Super Admin" && (
          <div className="flex gap-4">
            <button disabled={loading} onClick={() => recordAttendance("Clock In")} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-widest">Login (Clock In)</button>
            <button disabled={loading} onClick={() => recordAttendance("Clock Out")} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-widest">Logout (Clock Out)</button>
          </div>
        )}
      </div>
      <table className="w-full text-left text-sm border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Employee</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Action</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Time</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Location Data</th></tr></thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b">
              <td className="p-3 font-bold">{log.name}</td>
              <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.type === 'Clock In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.type}</span></td>
              <td className="p-3 text-gray-600">{log.timeStr}</td>
              <td className="p-3"><a href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`} target="_blank" className="text-blue-500 hover:underline text-xs">View on Map</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

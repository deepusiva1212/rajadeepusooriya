import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";

export default function AttendanceTracker({ userEmail, userName, role }) {
  const [logs, setLogs] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate an array representing days of the current month for our heatmap matrix
  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));
  };

  const daysArray = getDaysInMonth();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const q = query(collection(db, "attendance"), where("email", "==", userEmail), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toDateString() }));
        setLogs(data);

        // Check if user is currently clocked in
        const activeShift = data.find(l => l.type === "Clock In" && !data.some(out => out.type === "Clock Out" && out.shiftRef === l.id));
        if (activeShift) {
          setIsCheckedIn(true);
          setCurrentShiftId(activeShift.id);
        }
      } catch (e) {
        console.error("Error fetching attendance logs", e);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [userEmail]);

  const handleClockIn = async () => {
    const now = new Date();
    const isLate = now.getHours() >= 10; // Company policy: Late after 10:00 AM
    
    const logData = {
      email: userEmail,
      name: userName,
      type: "Clock In",
      status: isLate ? "Late" : "On-Time",
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "attendance"), logData);
    setLogs([{ id: docRef.id, ...logData, dateStr: new Date().toDateString() }, ...logs]);
    setIsCheckedIn(true);
    setCurrentShiftId(docRef.id);
    alert(isLate ? "Clocked in successfully. Status logged as: Late (Past 10 AM)." : "Clocked in on time! Have a great shift.");
  };

  const handleClockOut = async () => {
    if (!currentShiftId) return;
    const logData = {
      email: userEmail,
      name: userName,
      type: "Clock Out",
      shiftRef: currentShiftId,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, "attendance"), logData);
    setIsCheckedIn(false);
    setCurrentShiftId(null);
    // Reload history to refresh the visualization matrix
    window.location.reload();
  };

  // Heatmap helper function to choose color intensity based on logs for that day
  const getDayColorClass = (dayDate) => {
    const dayStr = dayDate.toDateString();
    const matches = logs.filter(l => l.dateStr === dayStr);
    if (matches.length === 0) return "bg-slate-100 dark:bg-slate-800 text-transparent"; // Absent / Rest day
    const hasLate = matches.some(m => m.status === "Late");
    if (hasLate) return "bg-amber-500 text-white font-bold"; // Late punch
    return "bg-emerald-600 text-white font-bold"; // Present and On-Time
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-slate-400">Loading tracking matrix...</div>;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* PUNCH CARD INTERFACE */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Shift Tracking Terminal</h3>
          <p className="text-xs text-slate-400 mt-1">Official working metrics are monitored on-time daily.</p>
        </div>
        <button 
          onClick={isCheckedIn ? handleClockOut : handleClockIn}
          className={`px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-95 ${isCheckedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isCheckedIn ? "⏹ Stop Shift & Clock Out" : "▶ Start Shift & Clock In"}
        </button>
      </div>

      {/* GITHUB STYLE ATTENDANCE HEATMAP GRID */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Consistency Matrix</h3>
        <p className="text-xs text-slate-400 mb-6">Visual ledger tracking punctuation streaks for the current calendar month.</p>
        
        {/* Continuous block visualization */}
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
          {daysArray.map((day, idx) => (
            <div 
              key={idx} 
              className={`w-10 h-10 rounded-md flex items-center justify-center text-xs transition-colors shadow-sm select-none ${getDayColorClass(day)}`}
              title={`${day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            >
              {day.getDate()}
            </div>
          ))}
        </div>

        {/* LEGEND SYMBOLS GUIDE */}
        <div className="flex gap-4 items-center text-[10px] font-bold text-slate-400 mt-4 px-1 uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/40" /> Not Logged</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-600 rounded" /> On-Time Punch</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded" /> Delayed (>10 AM)</div>
        </div>
      </div>
    </div>
  );
}

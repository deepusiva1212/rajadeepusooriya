import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function HRAnalytics({ role }) {
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (role !== "Super Admin") return;
    const fetchData = async () => {
      const snapTasks = await getDocs(query(collection(db, "tasks"), orderBy("createdAt", "desc")));
      setTasks(snapTasks.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const snapLeaves = await getDocs(query(collection(db, "leaves"), orderBy("appliedAt", "desc")));
      setLeaves(snapLeaves.docs.map(d => ({ id: d.id, ...d.data() })));

      const snapAtt = await getDocs(query(collection(db, "attendance"), orderBy("timestamp", "desc")));
      setAttendance(snapAtt.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, [role]);

  if (role !== "Super Admin") return <div className="p-8 text-center text-red-500 font-bold uppercase">Access Restricted to Directors Only</div>;

  // Analytics Math
  const delayedTasks = tasks.filter(t => t.status !== "Completed" && new Date(t.deadline) < new Date());
  
  // Calculate approximate hours worked (simulated from attendance logs for burnout)
  const userWorkLogs = attendance.reduce((acc, log) => {
    if (!acc[log.name]) acc[log.name] = { logs: 0 };
    acc[log.name].logs += 1;
    return acc;
  }, {});
  
  const highWorkloadUsers = Object.keys(userWorkLogs).filter(name => userWorkLogs[name].logs > 20); // Arbitrary threshold for demo

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Burnout Predictor */}
        <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-red-500">
          <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">🔥 Burnout Predictor</h3>
          {highWorkloadUsers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-red-600 font-bold mb-2">High Activity Detected:</p>
              {highWorkloadUsers.map(name => <div key={name} className="bg-red-50 p-2 rounded text-sm font-bold border border-red-100">{name}</div>)}
              <p className="text-[10px] text-gray-400 mt-2">Based on recent high-frequency system logins and task updates.</p>
            </div>
          ) : (
            <div className="text-2xl font-black text-green-500">Normal</div>
          )}
        </div>

        {/* Task Bottleneck Finder */}
        <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-orange-500">
          <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">⚠️ Task Bottlenecks</h3>
          <div className="text-4xl font-black text-orange-600 mb-2">{delayedTasks.length}</div>
          <p className="text-xs text-gray-500">Projects currently past their deadline.</p>
          <div className="mt-4 max-h-32 overflow-y-auto space-y-2">
            {delayedTasks.map(t => <div key={t.id} className="text-xs p-2 bg-orange-50 rounded border border-orange-100"><span className="font-bold">{t.assignedToName}</span>: {t.title}</div>)}
          </div>
        </div>

        {/* Leave Trends */}
        <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-blue-500">
          <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">📅 Leave Volume</h3>
          <div className="text-4xl font-black text-blue-600 mb-2">{leaves.length}</div>
          <p className="text-xs text-gray-500">Total leave requests processed in the system.</p>
          <div className="mt-4 space-y-2">
            <div className="text-xs flex justify-between"><span>Approved:</span> <span className="font-bold text-green-600">{leaves.filter(l => l.status === "Approved").length}</span></div>
            <div className="text-xs flex justify-between"><span>Pending:</span> <span className="font-bold text-yellow-600">{leaves.filter(l => l.status === "Pending").length}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}

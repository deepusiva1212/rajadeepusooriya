import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [staffData, setStaffData] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("my-tasks"); 
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newLeave, setNewLeave] = useState({ startDate: "", endDate: "", reason: "", type: "Sick Leave" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const q = query(collection(db, "staff"), where("email", "==", currentUser.email), where("isActive", "==", true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setStaffData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          setUser(currentUser);
          fetchAllData();
        } else {
          signOut(auth); setUser(null); setStaffData(null);
          alert("Access Denied: You are not registered in the Employee Directory.");
        }
      } else { setUser(null); setStaffData(null); }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async () => {
    try {
      const snapTasks = await getDocs(query(collection(db, "tasks"), orderBy("createdAt", "desc")));
      setTasks(snapTasks.docs.map(d => ({ id: d.id, ...d.data() })));
      const snapLeaves = await getDocs(query(collection(db, "leaves"), orderBy("appliedAt", "desc")));
      setLeaves(snapLeaves.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { showToast("Failed to load data", "error"); }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      showToast(`Task marked as ${newStatus}`);
    } catch (error) { showToast("Failed to update status", "error"); }
  };

  const applyForLeave = async (e) => {
    e.preventDefault();
    try {
      const leaveData = { ...newLeave, applicantName: staffData.name, applicantEmail: staffData.email, status: "Pending", appliedAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "leaves"), leaveData);
      setLeaves([{ id: docRef.id, ...leaveData }, ...leaves]);
      setNewLeave({ startDate: "", endDate: "", reason: "", type: "Sick Leave" });
      showToast("Leave Request Submitted!");
    } catch (error) { showToast("Failed to submit leave", "error"); }
  };

  const myTasks = tasks.filter(t => t.assignedToEmail === user?.email);
  const myLeaves = leaves.filter(l => l.applicantEmail === user?.email);

  if (loadingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold uppercase tracking-widest">Verifying Access...</div>;

  if (!user || !staffData) return (
    <div className="min-h-screen bg-[#081f2c] flex items-center justify-center font-body p-6">
      <div className="bg-white p-12 rounded-sm shadow-2xl w-full max-w-md border-t-4 border-[#10b981] text-center">
        <div className="w-16 h-16 bg-[#10b981] text-white font-black text-2xl flex items-center justify-center rounded-sm mx-auto mb-6">RDS</div>
        <h1 className="font-display text-2xl font-black text-gray-900 mb-2">Staff Portal</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 mt-6 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs tracking-widest uppercase transition-all rounded-sm">Employee Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-body flex">
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl bg-white border-l-4 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"} ${toast.type === 'success' ? 'border-[#10b981]' : 'border-red-500'}`}>
        <span className="text-sm font-bold text-gray-800 tracking-wide">{toast.message}</span>
      </div>

      <aside className="w-64 bg-[#081f2c] text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10b981] font-black flex items-center justify-center rounded-sm text-lg text-white">RDS</div>
          <div><div className="font-bold tracking-widest uppercase text-[10px] text-gray-400">Employee</div><div className="text-sm font-bold">Workspace</div></div>
        </div>
        <div className="p-6 flex-1 flex flex-col gap-2">
          <button onClick={() => setActiveTab("my-tasks")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center justify-between ${activeTab === "my-tasks" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>✅ My Tasks {myTasks.filter(t => t.status === 'Pending').length > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{myTasks.filter(t => t.status === 'Pending').length}</span>}</button>
          <button onClick={() => setActiveTab("my-leaves")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "my-leaves" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>📅 Request Leave</button>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 shrink-0">
          <button onClick={() => signOut(auth)} className="w-full py-2 border border-white/20 text-gray-300 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto p-8">
        {activeTab === "my-tasks" && (
          <div className="animate-fade-in bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">Tasks Assigned to Me</div>
             <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Task & Deadline</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Assigned By</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">My Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {myTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="font-bold text-sm text-gray-900 mb-1">{task.title}</div><div className="text-xs text-gray-600 mb-2">{task.description}</div><div className="text-[10px] font-bold text-red-600 uppercase">Due: {task.deadline}</div></td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">{task.assignedBy}</td>
                      <td className="px-6 py-4"><select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} className="text-[10px] font-black uppercase rounded-sm px-3 py-2 border outline-none cursor-pointer"><option>Pending</option><option>In Progress</option><option>Completed</option></select></td>
                    </tr>
                  ))}
                  {myTasks.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase">No tasks assigned</td></tr>}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === "my-leaves" && (
          <div className="animate-fade-in grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1">
               <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                 <h3 className="font-display text-xl font-bold mb-6">Apply for Leave</h3>
                 <form onSubmit={applyForLeave} className="space-y-4">
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Type</label><select value={newLeave.type} onChange={e => setNewLeave({...newLeave, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"><option>Sick Leave</option><option>Casual Leave</option><option>Vacation</option></select></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Start Date</label><input type="date" required value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">End Date</label><input type="date" required value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Reason</label><textarea required rows="3" value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none resize-none" /></div>
                   <button type="submit" className="w-full py-3 bg-[#10b981] text-white font-bold text-[10px] uppercase rounded transition-colors">Submit Request</button>
                 </form>
               </div>
             </div>
             <div className="lg:col-span-2">
               <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">My Leave History</div>
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Dates & Type</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {myLeaves.map(leave => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4"><div className="font-bold text-sm text-gray-900">{new Date(leave.startDate).toLocaleDateString('en-IN')} to {new Date(leave.endDate).toLocaleDateString('en-IN')}</div><div className="text-[10px] font-black uppercase text-gray-500 mt-1 mb-2">{leave.type}</div><div className="text-xs text-gray-600 italic">"{leave.reason}"</div></td>
                          <td className="px-6 py-4"><div className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{leave.status}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

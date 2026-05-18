import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, doc, updateDoc, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore";

// --- IMPORT ALL OUR NEW ENTERPRISE MODULES ---
import NewsFeed from "./NewsFeed";
import FeedbackSystem from "./FeedbackSystem";
import LearningHub from "./LearningHub";
import PrivateNotepad from "./PrivateNotepad";
import AttendanceTracker from "./AttendanceTracker";
import CompanyCulture from "./CompanyCulture";
import PolicySignatures from "./PolicySignatures";
import SocialHub from "./SocialHub";
import OperationsHub from "./OperationsHub";
import ITHub from "./ITHub";
import PerformanceOKRs from "./PerformanceOKRs";
import SafetyDirectory from "./SafetyDirectory";
import MyCalendar from "./MyCalendar";
import Timesheets from "./Timesheets";
import OnCallRoster from "./OnCallRoster";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [staffData, setStaffData] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Mobile Sidebar & Navigation State
  const [activeTab, setActiveTab] = useState("my-tasks"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newLeave, setNewLeave] = useState({ startDate: "", endDate: "", reason: "", type: "Sick Leave" });
  const [isUploading, setIsUploading] = useState(false);

  // 📢 EMERGENCY BROADCAST SYSTEM
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    getDocs(query(collection(db, "broadcasts"), orderBy("createdAt", "desc"))).then(snap => {
      if (!snap.empty) setBroadcasts(snap.docs.map(d => d.data()));
    });
  }, [activeTab]);

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
          const profile = snap.docs[0].data();

          if (profile.role !== "User") {
            alert("You are an Admin/Director. Redirecting to your Master Workspace...");
            window.location.href = profile.role === "Super Admin" ? "/director" : "/admin";
            return;
          }

          setStaffData({ id: snap.docs[0].id, ...profile });
          setUser(currentUser);
          fetchAllData(currentUser.email); 
        } else {
          signOut(auth); setUser(null); setStaffData(null);
          alert("Access Denied: You are not registered in the Employee Directory.");
        }
      } else { setUser(null); setStaffData(null); }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async (userEmail) => {
    try {
      const snapTasks = await getDocs(query(collection(db, "tasks"), where("assignedToEmail", "==", userEmail)));
      const sortedTasks = snapTasks.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
      setTasks(sortedTasks);

      const snapLeaves = await getDocs(query(collection(db, "leaves"), where("applicantEmail", "==", userEmail)));
      const sortedLeaves = snapLeaves.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.appliedAt - a.appliedAt);
      setLeaves(sortedLeaves);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2MB", "error"); return; }
    
    setIsUploading(true);
    showToast("Uploading photo...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.secure_url) {
        await updateDoc(doc(db, "staff", staffData.id), { photoUrl: data.secure_url });
        setStaffData({ ...staffData, photoUrl: data.secure_url });
        showToast("Profile Photo Updated!");
      }
    } catch (error) { showToast("Failed to upload photo", "error"); }
    setIsUploading(false);
  };

  if (loadingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-500">Verifying Credentials...</div>;

  if (!user || !staffData) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-body p-6">
      <div className="bg-white p-12 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600 text-white font-black text-2xl flex items-center justify-center rounded-lg mx-auto mb-6 shadow-lg">RDS</div>
        <h1 className="font-display text-2xl font-black text-slate-900 mb-2">Employee Portal</h1>
        <p className="text-slate-500 text-sm mb-8">Secure Access Hub</p>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs tracking-widest uppercase transition-all rounded-lg shadow-sm">Secure Google Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-body flex">
      
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[100] bg-slate-900 text-white px-6 py-4 rounded-lg shadow-2xl animate-fade-in flex items-center gap-3">
          <span className="text-green-400">✓</span> <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 fixed md:static inset-y-0 left-0 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 overflow-y-auto`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 sticky top-0 bg-slate-900 z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black flex items-center justify-center rounded-lg shadow-lg text-lg">RDS</div>
          <div>
            <div className="font-bold tracking-widest uppercase text-[9px] text-blue-400">Raja Deepu Sooriya</div>
            <div className="text-sm font-bold text-white tracking-wide">Workspace</div>
          </div>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          
          <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-2 mb-2 px-6">My Workspace</div>
          <button onClick={() => {setActiveTab("my-tasks"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "my-tasks" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">✅</span> My Tasks</button>
          <button onClick={() => {setActiveTab("calendar"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "calendar" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">📅</span> My Calendar</button>
          <button onClick={() => {setActiveTab("notepad"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "notepad" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">📝</span> Private Notepad</button>
          <button onClick={() => {setActiveTab("request-leave"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "request-leave" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">🏖️</span> Request Leave</button>

          <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-6 mb-2 px-6">Company & Culture</div>
          <button onClick={() => {setActiveTab("news"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "news" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">📰</span> News & Updates</button>
          <button onClick={() => {setActiveTab("culture"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "culture" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">🔥</span> Pulse & Kudos</button>
          <button onClick={() => {setActiveTab("social"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "social" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">🤝</span> Clubs & Mentors</button>
          <button onClick={() => {setActiveTab("feedback"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "feedback" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">💡</span> Feedback Box</button>

          <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-6 mb-2 px-6">Operations & Tools</div>
          <button onClick={() => {setActiveTab("attendance"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "attendance" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">⏱️</span> Time & Location</button>
          <button onClick={() => {setActiveTab("timesheets"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "timesheets" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">📊</span> Timesheets</button>
          <button onClick={() => {setActiveTab("ithub"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "ithub" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">💻</span> IT Helpdesk</button>
          <button onClick={() => {setActiveTab("learning"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "learning" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">🎓</span> Learning Hub</button>
          <button onClick={() => {setActiveTab("performance"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "performance" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">🎯</span> Goals & OKRs</button>
          <button onClick={() => {setActiveTab("policies"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "policies" ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" : "hover:bg-slate-800/50 hover:text-white"}`}><span className="text-lg">✍️</span> Handbooks</button>
          
          <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-6 mb-2 px-6">Safety</div>
          <button onClick={() => {setActiveTab("safety"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "safety" ? "bg-red-500/10 text-red-400 border-r-2 border-red-500" : "hover:bg-slate-800/50 hover:text-red-400"}`}><span className="text-lg">🚑</span> First Responders</button>
          <button onClick={() => {setActiveTab("oncall"); setIsSidebarOpen(false);}} className={`text-left px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === "oncall" ? "bg-red-500/10 text-red-400 border-r-2 border-red-500" : "hover:bg-slate-800/50 hover:text-red-400"}`}><span className="text-lg">🌙</span> On-Call Roster</button>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab("my-profile")}>
            {staffData.photoUrl ? (
              <img src={staffData.photoUrl} alt="Profile" className="w-10 h-10 rounded-lg object-cover border border-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-sm text-white shadow-sm">{staffData.name.charAt(0)}</div>
            )}
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{staffData.name}</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-widest">{staffData.employeeId}</div>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-700 text-2xl leading-none pb-1">☰</button>
            <h2 className="font-display text-2xl font-black text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <button onClick={() => fetchAllData(staffData.email)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-blue-600 flex items-center gap-2">🔄 Refresh</button>
        </header>

        {/* 📢 LIVE EMERGENCY DIRECTIVE TICKER BAR */}
        {broadcasts.length > 0 && (
          <div className="mt-6 mx-4 md:mx-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-md flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-lg">📢</span>
              <div className="text-xs font-bold tracking-wide">
                <span className="uppercase font-black bg-white/20 px-2 py-0.5 rounded mr-2">DIRECTIVE ({broadcasts[0].channel})</span> 
                "{broadcasts[0].message}"
              </div>
            </div>
            <span className="text-[10px] font-mono opacity-80 font-bold">via {broadcasts[0].sender}</span>
          </div>
        )}

        <div className="p-4 md:p-8 pb-20 max-w-7xl mx-auto">
          
          {/* PROFILE */}
          {activeTab === "my-profile" && (
            <div className="animate-fade-in max-w-2xl bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden p-8">
              <h3 className="font-display text-2xl font-bold mb-6">Employee Profile</h3>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50 flex items-center justify-center shadow-inner relative group">
                    {staffData.photoUrl ? (
                      <img src={staffData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-300 font-black">{staffData.name.charAt(0)}</span>
                    )}
                    <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                       <span className="text-white text-xs font-bold uppercase tracking-widest text-center px-2">{isUploading ? "Uploading..." : "Change Photo"}</span>
                       <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</div>
                    <div className="text-gray-900 font-bold text-lg">{staffData.name}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Company Login Email</div>
                    <div className="text-gray-900 font-bold">{staffData.email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY TASKS */}
          {activeTab === "my-tasks" && (
            <div className="animate-fade-in bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-gray-200 font-bold text-sm text-slate-800">Tasks Assigned to Me</div>
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Task Details</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Assigned By</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">My Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-900 mb-1">{task.title}</div>
                        <div className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{task.description}</div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 inline-block px-2 py-1 rounded">Due: {task.deadline}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{task.assignedBy}</td>
                      <td className="px-6 py-4">
                        <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} className={`text-[10px] font-black tracking-widest uppercase rounded-sm px-3 py-2 border outline-none cursor-pointer ${task.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          <option>Pending</option><option>In Progress</option><option>Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">You have no assigned tasks.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* REQUEST LEAVE */}
          {activeTab === "request-leave" && (
            <div className="animate-fade-in grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1">
                 <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                   <h3 className="font-display text-xl font-bold mb-6 text-slate-900">New Request</h3>
                   <form onSubmit={applyForLeave} className="space-y-4">
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Leave Type</label><select value={newLeave.type} onChange={e => setNewLeave({...newLeave, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white"><option>Sick Leave</option><option>Casual Leave</option><option>Vacation</option></select></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Start Date</label><input type="date" required value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">End Date</label><input type="date" required value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Reason</label><textarea required rows="3" value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none resize-none" /></div>
                     <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded mt-4 transition-colors">Submit Request</button>
                   </form>
                 </div>
               </div>
               <div className="lg:col-span-2">
                 <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-gray-200 font-bold text-sm text-slate-800">My Leave History</div>
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="border-b border-gray-200"><th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-widest">Type & Dates</th><th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-widest">Reason</th><th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-widest">Status</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaves.map(leave => (
                          <tr key={leave.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3"><div className="font-bold text-sm text-slate-900">{new Date(leave.startDate).toLocaleDateString('en-IN')} to {new Date(leave.endDate).toLocaleDateString('en-IN')}</div><div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">{leave.type}</div></td>
                            <td className="px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap">{leave.reason}</td>
                            <td className="px-4 py-3"><span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{leave.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {/* PLUGINS */}
          {activeTab === "news" && <NewsFeed role={staffData.role} userName={staffData.name} />}
          {activeTab === "feedback" && <FeedbackSystem role={staffData.role} userEmail={staffData.email} userName={staffData.name} />}
          {activeTab === "learning" && <LearningHub role={staffData.role} />}
          {activeTab === "notepad" && <PrivateNotepad userEmail={staffData.email} />}
          {activeTab === "attendance" && <AttendanceTracker userEmail={staffData.email} userName={staffData.name} role={staffData.role} />}
          {activeTab === "culture" && <CompanyCulture userName={staffData.name} />}
          {activeTab === "policies" && <PolicySignatures userName={staffData.name} role={staffData.role} />}
          {activeTab === "social" && <SocialHub userName={staffData.name} userEmail={staffData.email} />}
          {activeTab === "ithub" && <ITHub role={staffData.role} userName={staffData.name} />}
          {activeTab === "calendar" && <MyCalendar userEmail={staffData.email} userName={staffData.name} />}
          {activeTab === "performance" && <PerformanceOKRs role={staffData.role} userName={staffData.name} />}
          {activeTab === "safety" && <SafetyDirectory role={staffData.role} />}
          {activeTab === "timesheets" && <Timesheets role={staffData.role} userName={staffData.name} userEmail={staffData.email} />}
          {activeTab === "oncall" && <OnCallRoster role={staffData.role} />}

        </div>
      </main>
    </div>
  );
}

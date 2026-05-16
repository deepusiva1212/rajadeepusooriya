import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, doc, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
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

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [staffData, setStaffData] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("my-tasks"); 
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newLeave, setNewLeave] = useState({ startDate: "", endDate: "", reason: "", type: "Sick Leave" });
  
  // NEW: Profile Photo Upload State
  const [isUploading, setIsUploading] = useState(false);

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

          // 🚨 FIX: Redirect instead of Sign Out
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

  // SECURE FETCH: Only pull data belonging to this specific user
  const fetchAllData = async (userEmail) => {
    try {
      const snapTasks = await getDocs(query(collection(db, "tasks"), where("assignedToEmail", "==", userEmail)));
      // Sort locally to avoid complex Firestore indexes
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

  // NEW: Upload Photo to Cloudinary and save to Staff Profile
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
          <button onClick={() => setActiveTab("my-tasks")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center justify-between ${activeTab === "my-tasks" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>✅ My Tasks {tasks.filter(t => t.status === 'Pending').length > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'Pending').length}</span>}</button>
          <button onClick={() => setActiveTab("my-leaves")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "my-leaves" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>📅 Request Leave</button>
          <button onClick={() => setActiveTab("profile")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "profile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>👤 My Profile</button>
          <button onClick={() => setActiveTab("news")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "news" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>📰 Company News</button>
          <button onClick={() => setActiveTab("feedback")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "feedback" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>💡 Feedback Box</button> 
          <button onClick={() => setActiveTab("learning")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "learning" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>🎓 Learning Hub</button>
          <button onClick={() => setActiveTab("notepad")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "notepad" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>📝 Private Notepad</button>
          <button onClick={() => setActiveTab("attendance")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "attendance" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>⏱️ Time & Location</button>
          <button onClick={() => setActiveTab("culture")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "culture" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>🔥 Pulse & Kudos</button>
          <button onClick={() => setActiveTab("policies")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "policies" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>✍️ Handbooks</button>
          <button onClick={() => setActiveTab("social")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "social" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>🤝 Clubs & Mentors</button>
          <button onClick={() => setActiveTab("operations")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "operations" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>⚡ Operations Hub</button>
          <button onClick={() => setActiveTab("calendar")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "calendar" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>📅 My Calendar</button>
          <button onClick={() => setActiveTab("performance")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "performance" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>🎯 Goals & OKRs</button>
          <button onClick={() => setActiveTab("ithub")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "ithub" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>💻 IT Helpdesk</button>
          <button onClick={() => setActiveTab("safety")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "safety" ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-red-400"}`}>🚑 Safety & First Aid</button>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            {staffData.photoUrl ? (
              <img src={staffData.photoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs uppercase">{staffData.name.charAt(0)}</div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{staffData.name}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {staffData.employeeId}</div>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-2 border border-white/20 text-gray-300 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto p-8">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
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
                <p className="text-[10px] text-gray-400 uppercase font-bold text-center">Click image to update<br/>Max 2MB (JPG/PNG)</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Employee ID</div>
                    <div className="text-corp-blue font-mono font-bold">{staffData.employeeId}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Access Role</div>
                    <div className="text-gray-900 font-bold">{staffData.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "news" && <NewsFeed role={staffData.role} userName={staffData.name} />}
        {activeTab === "feedback" && <FeedbackSystem role={staffData.role} userEmail={staffData.email} userName={staffData.name} />}
        {activeTab === "learning" && <LearningHub role={staffData.role} />}
        {activeTab === "notepad" && <PrivateNotepad userEmail={staffData.email} />}
        {activeTab === "attendance" && <AttendanceTracker userEmail={staffData.email} userName={staffData.name} role={staffData.role} />}
        {activeTab === "culture" && <CompanyCulture userName={staffData.name} />}
        {activeTab === "policies" && <PolicySignatures userName={staffData.name} role={staffData.role} />}
        {activeTab === "social" && <SocialHub userName={staffData.name} userEmail={staffData.email} />}
        {activeTab === "operations" && <OperationsHub role={staffData.role} userName={staffData.name} />}
        {activeTab === "analytics" && <HRAnalytics role={staffData.role} />}
        {activeTab === "calendar" && <MyCalendar userEmail={staffData.email} userName={staffData.name} />}
        {activeTab === "performance" && <PerformanceOKRs role={staffData.role} userName={staffData.name} />}
        {activeTab === "ithub" && <ITHub role={staffData.role} userName={staffData.name} />}
        {activeTab === "safety" && <SafetyDirectory role={staffData.role} />}

        {/* MY TASKS */}
        {activeTab === "my-tasks" && (
          <div className="animate-fade-in bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">Tasks Assigned to Me</div>
             <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Task Details</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Assigned By</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">My Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-gray-900 mb-1">{task.title}</div>
                        <div className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{task.description}</div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 inline-block px-2 py-1 rounded">Due: {task.deadline}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">{task.assignedBy}</td>
                      <td className="px-6 py-4">
                        <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} className={`text-[10px] font-black tracking-widest uppercase rounded-sm px-3 py-2 border outline-none cursor-pointer ${task.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          <option>Pending</option><option>In Progress</option><option>Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">You have no assigned tasks.</td></tr>}
                </tbody>
             </table>
          </div>
        )}

        {/* MY LEAVES */}
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
                   <button type="submit" className="w-full py-3 bg-[#10b981] hover:bg-green-600 text-white font-bold text-[10px] uppercase rounded transition-colors tracking-widest">Submit Request</button>
                 </form>
               </div>
             </div>
             <div className="lg:col-span-2">
               <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">My Leave History</div>
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Dates & Type</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaves.map(leave => (
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

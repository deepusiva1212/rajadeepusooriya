import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where, addDoc, serverTimestamp } from "firebase/firestore";

export default function DirectorPortal() {
  const [user, setUser] = useState(null);
  const [staffData, setStaffData] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [activeTab, setActiveTab] = useState("delegate-tasks"); 
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newTask, setNewTask] = useState({ assignedToEmail: "", title: "", description: "", deadline: "" });
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "User", employeeId: "", photoUrl: "" });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
          if (profile.role !== "Super Admin") {
            signOut(auth);
            alert("SECURITY BREACH: This portal is strictly for Directors / Super Admins.");
            return;
          }
          setStaffData({ id: snap.docs[0].id, ...profile });
          setUser(currentUser);
          fetchAllData();
        } else { signOut(auth); }
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
      const snapStaff = await getDocs(collection(db, "staff"));
      setStaffList(snapStaff.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { showToast("Failed to load data", "error"); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const assignedUser = staffList.find(s => s.email === newTask.assignedToEmail);
      const taskData = { ...newTask, assignedToName: assignedUser.name, assignedBy: staffData.name, status: "Pending", createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "tasks"), taskData);
      setTasks([{ id: docRef.id, ...taskData }, ...tasks]);
      setNewTask({ assignedToEmail: "", title: "", description: "", deadline: "" });
      showToast("Work Assigned!");
    } catch (error) { showToast("Failed to assign", "error"); }
  };

  const updateLeaveStatus = async (leaveId, newStatus) => {
    try {
      await updateDoc(doc(db, "leaves", leaveId), { status: newStatus, reviewedBy: staffData.name });
      setLeaves(leaves.map(l => l.id === leaveId ? { ...l, status: newStatus, reviewedBy: staffData.name } : l));
      showToast(`Leave ${newStatus}`);
    } catch (error) { showToast("Failed to update leave", "error"); }
  };

  // NEW: Upload Photo during Staff Creation
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2MB", "error"); return; }
    
    setIsUploadingPhoto(true);
    showToast("Uploading ID Photo...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setNewStaff({ ...newStaff, photoUrl: data.secure_url });
        showToast("Photo attached to profile.");
      }
    } catch (error) { showToast("Failed to upload photo", "error"); }
    setIsUploadingPhoto(false);
  };

  const addStaffMember = async (e) => {
    e.preventDefault();
    try {
      const newDoc = await addDoc(collection(db, "staff"), { ...newStaff, isActive: true });
      setStaffList([...staffList, { id: newDoc.id, ...newStaff, isActive: true }]);
      setNewStaff({ name: "", email: "", role: "User", employeeId: "", photoUrl: "" });
      showToast("Employee created!");
    } catch (error) { showToast("Failed to add", "error"); }
  };

  const removeStaffMember = async (staffId) => {
    if (!window.confirm("Permanently delete this user's access?")) return;
    try {
      await deleteDoc(doc(db, "staff", staffId));
      setStaffList(staffList.filter(s => s.id !== staffId));
      showToast("Access revoked.");
    } catch (error) { showToast("Failed to remove", "error"); }
  };

  if (loadingAuth) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">Securing Connection...</div>;

  if (!user || !staffData) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center font-body p-6">
      <div className="bg-white p-12 rounded-sm shadow-2xl w-full max-w-md border-t-4 border-corp-gold text-center">
        <div className="w-16 h-16 bg-gray-900 text-corp-gold font-black text-2xl flex items-center justify-center rounded-sm mx-auto mb-6 shadow-xl">RDS</div>
        <h1 className="font-display text-2xl font-black text-gray-900 mb-2">Director Portal</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 mt-6 bg-corp-gold hover:bg-yellow-600 text-white font-bold text-xs tracking-widest uppercase rounded-sm transition-colors">Director Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-body flex">
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl bg-white border-l-4 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"} border-corp-gold`}>
        <span className="text-sm font-bold text-gray-800 tracking-wide">{toast.message}</span>
      </div>

      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-corp-gold text-gray-900 font-black flex items-center justify-center rounded-sm text-lg shadow-lg">RDS</div>
          <div><div className="font-bold tracking-widest uppercase text-[10px] text-corp-gold">Master Control</div><div className="text-sm font-bold">Director Portal</div></div>
        </div>
        <div className="p-6 flex-1 flex flex-col gap-2">
          <button onClick={() => setActiveTab("delegate-tasks")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "delegate-tasks" ? "bg-white/10 text-corp-gold" : "text-gray-400 hover:text-white"}`}>📝 Delegate Work</button>
          <button onClick={() => setActiveTab("leave-approvals")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex justify-between ${activeTab === "leave-approvals" ? "bg-white/10 text-corp-gold" : "text-gray-400 hover:text-white"}`}>⚖️ Leave Approvals {leaves.filter(l => l.status === 'Pending').length > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{leaves.filter(l => l.status === 'Pending').length}</span>}</button>
          <button onClick={() => setActiveTab("manage-team")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors ${activeTab === "manage-team" ? "bg-white/10 text-corp-gold" : "text-gray-400 hover:text-white"}`}>👥 Team Roster</button>
        </div>
        <div className="p-6 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            {staffData.photoUrl ? (
              <img src={staffData.photoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs uppercase">{staffData.name.charAt(0)}</div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{staffData.name}</div>
              <div className="text-[10px] text-corp-gold font-bold uppercase tracking-widest">{staffData.role}</div>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-2 border border-white/20 text-gray-300 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto p-8">
        
        {activeTab === "delegate-tasks" && (
          <div className="animate-fade-in grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1">
               <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                 <h3 className="font-display text-xl font-bold mb-6">Assign New Work</h3>
                 <form onSubmit={handleAssignTask} className="space-y-4">
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Assign To</label><select required value={newTask.assignedToEmail} onChange={e => setNewTask({...newTask, assignedToEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"><option value="">Select Employee...</option>{staffList.filter(s => s.email !== staffData.email).map(s => <option key={s.email} value={s.email}>{s.name}</option>)}</select></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Task Title</label><input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Description</label><textarea required rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none resize-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Deadline Date</label><input type="date" required value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-black text-corp-gold font-bold text-[10px] uppercase tracking-widest rounded transition-colors shadow-sm">Issue Task</button>
                 </form>
               </div>
             </div>
             <div className="lg:col-span-2">
               <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">Master Task Directory</div>
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Employee</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Task Details</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {staffList.find(s => s.email === task.assignedToEmail)?.photoUrl ? (
                                <img src={staffList.find(s => s.email === task.assignedToEmail).photoUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-500">{task.assignedToName.charAt(0)}</div>
                              )}
                              <div>
                                <div className="font-bold text-sm text-gray-900">{task.assignedToName}</div>
                                <div className="text-[10px] text-gray-500">{task.assignedToEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><div className="font-bold text-sm text-gray-900 mb-1">{task.title}</div><div className="text-[10px] font-bold text-red-600 uppercase">Due: {task.deadline}</div></td>
                          <td className="px-6 py-4"><div className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${task.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{task.status}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}

        {activeTab === "leave-approvals" && (
          <div className="animate-fade-in bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">Employee Leave Requests</div>
             <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Employee</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Details</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest text-right">Director Decision</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map(leave => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {staffList.find(s => s.email === leave.applicantEmail)?.photoUrl ? (
                            <img src={staffList.find(s => s.email === leave.applicantEmail).photoUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-500">{leave.applicantName.charAt(0)}</div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-gray-900">{leave.applicantName}</div>
                            <div className="text-[10px] text-gray-500">{leave.applicantEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="font-bold text-sm text-[#10b981] mb-1">{new Date(leave.startDate).toLocaleDateString('en-IN')} to {new Date(leave.endDate).toLocaleDateString('en-IN')}</div><div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">{leave.type}</div><div className="text-xs text-gray-600 italic">"{leave.reason}"</div></td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'Pending' ? (
                          <div className="flex gap-2 justify-end"><button onClick={() => updateLeaveStatus(leave.id, 'Approved')} className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded uppercase border border-green-200 hover:bg-green-100">Approve</button><button onClick={() => updateLeaveStatus(leave.id, 'Rejected')} className="text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded uppercase border border-red-200 hover:bg-red-100">Reject</button></div>
                        ) : (
                          <div className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{leave.status}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === "manage-team" && (
          <div className="animate-fade-in grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1">
               <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                 <h3 className="font-display text-xl font-bold mb-6">Create Employee</h3>
                 <form onSubmit={addStaffMember} className="space-y-4">
                   
                   {/* NEW: Optional Photo Upload during creation */}
                   <div className="flex items-center gap-4 mb-4 p-4 border border-dashed border-gray-300 bg-gray-50 rounded-sm">
                     {newStaff.photoUrl ? (
                       <img src={newStaff.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">📷</div>
                     )}
                     <div className="flex-1">
                       <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">ID Photo (Optional)</label>
                       <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} className="w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                     </div>
                   </div>

                   <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Full Name</label><input type="text" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Login Email</label><input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value.toLowerCase()})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Employee ID</label><input type="text" required value={newStaff.employeeId} onChange={e => setNewStaff({...newStaff, employeeId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none" /></div>
                   <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Role</label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white"><option value="User">Standard Employee</option><option value="Admin">HR Manager</option><option value="Super Admin">Director</option></select></div>
                   <button type="submit" disabled={isUploadingPhoto} className="w-full py-3 bg-gray-900 hover:bg-black text-corp-gold font-bold text-[10px] uppercase rounded transition-colors shadow-sm">{isUploadingPhoto ? "Uploading..." : "Generate ID"}</button>
                 </form>
               </div>
             </div>
             <div className="lg:col-span-2">
               <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Directory</th><th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Role</th><th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {staffList.map(staff => (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {staff.photoUrl ? (
                                <img src={staff.photoUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-500">{staff.name.charAt(0)}</div>
                              )}
                              <div>
                                <div className="font-bold text-sm text-gray-900">{staff.name}</div>
                                <div className="text-[10px] text-gray-500">{staff.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><div className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase ${staff.role === 'Super Admin' ? 'bg-gray-900 text-corp-gold' : 'bg-gray-100 text-gray-700'}`}>{staff.role}</div><div className="text-[10px] font-mono text-gray-400 mt-1">{staff.employeeId}</div></td>
                          <td className="px-6 py-4 text-right">{staff.email !== user.email && <button onClick={() => removeStaffMember(staff.id)} className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded uppercase border border-red-200 transition-colors">Revoke Access</button>}</td>
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

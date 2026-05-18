import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where, addDoc } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import OfferLetterButton from "./OfferLetterButton";

export default function Admin() {
  // ─── AUTH & RBAC STATE ──────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [staffData, setStaffData] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // ─── DATA STATE ─────────────────────────────────────────────────────
  const [applications, setApplications] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // ─── UI STATE ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("All Brands");
  const [filterBatch, setFilterBatch] = useState("All Batches");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false); 
  const [selectedApps, setSelectedApps] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "User", employeeId: "" });

  // ─── EMAIL TEMPLATES ────────────────────────────────────────────────
  const defaultTemplates = {
    Welcome: "Dear [Name],\n\nWe have successfully received your application ([ID]) for the [Brand] internship.\n\nDetails Submitted:\nGender: [Gender]\nPrimary Phone: [Phone]\nAlt Phone: [AltPhone]\nUniversity: [University]\nCollege: [College]\nStream: [Stream]\nMajor: [Major]\nBatch: [Batch]\nYear of Study: [Year]\nDuration: [Duration]\nResume: [Resume]\nLinkedIn: [LinkedIn]\nPortfolio: [Portfolio]\n\nOur team will review your profile and get back to you.\n\nRegards,\nHR Team",
    Selected: "Dear [Name],\n\nCongratulations! We are pleased to inform you that your application ([ID]) for the [Brand] track has been selected.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
    Interviewing: "Dear [Name],\n\nYour application ([ID]) has been shortlisted! We would like to schedule an interview with you.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
    Rejected: "Dear [Name],\n\nThank you for applying. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
    BulkWelcome: "Dear Candidate,\n\nThis is an automated confirmation that we have received your internship application. We are currently processing it and will reach out soon.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
    Bulk: "Dear Candidate,\n\nWe are writing to provide an update regarding your recent application to our internship programme.\n\n[Insert Message Here]\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd"
  };

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('rds_email_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultTemplates, ...parsed }; 
    }
    return defaultTemplates;
  });

  useEffect(() => { localStorage.setItem('rds_email_templates', JSON.stringify(templates)); }, [templates]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ─── AUTHENTICATION & DATA FETCHING ─────────────────────────────────
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const q = query(collection(db, "staff"), where("email", "==", currentUser.email), where("isActive", "==", true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const profile = snap.docs[0].data();
          
          // 🚨 FIX: Redirect instead of Sign Out
          if (profile.role === "User") {
            alert("Standard Employees cannot access the HR Panel. Redirecting to Employee Workspace...");
            window.location.href = "/employee";
            return;
          }

          setStaffData({ id: snap.docs[0].id, ...profile });
          setUser(currentUser);
          fetchAllData();
        } else {
          signOut(auth); setUser(null); setStaffData(null);
          alert("Access Denied: Your email is not registered as active HR Staff.");
        }
      } else { setUser(null); setStaffData(null); }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async (role) => {
    setLoadingData(true);
    try {
      const qApps = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
      const snapApps = await getDocs(qApps);
      setApplications(snapApps.docs.map(doc => ({ id: doc.id, ...doc.data(), dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now" })));

      const qEnqs = query(collection(db, "enquiries"), orderBy("submittedAt", "desc"));
      const snapEnqs = await getDocs(qEnqs);
      setEnquiries(snapEnqs.docs.map(doc => ({ id: doc.id, ...doc.data(), dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now" })));

      if (role === "Super Admin") {
        const snapStaff = await getDocs(collection(db, "staff"));
        setStaffList(snapStaff.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) { showToast("Failed to sync data", "error"); }
    setLoadingData(false);
  };

  const updateApplicationStatus = async (app, newStatus) => {
    if (staffData.role === "User") { showToast("Access Denied: Users cannot change status.", "error"); return; }
    try {
      const historyEntry = { status: newStatus, updatedBy: staffData.name, email: staffData.email, date: new Date().toLocaleString('en-IN') };
      const newHistory = [...(app.history || []), historyEntry];
      await updateDoc(doc(db, "applications", app.id), { status: newStatus, history: newHistory });
      setApplications(applications.map(a => a.id === app.id ? { ...a, status: newStatus, history: newHistory } : a));
      showToast(`Status updated to ${newStatus}`);
    } catch (e) { showToast("Failed to update status.", "error"); }
  };

  const handleSoftDelete = async () => {
    if (staffData.role === "User") { showToast("Access Denied.", "error"); return; }
    const password = window.prompt("SECURITY CHECK: Type 'DELETE' to confirm:");
    if (password !== "DELETE") { showToast("Deletion Cancelled", "error"); return; }
    const deleteNote = window.prompt("Optional reason for deleting:") || "No reason provided";
    
    showToast("Moving to Trash...");
    try {
      const deletionTime = new Date().toLocaleString('en-IN');
      for (const appId of selectedApps) {
        await updateDoc(doc(db, "applications", appId), { isDeleted: true, deletedAt: deletionTime, deletedBy: staffData.name, deleteNote: deleteNote });
      }
      setApplications(applications.map(app => selectedApps.includes(app.id) ? { ...app, isDeleted: true, deletedAt: deletionTime, deletedBy: staffData.name, deleteNote: deleteNote } : app));
      setSelectedApps([]);
      showToast("Moved to Trash.");
    } catch (error) { showToast("Failed to delete.", "error"); }
  };

  const handlePermanentDelete = async (appId) => {
    if (staffData.role !== "Super Admin") { showToast("Super Admins only.", "error"); return; }
    if (!window.confirm("Permanently erase data?")) return;
    try { await deleteDoc(doc(db, "applications", appId)); setApplications(applications.filter(a => a.id !== appId)); showToast("Permanently deleted."); } 
    catch (error) { showToast("Failed to delete.", "error"); }
  };

  const handleRestore = async (appId) => {
    try { await updateDoc(doc(db, "applications", appId), { isDeleted: false }); setApplications(applications.map(a => a.id === appId ? { ...a, isDeleted: false } : a)); showToast("Restored!"); } 
    catch (error) { showToast("Failed to restore.", "error"); }
  };

  const addStaffMember = async (e) => {
    e.preventDefault();
    try { const newDoc = await addDoc(collection(db, "staff"), { ...newStaff, isActive: true }); setStaffList([...staffList, { id: newDoc.id, ...newStaff, isActive: true }]); setNewStaff({ name: "", email: "", role: "User", employeeId: "" }); showToast("Staff added!"); } 
    catch (error) { showToast("Failed to add staff.", "error"); }
  };

  const removeStaffMember = async (staffId) => {
    if (!window.confirm("Revoke access?")) return;
    try { await deleteDoc(doc(db, "staff", staffId)); setStaffList(staffList.filter(s => s.id !== staffId)); showToast("Access revoked."); } 
    catch (error) { showToast("Failed to remove staff.", "error"); }
  };

  // ─── EMAILS WITH ALL TAGS ───────────────────────────────────────────
  const sendIndividualEmail = (app, isWelcome = false) => {
    let bodyText = isWelcome ? templates.Welcome : (templates[app.status || "Pending"] || templates.Bulk);
    
    bodyText = bodyText.replace(/\[Name\]/g, app.name || "Candidate")
                       .replace(/\[ID\]/g, app.applicationId || "N/A")
                       .replace(/\[Brand\]/g, app.brand || "our company")
                       .replace(/\[Gender\]/g, app.gender || "N/A")
                       .replace(/\[Phone\]/g, app.phone || "N/A")
                       .replace(/\[AltPhone\]/g, app.altPhone || "None")
                       .replace(/\[University\]/g, app.university || "N/A")
                       .replace(/\[College\]/g, app.college || "N/A")
                       .replace(/\[Stream\]/g, app.stream || "N/A")
                       .replace(/\[Major\]/g, app.major || "N/A")
                       .replace(/\[Batch\]/g, app.batch || "N/A")
                       .replace(/\[Year\]/g, app.year || "N/A")
                       .replace(/\[Duration\]/g, app.duration || "N/A")
                       .replace(/\[LinkedIn\]/g, app.linkedin || "Not Provided")
                       .replace(/\[Portfolio\]/g, app.portfolio || "Not Provided")
                       .replace(/\[Resume\]/g, app.resumeUrl || "Not Attached");

    const subject = encodeURIComponent(isWelcome ? `Application Received: ${app.applicationId}` : `Update on your Application: ${app.applicationId}`);
    window.location.href = `mailto:${app.email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  const sendBulkEmail = (isWelcome = false) => {
    const selectedEmails = applications.filter(app => selectedApps.includes(app.id)).map(app => app.email).join(",");
    const subject = encodeURIComponent(isWelcome ? "Application Received - Raja Deepu Sooriya Pvt Ltd" : "Update on your Application - Raja Deepu Sooriya Pvt Ltd");
    const body = encodeURIComponent(isWelcome ? templates.BulkWelcome : templates.Bulk);
    window.location.href = `mailto:?bcc=${selectedEmails}&subject=${subject}&body=${body}`;
  };

  // ─── RESTORED MISSING FUNCTIONS: EXPORT, ZIP, AND DUPLICATES ────────
  const exportToCSV = () => {
    if (!filteredApps || filteredApps.length === 0) {
      showToast("No active data entries to compile.", "error");
      return;
    }

    // 1. Maintain your exact 15 column headers
    const headers = ["App ID", "Date", "Batch", "Name", "Gender", "Email", "Phone", "University", "College", "Stream", "Major", "Year", "Brand", "Duration", "Status"];

    // 2. Sanitation logic to prevent commas and newlines from corrupting Excel cells
    const cleanCSVField = (str) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    // 3. Map your fields matching your exact database keys perfectly
    const rows = filteredApps.map(a => [
      cleanCSVField(a.applicationId),
      cleanCSVField(a.dateStr),
      cleanCSVField(a.batch),
      cleanCSVField(a.name),
      cleanCSVField(a.gender),
      cleanCSVField(a.email),
      cleanCSVField(a.phone),
      cleanCSVField(a.university),
      cleanCSVField(a.college),
      cleanCSVField(a.stream),
      cleanCSVField(a.major),
      cleanCSVField(a.year),
      cleanCSVField(a.brand),
      cleanCSVField(a.duration),
      cleanCSVField(a.status || 'Pending')
    ].join(","));

    // 4. Safe UTF-8 byte stream generation
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(",")].concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RDS_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);

    showToast("Excel Report Downloaded");
  };

  const downloadSelectedResumes = async () => {
    showToast("Zipping files... Please wait.");
    const zip = new JSZip(); const folder = zip.folder("RDS_Resumes");
    const appsToDownload = applications.filter(app => selectedApps.includes(app.id) && app.resumeUrl);
    for (const app of appsToDownload) {
      try {
        const response = await fetch(app.resumeUrl); const blob = await response.blob();
        folder.file(`${app.name.replace(/[^a-z0-9]/gi, '_')}_${app.applicationId}.pdf`, blob);
      } catch (error) { console.error("Could not download", app.name); }
    }
    zip.generateAsync({ type: "blob" }).then(function(content) { saveAs(content, `RDS_Resumes.zip`); showToast("Download Complete!"); });
  };

  const isDuplicate = (val, field) => { 
    if (!val) return false; 
    return activeApplications.filter(a => a[field] === val).length > 1; 
  };

  // ─── FILTERS & DATA PREP ────────────────────────────────────────────
  const activeApplications = applications.filter(a => !a.isDeleted);
  const deletedApplications = applications.filter(a => a.isDeleted);
  const availableBatches = ["All Batches", ...Array.from(new Set(activeApplications.map(a => a.batch).filter(Boolean)))];

  let filteredApps = activeApplications.filter(app => {
    const searchStr = search.toLowerCase();
    const matchesSearch = (app.name?.toLowerCase().includes(searchStr)) || (app.applicationId?.toLowerCase().includes(searchStr)) || (app.email?.toLowerCase().includes(searchStr)) || (app.phone?.includes(searchStr));
    const matchesBrand = filterBrand === "All Brands" || app.brand === filterBrand;
    const matchesBatch = filterBatch === "All Batches" || app.batch === filterBatch;
    const matchesDup = showDuplicatesOnly ? (isDuplicate(app.phone, 'phone') || isDuplicate(app.email, 'email')) : true;
    return matchesSearch && matchesBrand && matchesBatch && matchesDup;
  });

  if (showDuplicatesOnly) { filteredApps.sort((a, b) => (a.email || "").localeCompare(b.email || "")); }

  const handleSelectAll = (e) => { e.target.checked ? setSelectedApps(filteredApps.map(a => a.id)) : setSelectedApps([]); };
  const handleSelectOne = (id) => { selectedApps.includes(id) ? setSelectedApps(selectedApps.filter(appId => appId !== id)) : setSelectedApps([...selectedApps, id]); };

  // ─── AUTH SCREEN ────────────────────────────────────────────────────
  if (loadingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold uppercase tracking-widest">Verifying Corporate Credentials...</div>;

  if (!user || !staffData) return (
    <div className="min-h-screen bg-[#0a1128] flex items-center justify-center font-body p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="bg-white p-12 rounded-sm shadow-2xl w-full max-w-md border-t-4 border-corp-red text-center relative z-10">
        <div className="w-16 h-16 bg-corp-red text-white font-black text-2xl flex items-center justify-center rounded-sm mx-auto mb-6 shadow-lg">RDS</div>
        <h1 className="font-display text-2xl font-black text-gray-900 mb-2">Corporate Portal</h1>
        <p className="text-gray-500 text-sm mb-8">Authorized HR Personnel Only</p>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs tracking-widest uppercase transition-all rounded-sm shadow-sm hover:shadow-md">Secure Google Login</button>
      </div>
    </div>
  );

  // ─── MAIN DASHBOARD RENDER ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 font-body flex">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl bg-white border-l-4 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"} ${toast.type === 'success' ? 'border-green-500' : 'border-corp-red'}`}>
        <span className="text-sm font-bold text-gray-800 tracking-wide">{toast.message}</span>
      </div>

      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside className="w-64 bg-[#0a1128] text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-corp-red font-black flex items-center justify-center rounded-sm text-lg shadow-lg">RDS</div>
          <div>
            <div className="font-bold tracking-widest uppercase text-[10px] text-gray-400">Enterprise Panel</div>
            <div className="text-sm font-bold">HR Workspace</div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-2">
          <div className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-2">Menu</div>
          <button onClick={() => setActiveTab("dashboard")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "dashboard" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>📊 Dashboard</button>
          <button onClick={() => setActiveTab("applications")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "applications" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>📥 Applications</button>
          <button onClick={() => setActiveTab("enquiries")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "enquiries" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>💬 Enquiries</button>
          <button onClick={() => setActiveTab("templates")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "templates" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>⚙️ Email Templates</button>
          
          <div className="text-[10px] font-black text-gray-500 tracking-widest uppercase mt-6 mb-2">System Admin</div>
          <button onClick={() => setActiveTab("trash")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "trash" ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-red-400 hover:bg-white/5"}`}>🗑️ Trash Bin ({deletedApplications.length})</button>
          {staffData.role === "Super Admin" && (
            <button onClick={() => setActiveTab("team")} className={`text-left px-4 py-3 rounded-sm text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === "team" ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-blue-400 hover:bg-white/5"}`}>👥 Team Access</button>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs uppercase">{staffData.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{staffData.name}</div>
              <div className="text-[10px] text-corp-gold font-bold uppercase tracking-widest">{staffData.role}</div>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-2 border border-white/20 text-gray-300 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h2 className="font-display text-2xl font-black text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => fetchAllData(staffData.role)} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-corp-blue flex items-center gap-2">🔄 {loadingData ? "Syncing..." : "Refresh"}</button>
          </div>
        </header>

        <div className="p-8">

          {/* ─── TAB: DASHBOARD ─── */}
          {activeTab === "dashboard" && (
            <div className="animate-fade-in space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-corp-blue">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Active Applications</div>
                  <div className="text-4xl font-display font-black text-gray-900">{activeApplications.length}</div>
                </div>
                <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-yellow-400">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Review</div>
                  <div className="text-4xl font-display font-black text-gray-900">{activeApplications.filter(a => !a.status || a.status === 'Pending').length}</div>
                </div>
                <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-green-500">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Selected Candidates</div>
                  <div className="text-4xl font-display font-black text-gray-900">{activeApplications.filter(a => a.status === 'Selected').length}</div>
                </div>
                <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-purple-500">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Interviewing</div>
                  <div className="text-4xl font-display font-black text-gray-900">{activeApplications.filter(a => a.status === 'Interviewing').length}</div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200">
                <h3 className="font-display text-xl font-bold mb-6">Welcome back, {staffData.name}</h3>
                <p className="text-gray-600 text-sm mb-4">You are logged in as a <b>{staffData.role}</b>. Your Employee ID is <span className="font-mono bg-gray-100 px-2 py-1 rounded">{staffData.employeeId}</span>.</p>
                <p className="text-gray-500 text-sm">Use the sidebar to navigate through the HR Workspace. All status changes and deletions are securely logged in the system audit trail.</p>
              </div>
            </div>
          )}

          {/* ─── TAB: APPLICATIONS ─── */}
          {activeTab === "applications" && (
            <div className="animate-fade-in">
              {/* RESTORED FILTERS AND BUTTONS */}
              <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 flex-wrap flex-1">
                  <input type="text" placeholder="Search ID, Name, Email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-sm text-sm outline-none focus:border-corp-blue" />
                  <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-gray-50 outline-none">
                    {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-gray-50 outline-none">
                    <option>All Brands</option><option>MyTripRaja</option><option>MarketerRaja</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} className={`px-4 py-2 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${showDuplicatesOnly ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{showDuplicatesOnly ? "⚠️ Clear Audit" : "Audit Duplicates"}</button>
                  <button onClick={exportToCSV} className="bg-corp-gold text-white px-4 py-2 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-yellow-700 shadow-sm">Export Excel</button>
                </div>
              </div>

              {/* BULK ACTION BAR */}
              {selectedApps.length > 0 && (
                <div className="bg-corp-blue text-white p-4 mb-6 rounded-sm shadow-md flex flex-wrap items-center justify-between animate-fade-in gap-4">
                  <div className="text-sm font-bold">{selectedApps.length} Selected</div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleSoftDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm flex items-center gap-2 transition-colors">🗑️ Trash</button>
                    <button onClick={() => sendBulkEmail(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors">✉️ Send Welcome</button>
                    <button onClick={() => sendBulkEmail(false)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors">✉️ Bulk Update</button>
                    <button onClick={downloadSelectedResumes} className="px-4 py-2 bg-corp-gold hover:bg-yellow-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors">⬇️ ZIP Resumes</button>
                  </div>
                </div>
              )}

              {/* TABLE */}
              <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 w-10"><input type="checkbox" checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} onChange={handleSelectAll} className="w-4 h-4 accent-corp-red cursor-pointer" /></th>
                      <th className="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID / Batch</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate & Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Education</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact & Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApps.map(app => (
                      <tr key={app.id} className={`hover:bg-gray-50 ${selectedApps.includes(app.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedApps.includes(app.id)} onChange={() => handleSelectOne(app.id)} className="w-4 h-4 accent-corp-red cursor-pointer" /></td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-corp-red mb-1 font-mono">{app.applicationId}</div>
                          <div className="text-[10px] text-gray-500 font-bold bg-gray-100 inline-block px-2 py-0.5 rounded">{app.batch || "No Batch"}</div>
                          <div className="text-[9px] text-gray-400 mt-1">{app.dateStr}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 mb-2 flex items-center justify-between gap-4">
                            {app.name}
                            <div className="flex gap-2">
                              <button onClick={() => sendIndividualEmail(app, true)} className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-100 font-bold" title="Send Welcome Email">Welcome</button>
                              <button onClick={() => sendIndividualEmail(app, false)} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-bold" title="Send Status Email">Update</button>
                            </div>
                          </div>
                          <select 
                            disabled={staffData.role === "User"}
                            value={app.status || "Pending"} 
                            onChange={(e) => updateApplicationStatus(app, e.target.value)}
                            className={`text-[9px] font-black tracking-widest uppercase rounded-sm px-2 py-1 border outline-none cursor-pointer ${staffData.role === "User" ? "opacity-50" : ""} ${(!app.status || app.status === 'Pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''} ${app.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''} ${app.status === 'Selected' ? 'bg-green-50 text-green-700 border-green-200' : ''} ${app.status === 'Rejected' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}`}
                          >
                            <option value="Pending">Pending</option><option value="Reviewed">Reviewed</option><option value="Interviewing">Interviewing</option><option value="Selected">Selected</option><option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-900">{app.college}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{app.stream} • {app.major} • {app.gender}</div>
                          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-corp-blue">{app.brand} • {app.duration}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-2">
                              <div className={`text-[10px] ${isDuplicate(app.phone, 'phone') ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>P: {app.phone} {isDuplicate(app.phone, 'phone') && "⚠️"}</div>
                              <div className={`text-[10px] hover:underline ${isDuplicate(app.email, 'email') ? 'text-orange-600 font-bold' : 'text-blue-600'}`}><a href={`mailto:${app.email}`}>{app.email}</a> {isDuplicate(app.email, 'email') && "⚠️"}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-red-50 text-corp-red px-2 py-0.5 rounded font-black uppercase border border-red-100">PDF</a>}
                                {/* AUDIT LOG VIEW */}
                                {app.history && app.history.length > 0 && (
                                  <div className="relative group inline-block">
                                    <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black uppercase border border-gray-200 cursor-help">📜 Audit Logs</span>
                                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-gray-900 text-white text-[10px] p-3 rounded hidden group-hover:block z-50 shadow-xl max-h-48 overflow-y-auto">
                                      <div className="font-bold border-b border-gray-700 pb-1 mb-2">History</div>
                                      {app.history.slice().reverse().map((h, i) => (
                                        <div key={i} className="mb-2 last:mb-0">
                                          <span className="text-gray-400">{h.date}</span><br/>
                                          Status changed to <span className="font-bold text-corp-gold">{h.status}</span><br/>
                                          by {h.updatedBy}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">No applications found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB: TRASH BIN ─── */}
          {activeTab === "trash" && (
            <div className="animate-fade-in bg-white border border-red-200 rounded-sm shadow-sm overflow-hidden">
               <div className="bg-red-50 p-4 border-b border-red-100">
                  <h3 className="font-bold text-red-800 text-sm">Trash Bin (Soft Deleted Records)</h3>
                  <p className="text-xs text-red-600 mt-1">These records are hidden from the main view. Super Admins can permanently erase them.</p>
               </div>
               <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">ID & Candidate</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">Deletion Details</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedApplications.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-bold text-gray-900">{app.applicationId}</div>
                          <div className="text-sm font-bold text-gray-600 mt-1">{app.name}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          <div><span className="font-bold text-gray-900">Deleted By:</span> {app.deletedBy}</div>
                          <div><span className="font-bold text-gray-900">Date:</span> {app.deletedAt}</div>
                          <div className="mt-2 bg-gray-100 p-2 rounded-sm border border-gray-200 italic">"{app.deleteNote}"</div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => handleRestore(app.id)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-2 rounded border border-blue-100">Restore</button>
                          {staffData.role === "Super Admin" && (
                            <button onClick={() => handlePermanentDelete(app.id)} className="text-[10px] font-bold text-white uppercase tracking-widest bg-red-600 hover:bg-red-700 px-3 py-2 rounded shadow-sm">Erase</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {deletedApplications.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase">Trash is empty</td></tr>}
                  </tbody>
               </table>
            </div>
          )}

          {/* ─── TAB: TEAM MANAGEMENT ─── */}
          {activeTab === "team" && staffData.role === "Super Admin" && (
            <div className="animate-fade-in grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1">
                 <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                   <h3 className="font-display text-xl font-bold mb-6">Add Staff Member</h3>
                   <form onSubmit={addStaffMember} className="space-y-4">
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Full Name</label><input type="text" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-corp-blue" /></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gmail Address (For Login)</label><input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value.toLowerCase()})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-corp-blue" /></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Employee ID</label><input type="text" required value={newStaff.employeeId} onChange={e => setNewStaff({...newStaff, employeeId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-corp-blue" /></div>
                     <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Access Role</label>
                        <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-corp-blue bg-white">
                          <option value="User">User (View Only)</option><option value="Admin">Admin (Review & Email)</option><option value="Super Admin">Super Admin (Full Access)</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-3 bg-corp-blue text-white font-bold text-[10px] uppercase tracking-widest rounded mt-4">Create Access</button>
                   </form>
                 </div>
               </div>

               <div className="lg:col-span-2">
                 <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">Active HR Directory</div>
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="border-b border-gray-200"><th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Staff</th><th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Role & ID</th><th className="px-4 py-3 text-[10px] text-gray-500 uppercase text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {staffList.map(staff => (
                          <tr key={staff.id}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-sm text-gray-900">{staff.name}</div>
                              <div className="text-[10px] text-gray-500">{staff.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${staff.role === 'Super Admin' ? 'bg-corp-gold text-white' : staff.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{staff.role}</div>
                              <div className="text-[10px] font-mono text-gray-400 mt-1">{staff.employeeId}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {staff.email !== user.email && (
                                <button onClick={() => removeStaffMember(staff.id)} className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-widest border border-red-200 px-2 py-1 rounded bg-red-50 hover:bg-red-100">Revoke</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {/* ─── TAB: TEMPLATES ─── */}
          {activeTab === "templates" && (
            <div className="animate-fade-in bg-white p-8 rounded-sm shadow-sm border border-gray-200">
              <h3 className="font-display text-2xl font-bold mb-2">Email Templates</h3>
              <p className="text-sm text-gray-500 mb-6">These templates auto-fill when you use the email buttons. You can use tags like <b>[Name]</b>, <b>[ID]</b>, <b>[Brand]</b>, and <b>[Resume]</b>.</p>
              <div className="grid md:grid-cols-2 gap-8">
                {Object.keys(templates).map(key => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold tracking-widest uppercase mb-2 text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()} Email</label>
                    <textarea value={templates[key]} onChange={(e) => setTemplates({...templates, [key]: e.target.value})} className="w-full h-40 p-4 border border-gray-300 rounded-sm text-xs font-body focus:border-corp-blue outline-none resize-none bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB: ENQUIRIES ─── */}
          {activeTab === "enquiries" && (
            <table className="w-full text-left border-collapse bg-white shadow-sm rounded-sm overflow-hidden">
                <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-48">Date</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-64">Sender</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.map(enq => (
                    <tr key={enq.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 text-xs text-gray-400 font-bold align-top">{enq.dateStr}</td><td className="px-6 py-4 align-top"><div className="font-bold text-gray-900 mb-2">{enq.name}</div><a href={`mailto:${enq.email}`} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-blue-100">Reply Email</a></td><td className="px-6 py-4 align-top text-sm text-gray-700 whitespace-pre-wrap font-body">{enq.message}</td></tr>
                  ))}
                </tbody>
            </table>
          )}

        </div>
      </main>
    </div>
  );
}
 

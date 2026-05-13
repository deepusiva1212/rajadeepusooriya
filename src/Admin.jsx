import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ADMIN_EMAIL = "rajadeepusooriya.pvt@gmail.com"; 

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [applications, setApplications] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [activeTab, setActiveTab] = useState("applications");
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("All Brands");
  const [filterYear, setFilterYear] = useState("All Years");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  
  // NEW: Bulk Selection State
  const [selectedApps, setSelectedApps] = useState([]);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // NEW: Email Templates (Saves to LocalStorage so you don't lose edits)
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('rds_email_templates');
    return saved ? JSON.parse(saved) : {
      Selected: "Dear [Name],\n\nCongratulations! We are pleased to inform you that your application ([ID]) for the [Brand] track has been selected.\n\nOur team will contact you shortly with the next steps.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
      Interviewing: "Dear [Name],\n\nYour application ([ID]) has been shortlisted! We would like to schedule an interview with you.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
      Rejected: "Dear [Name],\n\nThank you for applying to Raja Deepu Sooriya Pvt Ltd.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe wish you the best in your future endeavors.\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd",
      Bulk: "Dear Candidate,\n\nWe are writing to provide an update regarding your recent application to our internship programme.\n\n[Insert Message Here]\n\nRegards,\nRaja Deepu Sooriya Pvt Ltd"
    };
  });

  // Save templates whenever they change
  useEffect(() => { localStorage.setItem('rds_email_templates', JSON.stringify(templates)); }, [templates]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        fetchAllData(false);
      } else {
        setUser(null);
        if (currentUser) signOut(auth);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async (showNotification = true) => {
    setLoadingData(true);
    try {
      const qApps = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
      const snapApps = await getDocs(qApps);
      setApplications(snapApps.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now"
      })));

      const qEnqs = query(collection(db, "enquiries"), orderBy("submittedAt", "desc"));
      const snapEnqs = await getDocs(qEnqs);
      setEnquiries(snapEnqs.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now"
      })));
      if (showNotification) showToast("Database Synced Successfully");
    } catch (e) { 
      console.error(e); 
      if (showNotification) showToast("Failed to sync data", "error");
    }
    setLoadingData(false);
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus });
      setApplications(applications.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      showToast(`Candidate status updated to ${newStatus}`);
    } catch (e) { showToast("Failed to update status.", "error"); }
  };

  // ─── NEW: EMAIL LOGIC ───────────────────────────────────────────────────
  const sendIndividualEmail = (app) => {
    const currentStatus = app.status || "Pending";
    let bodyText = templates[currentStatus] || templates.Bulk;
    
    // Replace placeholders with actual data
    bodyText = bodyText.replace(/\[Name\]/g, app.name)
                       .replace(/\[ID\]/g, app.applicationId)
                       .replace(/\[Brand\]/g, app.brand || "our company");

    const subject = encodeURIComponent(`Update on your Application: ${app.applicationId}`);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${app.email}?subject=${subject}&body=${body}`;
  };

  const sendBulkEmail = () => {
    const selectedEmails = applications.filter(app => selectedApps.includes(app.id)).map(app => app.email).join(",");
    const subject = encodeURIComponent("Update on your Application - Raja Deepu Sooriya Pvt Ltd");
    const body = encodeURIComponent(templates.Bulk);
    // Uses BCC so candidates don't see each other's emails
    window.location.href = `mailto:?bcc=${selectedEmails}&subject=${subject}&body=${body}`;
  };

  // ─── NEW: ZIP DOWNLOAD LOGIC ────────────────────────────────────────────
  const downloadSelectedResumes = async () => {
    showToast("Zipping files... Please wait.");
    const zip = new JSZip();
    const folder = zip.folder("RDS_Resumes");
    
    const appsToDownload = applications.filter(app => selectedApps.includes(app.id) && app.resumeUrl);
    
    for (const app of appsToDownload) {
      try {
        const response = await fetch(app.resumeUrl);
        const blob = await response.blob();
        // File format: Deepu_RDS-2026-0010.pdf
        const fileName = `${app.name.replace(/[^a-z0-9]/gi, '_')}_${app.applicationId}.pdf`;
        folder.file(fileName, blob);
      } catch (error) { console.error("Could not download file for", app.name); }
    }

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, `RDS_Resumes_${new Date().toLocaleDateString().replace(/\//g,'-')}.zip`);
      showToast("Download Complete!");
    });
  };

  const exportToCSV = () => { /* ... (Kept the same for brevity) ... */
    const headers = ["App ID,Date,Name,Email,Phone,College,Year,Brand,Duration,Role,Status"];
    const rows = applications.map(a => 
      `"${a.applicationId}","${a.dateStr}","${a.name}","${a.email}","${a.phone}","${a.college}","${a.year}","${a.brand}","${a.duration}","${a.role || 'Any'}","${a.status || 'Pending'}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `RDS_Applications.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel Report Downloaded");
  };

  const isDuplicate = (val, field) => { if (!val) return false; return applications.filter(a => a[field] === val).length > 1; };

  let filteredApps = applications.filter(app => {
    const searchStr = search.toLowerCase();
    const matchesSearch = (app.name && app.name.toLowerCase().includes(searchStr)) || (app.college && app.college.toLowerCase().includes(searchStr)) || (app.email && app.email.toLowerCase().includes(searchStr)) || (app.phone && app.phone.includes(searchStr));
    const matchesBrand = filterBrand === "All Brands" || (app.brand && app.brand.includes(filterBrand));
    const matchesYear = filterYear === "All Years" || app.year === filterYear;
    const matchesDup = showDuplicatesOnly ? (isDuplicate(app.phone, 'phone') || isDuplicate(app.email, 'email')) : true;
    return matchesSearch && matchesBrand && matchesYear && matchesDup;
  });

  if (showDuplicatesOnly) { filteredApps.sort((a, b) => (a.email || "").localeCompare(b.email || "")); }

  // Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedApps(filteredApps.map(a => a.id));
    else setSelectedApps([]);
  };

  const handleSelectOne = (id) => {
    if (selectedApps.includes(id)) setSelectedApps(selectedApps.filter(appId => appId !== id));
    else setSelectedApps([...selectedApps, id]);
  };

  if (loadingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold uppercase tracking-widest">RDS Auth Check...</div>;

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-body p-6">
      <div className="bg-white p-10 rounded-sm shadow-xl w-full max-w-md border-t-4 border-corp-red text-center">
        <div className="w-12 h-12 bg-corp-red text-white font-black text-xl flex items-center justify-center rounded-sm mx-auto mb-4">RDS</div>
        <h1 className="font-display text-2xl font-black text-gray-900">Admin Portal</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 mt-8 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs tracking-widest uppercase transition-colors rounded-sm">Sign in with Google</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-body relative overflow-hidden">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl bg-white border-l-4 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"} ${toast.type === 'success' ? 'border-green-500' : 'border-corp-red'}`}>
        <span className="text-sm font-bold text-gray-800 tracking-wide">{toast.message}</span>
      </div>

      <header className="bg-corp-blue text-white py-4 px-8 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-corp-red font-black flex items-center justify-center rounded-sm text-sm">RDS</div>
          <span className="font-bold tracking-widest uppercase text-xs">Enterprise Dashboard</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest font-bold border border-white/20 px-3 py-1 rounded-sm">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
          <div>
            <h2 className="font-display text-3xl font-black text-gray-900 mb-2">Corporate Inbox</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} className={`px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${showDuplicatesOnly ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{showDuplicatesOnly ? "⚠️ Clear Audit" : "Audit Duplicates"}</button>
            <button onClick={exportToCSV} className="bg-corp-gold text-white px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-yellow-700 transition-colors shadow-sm">Export to Excel</button>
            <button onClick={() => fetchAllData(true)} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50">{loadingData ? "Refreshing..." : "Refresh Data"}</button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <input type="text" placeholder="Search Candidates..." value={search} onChange={e => setSearch(e.target.value)} className="md:col-span-2 px-4 py-2.5 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-corp-blue outline-none" />
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-white outline-none">
            <option>All Brands</option><option>MyTripRaja</option><option>MarketerRaja</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-white outline-none">
            <option>All Years</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>Final Year</option><option>Graduated</option>
          </select>
        </div>

        {/* BULK ACTION BAR */}
        {selectedApps.length > 0 && (
          <div className="bg-corp-blue text-white p-4 mb-6 rounded-sm shadow-md flex items-center justify-between animate-fade-in">
            <div className="text-sm font-bold">{selectedApps.length} Candidates Selected</div>
            <div className="flex gap-3">
              <button onClick={sendBulkEmail} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors flex items-center gap-2">
                ✉️ Bulk Email
              </button>
              <button onClick={downloadSelectedResumes} className="px-4 py-2 bg-corp-gold hover:bg-yellow-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors flex items-center gap-2">
                ⬇️ Download Resumes (.zip)
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-8 border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("applications")} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "applications" ? "border-b-2 border-corp-red text-corp-red" : "text-gray-400 hover:text-gray-700"}`}>Internships</button>
          <button onClick={() => setActiveTab("enquiries")} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "enquiries" ? "border-b-2 border-corp-red text-corp-red" : "text-gray-400 hover:text-gray-700"}`}>Enquiries</button>
          <button onClick={() => setActiveTab("templates")} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "templates" ? "border-b-2 border-corp-red text-corp-red" : "text-gray-400 hover:text-gray-700"}`}>Email Templates</button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          
          {/* TAB: INTERNSHIPS */}
          {activeTab === "applications" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} onChange={handleSelectAll} className="w-4 h-4 cursor-pointer accent-corp-red" />
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID & Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate & Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Education</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact & Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApps.map(app => (
                    <tr key={app.id} className={`transition-colors ${selectedApps.includes(app.id) ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={selectedApps.includes(app.id)} onChange={() => handleSelectOne(app.id)} className="w-4 h-4 cursor-pointer accent-corp-red" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-[10px] font-bold text-corp-red mb-1">{app.applicationId}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{app.dateStr}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 mb-2 flex items-center justify-between">
                          {app.name}
                          {/* SMART EMAIL BUTTON */}
                          <button onClick={() => sendIndividualEmail(app)} className="text-gray-400 hover:text-corp-blue" title="Send Status Email">✉️</button>
                        </div>
                        <select 
                          value={app.status || "Pending"} 
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                          className={`text-[9px] font-black tracking-widest uppercase rounded-sm px-2 py-1 border outline-none cursor-pointer ${(!app.status || app.status === 'Pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''} ${app.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''} ${app.status === 'Selected' ? 'bg-green-50 text-green-700 border-green-200' : ''} ${app.status === 'Rejected' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}`}
                        >
                          <option value="Pending">Pending</option><option value="Reviewed">Reviewed</option><option value="Interviewing">Interviewing</option><option value="Selected">Selected</option><option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-900">{app.college}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-1">{app.stream} • {app.year}</div>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-gray-100 text-gray-700">{app.brand}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-center gap-2 ${isDuplicate(app.phone, 'phone') ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>P: {app.phone} {isDuplicate(app.phone, 'phone') && "⚠️"}</div>
                          <div className={`flex items-center gap-2 text-[10px] ${isDuplicate(app.email, 'email') ? 'text-orange-600 font-bold' : 'text-blue-600'}`}>{app.email} {isDuplicate(app.email, 'email') && "⚠️"}</div>
                          
                          {/* NEW: LINKEDIN & PORTFOLIO & RESUME LINKS */}
                          <div className="flex items-center gap-3 mt-2">
                            {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-red-50 text-corp-red px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-red-100">PDF</a>}
                            {app.linkedin && <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-blue-100">LinkedIn</a>}
                            {app.portfolio && <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-gray-100 text-gray-700 px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-gray-200">Work Link</a>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: TEMPLATES */}
          {activeTab === "templates" && (
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold mb-2">Email Templates</h3>
              <p className="text-sm text-gray-500 mb-6">These templates auto-fill when you click the ✉️ icon next to a candidate. You can use <b>[Name]</b>, <b>[ID]</b>, and <b>[Brand]</b> as dynamic tags.</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {Object.keys(templates).map(key => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold tracking-widest uppercase mb-2 text-gray-700">{key === "Bulk" ? "Bulk Email (BCC)" : `${key} Status Email`}</label>
                    <textarea 
                      value={templates[key]} 
                      onChange={(e) => setTemplates({...templates, [key]: e.target.value})}
                      className="w-full h-40 p-4 border border-gray-300 rounded-sm text-sm font-body focus:border-corp-blue outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ENQUIRIES (Kept the same) */}
          {activeTab === "enquiries" && (
            <table className="w-full text-left border-collapse">
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

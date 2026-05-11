import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

const ADMIN_EMAIL = "deepusiva2017@gmail.com"; 

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Data States
  const [applications, setApplications] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // UI & Filter States
  const [activeTab, setActiveTab] = useState("applications");
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("All Brands");
  const [filterYear, setFilterYear] = useState("All Years");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false); // NEW: Duplicate filter state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        fetchAllData();
      } else {
        setUser(null);
        if (currentUser) signOut(auth);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const qApps = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
      const snapApps = await getDocs(qApps);
      setApplications(snapApps.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now"
      })));

      const qEnqs = query(collection(db, "enquiries"), orderBy("submittedAt", "desc"));
      const snapEnqs = await getDocs(qEnqs);
      setEnquiries(snapEnqs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateStr: doc.data().submittedAt ? doc.data().submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Just now"
      })));
    } catch (e) { console.error(e); }
    setLoadingData(false);
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus });
      setApplications(applications.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    } catch (e) { alert("Update failed"); }
  };

  // ─── EXPORT TO EXCEL (CSV) ────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = ["App ID,Date,Name,Email,Phone,College,Year,Brand,Duration,Role,Status"];
    const rows = applications.map(a => 
      `"${a.applicationId}","${a.dateStr}","${a.name}","${a.email}","${a.phone}","${a.college}","${a.year}","${a.brand}","${a.duration}","${a.role || 'Any'}","${a.status || 'Pending'}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RDS_Applications_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── HELPER LOGIC ────────────────────────────────────────────────────────
  // Duplicate check logic
  const isDuplicate = (val, field) => {
    if (!val) return false;
    return applications.filter(a => a[field] === val).length > 1;
  };

  // College count calculation
  const collegeCounts = applications.reduce((acc, app) => {
    if (app.college) { acc[app.college] = (acc[app.college] || 0) + 1; }
    return acc;
  }, {});

  // ─── ADVANCED FILTERING & SORTING LOGIC ──────────────────────────────────
  let filteredApps = applications.filter(app => {
    const searchStr = search.toLowerCase();
    
    // UPDATED: Now searches Name, College, Email, AND Phone Number!
    const matchesSearch = 
      (app.name && app.name.toLowerCase().includes(searchStr)) || 
      (app.college && app.college.toLowerCase().includes(searchStr)) || 
      (app.email && app.email.toLowerCase().includes(searchStr)) ||
      (app.phone && app.phone.includes(searchStr)) || 
      (app.altPhone && app.altPhone.includes(searchStr));

    const matchesBrand = filterBrand === "All Brands" || (app.brand && app.brand.includes(filterBrand));
    const matchesYear = filterYear === "All Years" || app.year === filterYear;
    
    // If the duplicate button is clicked, hide everyone who is NOT a duplicate
    const matchesDup = showDuplicatesOnly ? (isDuplicate(app.phone, 'phone') || isDuplicate(app.email, 'email')) : true;
    
    return matchesSearch && matchesBrand && matchesYear && matchesDup;
  });

  // UPDATED: Group identical duplicates together so they appear side-by-side
  if (showDuplicatesOnly) {
    filteredApps.sort((a, b) => {
      const emailA = a.email || "";
      const emailB = b.email || "";
      return emailA.localeCompare(emailB);
    });
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  if (loadingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold uppercase tracking-widest text-xs">RDS Auth Check...</div>;

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-body p-6">
      <div className="bg-white p-10 rounded-sm shadow-xl w-full max-w-md border-t-4 border-corp-red text-center">
        <div className="w-12 h-12 bg-corp-red text-white font-black text-xl flex items-center justify-center rounded-sm mx-auto mb-4">RDS</div>
        <h1 className="font-display text-2xl font-black text-gray-900">Admin Portal</h1>
        <p className="text-gray-500 text-sm mt-2 mb-8 uppercase tracking-widest font-bold">Authorized Personnel Only</p>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs tracking-widest uppercase transition-colors rounded-sm">Sign in with Google</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-body">
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
            <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span>{applications.length} Total Applications</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{Object.keys(collegeCounts).length} Institutions</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* NEW: Duplicate Audit Button */}
            <button 
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} 
              className={`px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${showDuplicatesOnly ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {showDuplicatesOnly ? "⚠️ Clear Audit" : "Audit Duplicates"}
            </button>
            <button onClick={exportToCSV} className="bg-corp-gold text-white px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-yellow-700 transition-colors shadow-sm">Export to Excel</button>
            <button onClick={fetchAllData} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50">{loadingData ? "Refreshing..." : "Refresh Data"}</button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search Name, Email, Phone, or College..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="md:col-span-2 px-4 py-2.5 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-corp-blue outline-none" 
          />
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-white outline-none">
            <option>All Brands</option><option>MyTripRaja</option><option>MarketerRaja</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-wider bg-white outline-none">
            <option>All Years</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>Final Year</option><option>Graduated</option>
          </select>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("applications")} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "applications" ? "border-b-2 border-corp-red text-corp-red" : "text-gray-400 hover:text-gray-700"}`}>Internships ({filteredApps.length})</button>
          <button onClick={() => setActiveTab("enquiries")} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "enquiries" ? "border-b-2 border-corp-red text-corp-red" : "text-gray-400 hover:text-gray-700"}`}>Website Enquiries ({enquiries.length})</button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "applications" ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID & Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate & Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Education</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand Track</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact & Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApps.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">No records found</td></tr>
                  ) : (
                    filteredApps.map(app => (
                      <tr key={app.id} className={`transition-colors ${showDuplicatesOnly ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[10px] font-bold text-corp-red mb-1">{app.applicationId}</div>
                          <div className="text-xs text-gray-400 font-medium">{app.dateStr}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 mb-2">{app.name}</div>
                          <select 
                            value={app.status || "Pending"} 
                            onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                            className={`text-[9px] font-black tracking-widest uppercase rounded-sm px-2 py-1 border outline-none cursor-pointer
                              ${(!app.status || app.status === 'Pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                              ${app.status === 'Reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${app.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                              ${app.status === 'Selected' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              ${app.status === 'Rejected' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}
                            `}
                          >
                            <option value="Pending">Pending</option><option value="Reviewed">Reviewed</option><option value="Interviewing">Interviewing</option><option value="Selected">Selected</option><option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-900">{app.college}</div>
                          <div className="text-[10px] text-gray-500 uppercase mt-1">{app.stream} • {app.year}</div>
                          <div className="text-[9px] text-corp-gold font-bold mt-1 tracking-tighter">Total from college: {collegeCounts[app.college]}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${app.brand && app.brand.includes('MyTripRaja') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{app.brand}</span>
                          <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{app.role || "General"} • {app.duration}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <div className={`flex items-center gap-2 ${isDuplicate(app.phone, 'phone') ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>
                            P: {app.phone} {isDuplicate(app.phone, 'phone') && <span title="Duplicate Phone" className="cursor-help">⚠️</span>}
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] mt-0.5 ${isDuplicate(app.email, 'email') ? 'text-orange-600 font-bold' : 'text-blue-600'}`}>
                            {app.email} {isDuplicate(app.email, 'email') && <span title="Duplicate Email" className="cursor-help">⚠️</span>}
                          </div>
                          {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-corp-red font-black uppercase tracking-widest mt-3 hover:underline">View Resume</a>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-48">Date</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-64">Sender</th><th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">No records found</td></tr>
                  ) : (
                    enquiries.map(enq => (
                    <tr key={enq.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 text-xs text-gray-400 font-bold align-top">{enq.dateStr}</td><td className="px-6 py-4 align-top"><div className="font-bold text-gray-900">{enq.name}</div><a href={`mailto:${enq.email}`} className="text-xs text-blue-600 font-mono hover:underline">{enq.email}</a></td><td className="px-6 py-4 align-top text-sm text-gray-700 whitespace-pre-wrap font-body">{enq.message}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

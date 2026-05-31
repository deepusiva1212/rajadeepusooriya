import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import MyPayslips from "./MyPayslips";

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState("payslips");
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(
          collection(db, "personnel"),
          where("email", "==", user.email.toLowerCase())
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setStaffData(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching staff data:", error);
      }
      setLoading(false);
    };
    fetchStaffData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">Authenticating...</div>;
  }

  if (!staffData) {
    return <div className="min-h-screen bg-slate-900 text-red-500 flex items-center justify-center font-bold">Access Denied.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-8">
          RDS <span className="text-blue-500">Workspace</span>
        </h1>
        
        {/* User Info */}
        <div className="bg-slate-800 p-4 rounded-xl mb-8 border border-slate-700">
          <div className="text-white font-bold truncate">{staffData.name}</div>
          <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">{staffData.role}</div>
        </div>

        {/* Menu */}
        <nav className="flex-grow space-y-2">
          <button 
            onClick={() => setActiveTab("payslips")} 
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === "payslips" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📄 My Payslips
          </button>
        </nav>

        {/* Logout */}
        <button 
          onClick={() => signOut(auth)} 
          className="mt-8 px-4 py-3 text-left rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
        >
          🚪 Secure Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "payslips" && <MyPayslips userEmail={staffData.email} />}
        </div>
      </main>
      
    </div>
  );
}

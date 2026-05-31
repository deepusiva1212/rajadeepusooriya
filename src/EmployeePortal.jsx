import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import WelcomeScreen from "./WelcomeScreen";
import KanbanBoard from "./KanbanBoard";
import LegalVault from "./LegalVault";
import OnboardingChecklist from "./OnboardingChecklist";
import MyPayslips from "./MyPayslips";

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">
        Authenticating RDS Personnel...
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-500 font-bold">
        Access Denied. You are not registered as an active RDS employee.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">
      
      {/* MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="font-black text-white tracking-tighter">RDS<span className="text-blue-500">.</span></div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white p-2"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION (Slide-out on mobile, fixed on desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Brand */}
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
              RDS <span className="text-blue-500">Workspace</span>
            </h1>
          </div>

          {/* User Profile Summary */}
          <div className="bg-slate-800/50 p-4 rounded-xl mb-8 border border-slate-700/50">
            <div className="text-white font-bold truncate">{staffData.name}</div>
            <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">{staffData.role}</div>
            <div className="text-slate-400 text-xs mt-1 truncate">{staffData.email}</div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 flex-grow overflow-y-auto">
            <button 
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all text-left ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              🏠 Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab("tasks"); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all text-left ${activeTab === "tasks" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              📋 Task Board
            </button>
            <button 
              onClick={() => { setActiveTab("legal"); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all text-left ${activeTab === "legal" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              ⚖️ Legal Vault
            </button>
            <button 
              onClick={() => { setActiveTab("onboarding"); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all text-left ${activeTab === "onboarding" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              🚀 Onboarding
            </button>
            <button 
              onClick={() => { setActiveTab("payslips"); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all text-left ${activeTab === "payslips" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              📄 My Payslips
            </button>
          </nav>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-800 mt-auto">
            <button 
              onClick={() => auth.signOut()} 
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all text-left"
            >
              🚪 Secure Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY (Darkens background when menu is open) */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 pt-24 md:pt-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && <WelcomeScreen userRole={staffData.role} userName={staffData.name} />}
          {activeTab === "tasks" && <KanbanBoard userEmail={staffData.email} />}
          {activeTab === "legal" && <LegalVault userEmail={staffData.email} userName={staffData.name} />}
          {activeTab === "onboarding" && <OnboardingChecklist userEmail={staffData.email} />}
          {activeTab === "payslips" && <MyPayslips userEmail={staffData.email} />}
        </div>
      </main>
      
    </div>
  );
}

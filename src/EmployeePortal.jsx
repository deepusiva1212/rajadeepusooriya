import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import MyPayslips from "./MyPayslips";

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState("payslips");
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Safely listen for Firebase Login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // If logged in, fetch their employee file
        try {
          const q = query(
            collection(db, "users"), 
          where("loginEmail", "==", currentUser.email.toLowerCase())
        );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setStaffData(snapshot.docs[0].data());
          }
        } catch (error) {
          console.error("Error fetching staff data:", error);
        }
      } else {
        setUser(null);
        setStaffData(null);
      }
      setLoading(false); // Turn off the loading screen!
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // 1. Loading State
  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">Authenticating...</div>;
  }

  // 2. Login Screen (If not logged in)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-3xl font-black mb-6 uppercase tracking-tighter">RDS <span className="text-blue-500">Workspace</span></h1>
        <button onClick={handleLogin} className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold flex items-center gap-3 hover:bg-slate-200 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // 3. Not Authorized Screen (Logged in, but not in personnel database)
  if (!staffData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
         <div className="text-red-500 font-bold mb-4">Access Denied.</div>
         <p className="text-slate-400 mb-6 text-center max-w-md">The email address {user.email} is not registered as an active RDS employee.</p>
         <button onClick={() => signOut(auth)} className="px-4 py-2 border border-slate-700 rounded text-slate-300 hover:bg-slate-800">Switch Account</button>
      </div>
    );
  }

  // 4. The Actual Portal
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

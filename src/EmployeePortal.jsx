/**
 * src/EmployeePortal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Raja Deepu Sooriya Private Limited — Employee Workspace
 * Fully restored with all 20 modules. Auth with retry loop.
 *
 * TABS (employee-facing — no director-only modules):
 *  My Tasks, Attendance, Payslips, News Feed, Leave Request,
 *  Learning Hub, Feedback, Goals & OKRs, My Calendar, Timesheets,
 *  On-Call Roster, IT Helpdesk, Operations Hub, Clubs & Mentors,
 *  Pulse & Kudos, Handbooks, Safety & First Aid, Private Notepad,
 *  System Tour, Chat
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged,
} from "firebase/auth";

// ── Module imports ────────────────────────────────────────────────────────────
import MyPayslips         from "./MyPayslips";
import MyTasks            from "./MyTasks";
import AttendanceTracker  from "./AttendanceTracker";
import NewsFeed           from "./NewsFeed";
import FeedbackSystem     from "./FeedbackSystem";
import LearningHub        from "./LearningHub";
import PrivateNotepad     from "./PrivateNotepad";
import CompanyCulture     from "./CompanyCulture";
import PolicySignatures   from "./PolicySignatures";
import SocialHub          from "./SocialHub";
import OperationsHub      from "./OperationsHub";
import ITHub              from "./ITHub";
import PerformanceOKRs    from "./PerformanceOKRs";
import SafetyDirectory    from "./SafetyDirectory";
import MyCalendar         from "./MyCalendar";
import Timesheets         from "./Timesheets";
import OnCallRoster       from "./OnCallRoster";
import OnboardingChecklist from "./OnboardingChecklist";
import SystemTour         from "./SystemTour";
import ChatWidget         from "./ChatWidget";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  // ── Core
  { id: "tasks",        label: "My Tasks",           icon: "✅", group: "Core" },
  { id: "attendance",   label: "Time & Location",    icon: "⏱️", group: "Core" },
  { id: "payslips",     label: "My Payslips",        icon: "📄", group: "Core" },
  { id: "calendar",     label: "My Calendar",        icon: "📅", group: "Core" },
  { id: "timesheets",   label: "Timesheets",         icon: "🕐", group: "Core" },
  // ── Work
  { id: "news",         label: "News Feed",          icon: "📰", group: "Work" },
  { id: "learning",     label: "Learning Hub",       icon: "🎓", group: "Work" },
  { id: "performance",  label: "Goals & OKRs",       icon: "🎯", group: "Work" },
  { id: "operations",   label: "Operations Hub",     icon: "⚡", group: "Work" },
  { id: "ithub",        label: "IT Helpdesk",        icon: "💻", group: "Work" },
  { id: "oncall",       label: "On-Call Roster",     icon: "🌙", group: "Work" },
  // ── Culture
  { id: "culture",      label: "Pulse & Kudos",      icon: "🔥", group: "Culture" },
  { id: "social",       label: "Clubs & Mentors",    icon: "🤝", group: "Culture" },
  { id: "policies",     label: "Handbooks",          icon: "✍️", group: "Culture" },
  { id: "feedback",     label: "Share Feedback",     icon: "💡", group: "Culture" },
  { id: "safety",       label: "Safety & First Aid", icon: "🚑", group: "Culture", red: true },
  // ── Personal
  { id: "notepad",      label: "Private Notepad",    icon: "📝", group: "Personal" },
  { id: "onboarding",   label: "Onboarding",         icon: "🚀", group: "Personal" },
  { id: "tour",         label: "System Tour",        icon: "🗺️", group: "Personal" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeePortal() {
  const [activeTab,  setActiveTab]  = useState("tasks");
  const [staffData,  setStaffData]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth + staff lookup with retry ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null); setStaffData(null); setLoading(false); return;
      }
      setUser(currentUser);

      const searchEmail = currentUser.email.toLowerCase().trim();
      let foundData = null;

      // Retry up to 3 times (Firestore cold-start delay protection)
      for (let attempt = 1; attempt <= 3; attempt++) {
        const collections = ["staff", "personnel", "employees", "users", "team"];
        const fields      = ["email", "loginEmail", "employeeEmail"];
        for (const col of collections) {
          if (foundData) break;
          for (const field of fields) {
            if (foundData) break;
            try {
              const snap = await getDocs(
                query(collection(db, col), where(field, "==", searchEmail))
              );
              if (!snap.empty) {
                foundData       = snap.docs[0].data();
                foundData.email = searchEmail;
                foundData.name  = foundData.name || foundData.fullName || "RDS Employee";
                foundData.role  = foundData.role || "Staff";
              }
            } catch { /* collection may not exist — skip silently */ }
          }
        }
        if (foundData) break;
        if (attempt < 3) await new Promise(r => setTimeout(r, 800));
      }

      // Director fallback
      if (!foundData && searchEmail === "deepadharsan.rajavel@gmail.com") {
        foundData = { name: "Deepadharsan", role: "Super Admin", email: searchEmail };
      }

      setStaffData(foundData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center
                      justify-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent
                        rounded-full animate-spin" />
        <span className="font-bold text-slate-400 tracking-widest uppercase text-sm">
          Authenticating…
        </span>
      </div>
    );
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center
                      justify-center text-white p-6">
        <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">
          RDS <span className="text-blue-500">Workspace</span>
        </h1>
        <p className="text-slate-400 text-sm mb-8">Employee Portal</p>
        <button
          onClick={handleLogin}
          className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold
                     flex items-center gap-3 hover:bg-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // ── Access denied ───────────────────────────────────────────────────────────
  if (!staffData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center
                      justify-center text-white p-6 text-center">
        <div className="text-red-500 font-bold text-lg mb-3">Access Denied</div>
        <p className="text-slate-400 mb-6 max-w-sm">
          <strong className="text-white">{user.email}</strong> is not registered
          in the RDS staff database. Contact your account manager.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="px-5 py-2.5 border border-slate-700 rounded text-slate-300
                     hover:bg-slate-800 transition-colors text-sm font-bold"
        >
          Switch Account
        </button>
      </div>
    );
  }

  // ── Portal ──────────────────────────────────────────────────────────────────
  const groups = [...new Set(TABS.map(t => t.group))];

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-slate-900
                    border-r border-slate-800 flex flex-col z-50 overflow-y-auto
                    transition-transform duration-300 lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-xl font-black text-white tracking-tighter uppercase mb-4">
            RDS <span className="text-blue-500">Workspace</span>
          </h1>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar"
                     className="w-9 h-9 rounded-full border border-slate-600"
                     onError={e => e.target.style.display = "none"} />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center
                                justify-center font-black text-sm text-white">
                  {staffData.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-white font-bold text-sm truncate">
                  {staffData.name}
                </div>
                <div className="text-blue-400 text-[10px] font-bold uppercase
                                tracking-wider truncate">
                  {staffData.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 p-3 space-y-4">
          {groups.map(group => (
            <div key={group}>
              <div className="text-[9px] font-bold text-slate-600 uppercase
                              tracking-widest px-3 mb-1">
                {group}
              </div>
              {TABS.filter(t => t.group === group).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm
                              font-semibold transition-all flex items-center gap-2.5
                              ${activeTab === tab.id
                                ? tab.red
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-blue-600 text-white"
                                : tab.red
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                              }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut(auth)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold
                       text-red-400 hover:bg-red-500/10 transition-all flex
                       items-center gap-2"
          >
            🚪 Secure Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3
                        bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd"
                d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                clipRule="evenodd"/>
            </svg>
          </button>
          <span className="text-white font-bold text-sm">
            {TABS.find(t => t.id === activeTab)?.icon}{" "}
            {TABS.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Tab content */}
        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">

            {activeTab === "tasks" && (
              <MyTasks
                userEmail={staffData.email}
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "attendance" && (
              <AttendanceTracker
                userEmail={staffData.email}
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "payslips" && (
              <MyPayslips userEmail={staffData.email} />
            )}
            {activeTab === "calendar" && (
              <MyCalendar userEmail={staffData.email} userName={staffData.name} />
            )}
            {activeTab === "timesheets" && (
              <Timesheets
                userEmail={staffData.email}
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "news" && (
              <NewsFeed role={staffData.role} userName={staffData.name} />
            )}
            {activeTab === "learning" && (
              <LearningHub role={staffData.role} />
            )}
            {activeTab === "performance" && (
              <PerformanceOKRs
                userEmail={staffData.email}
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "operations" && (
              <OperationsHub role={staffData.role} userName={staffData.name} />
            )}
            {activeTab === "ithub" && (
              <ITHub
                userEmail={staffData.email}
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "oncall" && (
              <OnCallRoster role={staffData.role} userName={staffData.name} />
            )}
            {activeTab === "culture" && (
              <CompanyCulture userName={staffData.name} />
            )}
            {activeTab === "social" && (
              <SocialHub
                userName={staffData.name}
                userEmail={staffData.email}
              />
            )}
            {activeTab === "policies" && (
              <PolicySignatures
                userName={staffData.name}
                role={staffData.role}
              />
            )}
            {activeTab === "feedback" && (
              <FeedbackSystem
                role={staffData.role}
                userEmail={staffData.email}
                userName={staffData.name}
              />
            )}
            {activeTab === "safety" && (
              <SafetyDirectory role={staffData.role} />
            )}
            {activeTab === "notepad" && (
              <PrivateNotepad userEmail={staffData.email} />
            )}
            {activeTab === "onboarding" && (
              <OnboardingChecklist
                userName={staffData.name}
                userEmail={staffData.email}
              />
            )}
            {activeTab === "tour" && (
              <SystemTour role={staffData.role} />
            )}

          </div>
        </main>
      </div>

      {/* ── Floating chat widget ────────────────────────────────────────────── */}
      <ChatWidget
        userEmail={staffData.email}
        userName={staffData.name}
        role={staffData.role}
      />
    </div>
  );
}

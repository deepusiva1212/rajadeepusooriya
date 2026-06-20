/**
 * src/ClientPortal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Client Portal for Raja Deepu Sooriya Private Limited.
 * Serves clients of MyTripRaja and MarketerRaja.
 *
 * FEATURES:
 *  • Google Sign-In (same Firebase auth as EmployeePortal)
 *  • Access control — only pre-approved client emails can enter
 *  • Dashboard overview — project count, pending invoices, unread messages
 *  • Projects tab — milestone timeline, progress bar, status badges
 *  • Invoices tab — download branded PDF invoice (via jsPDF)
 *  • Messages tab — real-time thread with the RDS team (Firestore)
 *  • Profile tab — client details, assigned account manager
 *
 * FIRESTORE COLLECTIONS USED:
 *  clients/{uid}           — client profile + brand + account manager
 *  client_projects/{id}    — projects with milestones[]
 *  client_invoices/{id}    — invoice records with line items[]
 *  client_messages/{id}    — message threads
 *
 * APP.JSX CHANGES (2 lines):
 *  1. import ClientPortal from "./ClientPortal";
 *  2. {view === "client" && <ClientPortal />}
 *  3. Add "client" to the excluded nav views array:
 *     {!["admin","employee","director","client"].includes(view) && <Navbar ... />}
 *
 * ALSO ADD a "Client Login" link anywhere — e.g. in Footer quick links:
 *  <button onClick={() => navigateTo("client")}>Client Portal</button>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithPopup, signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, addDoc, query,
  where, orderBy, onSnapshot, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND_META = {
  MyTripRaja:   { color: "#051324", light: "#EFF6FF", label: "Travel & Tourism"  },
  MarketerRaja: { color: "#C8102E", light: "#FFF1F2", label: "Digital Marketing" },
};

// ─── Status config ────────────────────────────────────────────────────────────
const PROJECT_STATUS = {
  "In Progress": { dot: "bg-blue-400",   text: "text-blue-400",   badge: "bg-blue-400/10 text-blue-400"   },
  "Completed":   { dot: "bg-emerald-400",text: "text-emerald-400",badge: "bg-emerald-400/10 text-emerald-400" },
  "On Hold":     { dot: "bg-amber-400",  text: "text-amber-400",  badge: "bg-amber-400/10 text-amber-400"  },
  "Planning":    { dot: "bg-purple-400", text: "text-purple-400", badge: "bg-purple-400/10 text-purple-400" },
};
const INVOICE_STATUS = {
  "Paid":    { badge: "bg-emerald-400/10 text-emerald-400", dot: "bg-emerald-400" },
  "Pending": { badge: "bg-amber-400/10 text-amber-400",     dot: "bg-amber-400"   },
  "Overdue": { badge: "bg-red-400/10 text-red-400",         dot: "bg-red-400"     },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-sm
                     shadow-2xl flex items-center gap-2.5 text-sm font-semibold
                     ${type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
      <span>{type === "error" ? "⚠️" : "✅"}</span>{msg}
    </div>
  );
}

// ─── Google sign-in screen ────────────────────────────────────────────────────
function LoginScreen({ onSignIn, loading, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: "linear-gradient(135deg,#051324 0%,#0A2342 60%,#0f2940 100%)" }}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%"><defs>
          <pattern id="cg" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0L0 0 0 60" fill="none" stroke="white" strokeWidth="0.6"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#cg)"/>
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-sm bg-corp-red flex items-center justify-center
                            font-black text-white text-xs">RDS</div>
            <div>
              <div className="text-white font-bold text-xs tracking-widest uppercase">
                Raja Deepu Sooriya
              </div>
              <div className="text-corp-gold text-[10px] tracking-[0.18em] uppercase mt-0.5">
                Client Portal
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-black text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Sign in with the Google account associated with your MyTripRaja or
            MarketerRaja project to access your client dashboard.
          </p>

          {/* Brand badges */}
          <div className="flex gap-3 mb-8">
            {Object.entries(BRAND_META).map(([name, meta]) => (
              <div key={name}
                   className="flex-1 py-2.5 px-3 rounded-sm border border-white/10
                              flex items-center gap-2"
                   style={{ background: `${meta.color}22` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                     style={{ background: meta.color }} />
                <div>
                  <div className="text-white text-xs font-bold">{name}</div>
                  <div className="text-gray-500 text-[9px] uppercase tracking-wider">
                    {meta.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30
                            rounded-sm text-red-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white
                       hover:bg-gray-100 text-gray-800 font-bold text-sm rounded-sm
                       transition-colors shadow-md disabled:opacity-60
                       disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800
                              rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <p className="text-gray-600 text-[10px] text-center mt-5 leading-relaxed">
            Access is restricted to approved clients only. If you don't have
            access, contact us at{" "}
            <a href="tel:+918098889088" className="text-corp-gold hover:underline">
              +91 8098889088
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: "📊" },
  { id: "projects",  label: "Projects",   icon: "🚀" },
  { id: "invoices",  label: "Invoices",   icon: "🧾" },
  { id: "messages",  label: "Messages",   icon: "💬" },
  { id: "profile",   label: "My Profile", icon: "👤" },
];

function Sidebar({ active, onTab, user, clientData, unread, onSignOut, mobileOpen, onClose }) {
  const brand = clientData?.brand || "MyTripRaja";
  const bm    = BRAND_META[brand] || BRAND_META.MyTripRaja;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col
                         transition-transform duration-300 lg:translate-x-0
                         ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
             style={{ background: "#07182E", borderRight: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-sm bg-corp-red flex items-center justify-center
                            font-black text-white text-xs">RDS</div>
            <div>
              <div className="text-white font-bold text-xs tracking-widest uppercase">
                Client Portal
              </div>
              <div className="text-corp-gold text-[9px] tracking-widest uppercase mt-0.5">
                {brand}
              </div>
            </div>
          </div>

          {/* Client avatar */}
          <div className="flex items-center gap-3">
            <img src={user?.photoURL || ""}
                 alt={user?.displayName || "Client"}
                 className="w-9 h-9 rounded-full border-2 border-white/20 flex-shrink-0"
                 onError={e => { e.target.style.display = "none"; }} />
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user?.displayName || "Client"}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider"
                   style={{ color: bm.color === "#051324" ? "#60A5FA" : "#FCA5A5" }}>
                {bm.label}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(t => {
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => { onTab(t.id); onClose(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left
                                  transition-all duration-150 group
                                  ${isActive
                                    ? "bg-corp-gold/15 text-corp-gold"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                <span className="text-base w-5 text-center flex-shrink-0">{t.icon}</span>
                <span className="text-xs font-semibold tracking-widest uppercase flex-1">
                  {t.label}
                </span>
                {t.id === "messages" && unread > 0 && (
                  <span className="w-4 h-4 bg-corp-red rounded-full text-white text-[9px]
                                   font-black flex items-center justify-center flex-shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8">
          <button onClick={onSignOut}
                  className="w-full flex items-center gap-2.5 text-gray-500 hover:text-red-400
                             text-xs font-semibold tracking-widest uppercase transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
                 className="w-4 h-4">
              <path d="M13 10H3m0 0l3-3m-3 3l3 3M7 6V5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2v-1" strokeLinecap="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Dashboard overview ───────────────────────────────────────────────────────
function DashboardTab({ clientData, projects, invoices, messages, onTab }) {
  const activeProjects  = projects.filter(p => p.status === "In Progress").length;
  const pendingInvoices = invoices.filter(i => i.status === "Pending" || i.status === "Overdue");
  const pendingTotal    = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const unreadMsgs      = messages.filter(m => !m.readByClient).length;
  const latestProject   = projects[0];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-white font-display font-black text-2xl">
          Welcome back 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Here's a summary of your {clientData?.brand || "project"} engagement.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects",    value: activeProjects,
            icon: "🚀", accent: "border-blue-500/20",  action: () => onTab("projects")  },
          { label: "Pending Invoices",   value: pendingInvoices.length,
            icon: "🧾", accent: "border-amber-500/20", action: () => onTab("invoices")  },
          { label: "Amount Due",         value: fmtCurrency(pendingTotal),
            icon: "₹",  accent: "border-corp-red/20",  action: () => onTab("invoices")  },
          { label: "Unread Messages",    value: unreadMsgs,
            icon: "💬", accent: "border-corp-gold/20", action: () => onTab("messages")  },
        ].map(k => (
          <button key={k.label} onClick={k.action}
                  className={`bg-corp-blue-mid border ${k.accent} rounded-sm p-5 text-left
                               hover:border-white/20 transition-all group`}>
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="font-display font-black text-2xl text-white leading-none mb-1">
              {k.value}
            </div>
            <div className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">
              {k.label}
            </div>
          </button>
        ))}
      </div>

      {/* Latest project card */}
      {latestProject && (
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">
                Latest Project
              </div>
              <h2 className="text-white font-bold text-base">{latestProject.name}</h2>
              <div className="text-gray-400 text-xs mt-0.5">{latestProject.description}</div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-widest
                             flex-shrink-0 ml-4 ${PROJECT_STATUS[latestProject.status]?.badge || "bg-white/10 text-gray-300"}`}>
              {latestProject.status}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">Overall Progress</span>
              <span className="text-white font-bold">{latestProject.progress || 0}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-corp-gold rounded-full transition-all duration-700"
                   style={{ width: `${latestProject.progress || 0}%` }} />
            </div>
          </div>

          {/* Milestones preview */}
          {latestProject.milestones?.length > 0 && (
            <div className="space-y-2">
              {latestProject.milestones.slice(0, 3).map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center
                                   justify-center text-[9px]
                                   ${m.done
                                     ? "bg-emerald-400 border-emerald-400 text-white"
                                     : "bg-transparent border-white/20 text-transparent"}`}>
                    {m.done ? "✓" : ""}
                  </div>
                  <span className={`text-xs ${m.done ? "text-gray-500 line-through" : "text-gray-300"}`}>
                    {m.title}
                  </span>
                  {m.date && (
                    <span className="text-gray-600 text-[10px] ml-auto flex-shrink-0">
                      {fmtDate(m.date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => onTab("projects")}
                  className="mt-4 text-corp-gold text-xs font-bold tracking-widest uppercase
                             underline underline-offset-2 hover:text-amber-400 transition-colors">
            View All Projects →
          </button>
        </div>
      )}

      {/* Recent messages preview */}
      {messages.slice(0, 3).length > 0 && (
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">Recent Messages</h3>
            <button onClick={() => onTab("messages")}
                    className="text-corp-gold text-xs font-bold tracking-widest uppercase
                               hover:text-amber-400 transition-colors">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {messages.slice(0, 3).map((m, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-sm
                                       ${!m.readByClient ? "bg-corp-gold/5 border border-corp-gold/20" : "bg-white/3"}`}>
                <div className="w-7 h-7 rounded-full bg-corp-red flex items-center justify-center
                                text-white font-black text-xs flex-shrink-0">
                  {m.fromName?.charAt(0) || "R"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-xs font-semibold">{m.fromName || "RDS Team"}</span>
                    <span className="text-gray-600 text-[10px]">{fmtDate(m.sentAt)}</span>
                    {!m.readByClient && (
                      <span className="w-1.5 h-1.5 rounded-full bg-corp-gold flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed truncate">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Projects tab ─────────────────────────────────────────────────────────────
function ProjectsTab({ projects }) {
  const [selected, setSelected] = useState(null);
  const proj = selected ? projects.find(p => p.id === selected) : null;

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-5xl mb-4">🚀</div>
        <div className="text-sm font-medium">No projects yet.</div>
        <div className="text-xs mt-1">Your projects will appear here once created by your account manager.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-white font-display font-black text-xl">Your Projects</h2>

      <div className="grid gap-4">
        {projects.map(p => {
          const sc = PROJECT_STATUS[p.status] || PROJECT_STATUS["Planning"];
          return (
            <div key={p.id}
                 className="bg-corp-blue-mid border border-white/10 rounded-sm p-6
                            hover:border-white/20 transition-all cursor-pointer"
                 onClick={() => setSelected(selected === p.id ? null : p.id)}>

              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white font-bold text-base">{p.name}</h3>
                  <p className="text-gray-400 text-xs mt-1">{p.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm
                                   uppercase tracking-widest ${sc.badge}`}>
                    {p.status}
                  </span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round"
                       className={`w-4 h-4 text-gray-500 transition-transform duration-200
                                  ${selected === p.id ? "rotate-180" : ""}`}>
                    <path d="M3 5.5l5 5 5-5"/>
                  </svg>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-white font-bold">{p.progress || 0}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-corp-gold rounded-full"
                       style={{ width: `${p.progress || 0}%` }} />
                </div>
              </div>

              {/* Meta row */}
              <div className="flex gap-5 mt-3">
                {p.startDate && (
                  <div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Start</div>
                    <div className="text-gray-300 text-xs">{fmtDate(p.startDate)}</div>
                  </div>
                )}
                {p.endDate && (
                  <div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Deadline</div>
                    <div className="text-gray-300 text-xs">{fmtDate(p.endDate)}</div>
                  </div>
                )}
                {p.manager && (
                  <div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Manager</div>
                    <div className="text-gray-300 text-xs">{p.manager}</div>
                  </div>
                )}
              </div>

              {/* Expanded milestones */}
              {selected === p.id && p.milestones?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Milestones
                  </div>
                  {p.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      {/* Timeline line */}
                      {i < p.milestones.length - 1 && (
                        <div className="absolute left-[7px] top-4 w-px h-full bg-white/10" />
                      )}
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center
                                       justify-center z-10 mt-0.5
                                       ${m.done
                                         ? "bg-emerald-400 border-emerald-400"
                                         : "bg-corp-blue-mid border-white/20"}`}>
                        {m.done && (
                          <svg viewBox="0 0 12 12" fill="white" className="w-2 h-2">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5"
                                  fill="none" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-semibold
                                         ${m.done ? "text-gray-500 line-through" : "text-gray-200"}`}>
                          {m.title}
                        </div>
                        {m.note && (
                          <div className="text-gray-500 text-[10px] mt-0.5">{m.note}</div>
                        )}
                      </div>
                      {m.date && (
                        <span className="text-gray-600 text-[10px] flex-shrink-0">{fmtDate(m.date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Invoices tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ invoices, clientData }) {
  const [downloading, setDownloading] = useState(null);

  const downloadInvoice = async (inv) => {
    setDownloading(inv.id);
    try {
      // Dynamic import jsPDF to keep bundle lean
      const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
        .catch(() => ({ jsPDF: null }));

      if (!jsPDF) {
        // Fallback: open print dialog with formatted invoice HTML
        const win = window.open("", "_blank");
        win.document.write(`
          <html><head><title>Invoice ${inv.invoiceNo}</title>
          <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111}
          .header{border-top:4px solid #C8102E;padding:24px 0;margin-bottom:24px}
          h1{font-size:28px;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}
          th{background:#f3f4f6;padding:8px;text-align:left;font-size:12px}
          td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px}
          .total{font-size:18px;font-weight:bold;text-align:right;margin-top:16px}
          </style></head><body>
          <div class="header">
            <div style="display:flex;justify-content:space-between;align-items:start">
              <div><h1>INVOICE</h1><p style="color:#C8102E;font-weight:bold">
              ${inv.invoiceNo || "INV-001"}</p></div>
              <div style="text-align:right">
                <div style="font-weight:bold">Raja Deepu Sooriya Pvt Ltd</div>
                <div style="font-size:12px;color:#666">CIN: U79120TZ2025PTC034817</div>
                <div style="font-size:12px;color:#666">GSTIN: 33AAOCR6737N1ZN</div>
              </div>
            </div>
          </div>
          <p>Bill To: <strong>${clientData?.companyName || "Client"}</strong></p>
          <p>Invoice Date: ${fmtDate(inv.invoiceDate)}</p>
          <p>Due Date: ${fmtDate(inv.dueDate)}</p>
          <table><tr><th>Description</th><th>Amount</th></tr>
          ${(inv.lineItems || [{ description: inv.description || "Services", amount: inv.amount }])
            .map(l => `<tr><td>${l.description}</td><td>${fmtCurrency(l.amount)}</td></tr>`).join("")}
          </table>
          <div class="total">Total: ${fmtCurrency(inv.amount)}</div>
          <div class="total" style="color:#C8102E">Status: ${inv.status}</div>
          </body></html>`);
        win.print();
        return;
      }

      // Full jsPDF invoice
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const W = 210, M = 20;

      // Header bar
      pdf.setFillColor(200, 16, 46);
      pdf.rect(0, 0, W, 4, "F");

      // Company name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18); pdf.setTextColor(5, 19, 36);
      pdf.text("INVOICE", M, 24);
      pdf.setFontSize(9); pdf.setTextColor(200, 16, 46);
      pdf.text(inv.invoiceNo || "INV-001", M, 31);

      // RDS details right side
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11); pdf.setTextColor(5, 19, 36);
      pdf.text("Raja Deepu Sooriya Pvt Ltd", W - M, 20, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8); pdf.setTextColor(100);
      pdf.text("CIN: U79120TZ2025PTC034817", W - M, 26, { align: "right" });
      pdf.text("GSTIN: 33AAOCR6737N1ZN", W - M, 31, { align: "right" });
      pdf.text("17/1 DS Apartment, Sankagiri — 637301, TN", W - M, 36, { align: "right" });

      // Divider
      pdf.setDrawColor(229, 231, 235); pdf.line(M, 42, W - M, 42);

      // Bill to
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9); pdf.setTextColor(100);
      pdf.text("BILL TO", M, 52);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11); pdf.setTextColor(5, 19, 36);
      pdf.text(clientData?.companyName || "Client", M, 59);

      // Dates
      pdf.setFontSize(8); pdf.setTextColor(100);
      pdf.text(`Invoice Date: ${fmtDate(inv.invoiceDate)}`, W - M, 52, { align: "right" });
      pdf.text(`Due Date:     ${fmtDate(inv.dueDate)}`, W - M, 58, { align: "right" });

      // Line items table
      let y = 75;
      pdf.setFillColor(243, 244, 246);
      pdf.rect(M, y - 5, W - M * 2, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9); pdf.setTextColor(80);
      pdf.text("DESCRIPTION", M + 2, y);
      pdf.text("AMOUNT", W - M - 2, y, { align: "right" });
      y += 6;

      const items = inv.lineItems || [{ description: inv.description || "Professional Services", amount: inv.amount }];
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10); pdf.setTextColor(5, 19, 36);
      for (const item of items) {
        pdf.text(item.description, M + 2, y);
        pdf.text(fmtCurrency(item.amount), W - M - 2, y, { align: "right" });
        pdf.setDrawColor(229, 231, 235);
        pdf.line(M, y + 3, W - M, y + 3);
        y += 10;
      }

      // Total
      y += 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13); pdf.setTextColor(5, 19, 36);
      pdf.text(`Total: ${fmtCurrency(inv.amount)}`, W - M - 2, y, { align: "right" });
      pdf.setFontSize(10); pdf.setTextColor(200, 16, 46);
      pdf.text(`Status: ${inv.status}`, W - M - 2, y + 8, { align: "right" });

      // Footer
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7); pdf.setTextColor(160);
      pdf.text("Thank you for your business. — Raja Deepu Sooriya Private Limited", W / 2, 280, { align: "center" });

      pdf.save(`Invoice_${inv.invoiceNo || inv.id}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-5xl mb-4">🧾</div>
        <div className="text-sm font-medium">No invoices yet.</div>
      </div>
    );
  }

  const totalDue = invoices
    .filter(i => i.status !== "Paid")
    .reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h2 className="text-white font-display font-black text-xl">Invoices</h2>
        {totalDue > 0 && (
          <div className="text-right">
            <div className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Amount Due</div>
            <div className="text-corp-red font-black text-xl">{fmtCurrency(totalDue)}</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {invoices.map(inv => {
          const sc = INVOICE_STATUS[inv.status] || INVOICE_STATUS["Pending"];
          return (
            <div key={inv.id}
                 className="bg-corp-blue-mid border border-white/10 rounded-sm p-5
                            hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">
                      {inv.invoiceNo || `INV-${inv.id?.slice(-4)}`}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm
                                     uppercase tracking-widest ${sc.badge}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">{inv.description || "Professional Services"}</div>
                  <div className="flex gap-4 mt-2">
                    {inv.invoiceDate && (
                      <span className="text-gray-500 text-[10px]">
                        Issued: {fmtDate(inv.invoiceDate)}
                      </span>
                    )}
                    {inv.dueDate && (
                      <span className="text-gray-500 text-[10px]">
                        Due: {fmtDate(inv.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-white font-black text-lg leading-none">
                      {fmtCurrency(inv.amount)}
                    </div>
                  </div>
                  <button onClick={() => downloadInvoice(inv)}
                          disabled={downloading === inv.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-corp-gold/10
                                     hover:bg-corp-gold/20 border border-corp-gold/30
                                     text-corp-gold text-[10px] font-bold uppercase
                                     tracking-widest rounded-sm transition-all
                                     disabled:opacity-60">
                    {downloading === inv.id ? (
                      <div className="w-3 h-3 border-2 border-corp-gold border-t-transparent
                                      rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
                           strokeWidth="1.5" strokeLinecap="round" className="w-3 h-3">
                        <path d="M7 1v8M4 7l3 3 3-3M1 11h12" />
                      </svg>
                    )}
                    PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Messages tab ─────────────────────────────────────────────────────────────
function MessagesTab({ messages, setMessages, clientUid, user, clientData }) {
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const msg = {
      clientUid,
      text:          text.trim(),
      fromName:      user?.displayName || "Client",
      fromEmail:     user?.email,
      fromRole:      "client",
      sentAt:        serverTimestamp(),
      readByClient:  true,
      readByTeam:    false,
    };
    try {
      const ref = await addDoc(collection(db, "client_messages"), msg);
      setMessages(prev => [...prev, { id: ref.id, ...msg, sentAt: new Date() }]);
      setText("");
    } catch (e) {
      console.error("Send error:", e);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[680px]">
      <h2 className="text-white font-display font-black text-xl mb-4 flex-shrink-0">
        Messages
      </h2>
      <div className="text-gray-500 text-xs mb-4 flex-shrink-0">
        Direct line to your account manager at Raja Deepu Sooriya.
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isClient = m.fromRole === "client";
          return (
            <div key={m.id || i} className={`flex gap-3 ${isClient ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                               font-black text-xs text-white
                               ${isClient ? "bg-corp-gold/60" : "bg-corp-red"}`}>
                {isClient ? user?.displayName?.charAt(0) || "C" : "RDS"}
              </div>
              <div className={`max-w-xs lg:max-w-md ${isClient ? "items-end" : "items-start"}
                               flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-gray-500">{m.fromName}</span>
                  <span className="text-[10px] text-gray-700">{fmtDate(m.sentAt)}</span>
                </div>
                <div className={`px-4 py-2.5 rounded-sm text-sm leading-relaxed
                                 ${isClient
                                   ? "bg-corp-gold/15 text-white border border-corp-gold/20"
                                   : "bg-white/8 text-gray-200 border border-white/10"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 flex gap-3 mt-4 pt-4 border-t border-white/10">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message to your account manager…"
          className="flex-1 px-4 py-3 bg-corp-blue-mid border border-white/15
                     rounded-sm text-white text-sm placeholder:text-gray-600
                     focus:outline-none focus:border-corp-gold/50 transition-colors"
        />
        <button onClick={send} disabled={!text.trim() || sending}
                className="px-5 py-3 bg-corp-gold hover:bg-amber-500 text-corp-blue
                           font-black text-xs uppercase tracking-widest rounded-sm
                           transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {sending ? (
            <div className="w-4 h-4 border-2 border-corp-blue border-t-transparent
                            rounded-full animate-spin" />
          ) : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, clientData }) {
  const brand = clientData?.brand || "MyTripRaja";
  const bm    = BRAND_META[brand] || BRAND_META.MyTripRaja;

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-white font-display font-black text-xl">My Profile</h2>

      {/* Client identity card */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: bm.color }} />
        <div className="p-6 flex items-center gap-5">
          <img src={user?.photoURL} alt={user?.displayName}
               className="w-16 h-16 rounded-full border-2 border-white/20"
               onError={e => e.target.style.display = "none"} />
          <div>
            <div className="text-white font-black text-lg">{user?.displayName}</div>
            <div className="text-gray-400 text-sm">{user?.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full" style={{ background: bm.color }} />
              <span className="text-xs font-bold" style={{ color: bm.color === "#051324" ? "#60A5FA" : "#FCA5A5" }}>
                {brand} · {bm.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Company details */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-6 space-y-4">
        <div className="text-white font-bold text-sm tracking-widest uppercase mb-4">
          Company Details
        </div>
        {[
          ["Company", clientData?.companyName || "—"],
          ["Account Manager", clientData?.accountManager || "RDS Team"],
          ["Project Start", fmtDate(clientData?.startDate)],
          ["Client Since", fmtDate(clientData?.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase
                             flex-shrink-0">{label}</span>
            <span className="text-gray-300 text-xs text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* RDS contact */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-6">
        <div className="text-white font-bold text-sm tracking-widest uppercase mb-4">
          Your Account Manager
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-corp-red flex items-center justify-center
                          text-white font-black text-base">RDS</div>
          <div>
            <div className="text-white font-semibold">
              {clientData?.accountManager || "RDS Team"}
            </div>
            <a href="tel:+918098889088"
               className="text-corp-gold text-xs hover:underline">+91 8098889088</a>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
          {[
            ["CIN",   "U79120TZ2025PTC034817"],
            ["GSTIN", "33AAOCR6737N1ZN"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-gray-600 font-bold text-[9px] uppercase tracking-widest">{k}</div>
              <div className="text-gray-400 font-mono mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Access denied ────────────────────────────────────────────────────────────
function AccessDenied({ user, onSignOut }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: "#051324" }}>
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-white font-display font-black text-2xl mb-3">Access Denied</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          <strong className="text-white">{user?.email}</strong> is not registered
          as a client of Raja Deepu Sooriya Private Limited.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          Please contact your account manager or reach us at{" "}
          <a href="tel:+918098889088" className="text-corp-gold underline">+91 8098889088</a>
        </p>
        <button onClick={onSignOut}
                className="px-6 py-3 bg-corp-red hover:bg-corp-red-dark text-white font-bold
                           text-xs uppercase tracking-widest rounded-sm transition-colors">
          Sign Out & Try Another Account
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CLIENT PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ClientPortal() {
  const [user,        setUser]        = useState(null);
  const [clientData,  setClientData]  = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading,setLoginLoading]= useState(false);
  const [loginError,  setLoginError]  = useState("");
  const [accessDenied,setAccessDenied]= useState(false);

  const [projects,  setProjects]  = useState([]);
  const [invoices,  setInvoices]  = useState([]);
  const [messages,  setMessages]  = useState([]);
  const [dataLoaded,setDataLoaded]= useState(false);

  const [tab,           setTab]           = useState("dashboard");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [toast,         setToast]         = useState({ msg: "", type: "success" });

  // ── Auth observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) await loadClientData(u);
    });
    return () => unsub();
  }, []);

  // ── Load client profile from Firestore ───────────────────────────────────
  const loadClientData = useCallback(async (u) => {
    try {
      const snap = await getDoc(doc(db, "clients", u.uid));
      if (!snap.exists()) {
        // Check by email (admin may have pre-registered by email)
        const eq = query(collection(db, "clients"), where("email", "==", u.email));
        const qs  = await getDocs(eq);
        if (qs.empty) { setAccessDenied(true); return; }
        setClientData({ id: qs.docs[0].id, ...qs.docs[0].data() });
        await loadPortalData(u.uid, qs.docs[0].id);
      } else {
        setClientData({ id: snap.id, ...snap.data() });
        await loadPortalData(u.uid, snap.id);
      }
    } catch (e) {
      console.error("Client load error:", e);
      setAccessDenied(true);
    }
  }, []);

  const loadPortalData = async (uid, clientId) => {
    try {
      const [projSnap, invSnap, msgSnap] = await Promise.all([
        getDocs(query(collection(db, "client_projects"), where("clientUid","==",uid), orderBy("startDate","desc"))),
        getDocs(query(collection(db, "client_invoices"), where("clientUid","==",uid), orderBy("invoiceDate","desc"))),
        getDocs(query(collection(db, "client_messages"), where("clientUid","==",uid), orderBy("sentAt","asc"))),
      ]);
      setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoaded(true);

      // Mark messages as read by client
      const unread = msgSnap.docs.filter(d => !d.data().readByClient);
      for (const d of unread) {
        updateDoc(doc(db, "client_messages", d.id), { readByClient: true }).catch(() => {});
      }
    } catch (e) {
      console.error("Portal data error:", e);
      setDataLoaded(true);
    }
  };

  // ── Real-time message listener ────────────────────────────────────────────
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const q = query(
      collection(db, "client_messages"),
      where("clientUid", "==", user.uid),
      orderBy("sentAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, dataLoaded]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const handleSignIn = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setLoginError(e.code === "auth/popup-closed-by-user"
        ? "Sign-in was cancelled."
        : "Sign-in failed. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null); setClientData(null); setAccessDenied(false);
    setProjects([]); setInvoices([]); setMessages([]);
    setDataLoaded(false);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#051324" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-corp-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading portal…</span>
        </div>
      </div>
    );
  }

  if (!user)         return <LoginScreen onSignIn={handleSignIn} loading={loginLoading} error={loginError} />;
  if (accessDenied)  return <AccessDenied user={user} onSignOut={handleSignOut} />;
  if (!dataLoaded)   return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#051324" }}>
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-corp-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading your workspace…</span>
      </div>
    </div>
  );

  const unreadCount = messages.filter(m => !m.readByClient).length;

  return (
    <div className="flex min-h-screen" style={{ background: "#051324" }}>
      <Toast msg={toast.msg} type={toast.type} />

      <Sidebar
        active={tab}
        onTab={setTab}
        user={user}
        clientData={clientData}
        unread={unreadCount}
        onSignOut={handleSignOut}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10"
             style={{ background: "#07182E" }}>
          <button onClick={() => setSidebarOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"/>
            </svg>
          </button>
          <span className="text-white font-bold text-sm">
            {TABS.find(t => t.id === tab)?.label}
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {tab === "dashboard" && (
            <DashboardTab
              clientData={clientData}
              projects={projects}
              invoices={invoices}
              messages={messages}
              onTab={setTab}
            />
          )}
          {tab === "projects" && <ProjectsTab projects={projects} />}
          {tab === "invoices" && (
            <InvoicesTab invoices={invoices} clientData={clientData} />
          )}
          {tab === "messages" && (
            <MessagesTab
              messages={messages}
              setMessages={setMessages}
              clientUid={user?.uid}
              user={user}
              clientData={clientData}
            />
          )}
          {tab === "profile" && (
            <ProfileTab user={user} clientData={clientData} />
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import ChatWidget from "./ChatWidget";

export default function DashboardLayout({ headerTitle, sidebarContent, userName, userEmail, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar if window gets resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* 📱 1. MOBILE HEADER (Only shows on phones) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0f172a] text-white p-4 flex justify-between items-center z-40 shadow-md">
        <div className="font-bold tracking-widest text-sm flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1 rounded text-xs">RDS</div>
          {headerTitle}
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="text-white text-2xl focus:outline-none"
        >
          {isSidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 📱 2. MOBILE OVERLAY (Darkens background when sidebar is open on phones) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🖥️ 3. THE SIDEBAR */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-[#0f172a] text-slate-300 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        // Magic Trick: Clicking ANY button inside the sidebar on a phone will auto-close the sidebar!
        onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}
      >
        {sidebarContent}
      </aside>

      {/* 📄 4. MAIN CONTENT AREA */}
      <main className="flex-1 transition-all md:ml-64 pt-16 md:pt-0 h-screen overflow-y-auto">
        <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* 💬 GLOBAL CHAT WIDGET */}
      {(userName || userEmail) && (
        <ChatWidget userName={userName} userEmail={userEmail} />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";

export default function Navbar({ view, navigateTo }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("rds_corporate_theme") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("rds_corporate_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        
        {/* BRANDING LOGO */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("home")}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black flex items-center justify-center rounded-lg shadow-md text-sm">RDS</div>
          <span className="font-display font-black text-white text-base tracking-wider hidden sm:inline-block">RAJA DEEPU SOORIYA</span>
        </div>

        {/* NAVIGATION LINKS & SYSTEMS TOGGLE */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo("home")} className={`text-xs font-bold uppercase tracking-wider transition-colors ${view === 'home' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}>Home</button>
          <button onClick={() => navigateTo("employee")} className={`text-xs font-bold uppercase tracking-wider transition-colors ${view === 'employee' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}>Staff Hub</button>
          <button onClick={() => navigateTo("director")} className={`text-xs font-bold uppercase tracking-wider transition-colors ${view === 'director' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}>Director Portal</button>

          {/* 🌓 HIGH-PREMIUM LIGHT / DARK MODE BUTTON */}
          <button 
            onClick={toggleTheme} 
            className="ml-2 w-9 h-9 flex items-center justify-center bg-slate-800 dark:bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all active:scale-95 shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.036l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 111.414 1.414zm2.121-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-4 h-4 fill-indigo-400" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
}

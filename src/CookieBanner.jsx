import { useState, useEffect } from "react";

export default function CookieBanner({ consent, onAccept, onDecline }) {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Slide up after 800ms to prevent screen flashing
  useEffect(() => {
    if (consent === "pending") {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [consent]);

  if (!visible) return null;

  const handleSaveSettings = () => {
    if (analyticsEnabled) {
      onAccept();
    } else {
      onDecline();
    }
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none flex justify-center">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-6 w-full max-w-4xl pointer-events-auto relative overflow-hidden transition-all duration-500 transform translate-y-0">
        
        {/* Brand Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-corp-blue via-corp-gold to-corp-red" />
        
        {!showSettings ? (
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1 text-slate-300 text-sm leading-relaxed">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <span>🍪</span> Data Privacy & Cookies
              </h3>
              We use essential cookies to make our platform work securely. With your consent, we also use Firebase Analytics to understand how you interact with our services so we can improve them. This complies with India's DPDP Act 2023.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
              <button onClick={() => setShowSettings(true)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Cookie Settings
              </button>
              <button onClick={onDecline} className="px-6 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-md transition-colors">
                Decline Optional
              </button>
              <button onClick={onAccept} className="px-6 py-2 text-sm font-bold text-slate-900 bg-corp-gold hover:bg-amber-400 rounded-md transition-colors shadow-lg shadow-corp-gold/20">
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h3 className="text-white font-bold text-lg mb-4">Cookie Preferences</h3>
            <div className="space-y-4 mb-6">
              
              {/* Essential Cookies (Cannot be disabled) */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div>
                  <div className="text-white font-bold text-sm">Essential Cookies</div>
                  <div className="text-slate-400 text-xs mt-1">Required for security, employee authentication, and core functionality. Cannot be disabled.</div>
                </div>
                <div className="text-corp-blue bg-blue-500/10 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  Always Active
                </div>
              </div>

              {/* Analytics Cookies (Optional) */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="pr-4">
                  <div className="text-white font-bold text-sm">Analytics (Firebase)</div>
                  <div className="text-slate-400 text-xs mt-1">Collects anonymous data on how you use the site (like pages visited) to help us improve user experience.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={analyticsEnabled} onChange={() => setAnalyticsEnabled(!analyticsEnabled)} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-corp-gold"></div>
                </label>
              </div>

            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Back
              </button>
              <button onClick={handleSaveSettings} className="px-6 py-2 text-sm font-bold text-slate-900 bg-white hover:bg-gray-200 rounded-md transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

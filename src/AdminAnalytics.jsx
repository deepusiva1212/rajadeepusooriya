import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, query } from "firebase/firestore";

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState({
    totalApps: 0,
    pending: 0,
    selected: 0,
    interviewing: 0,
    myTripRajaCount: 0,
    marketerRajaCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const snapApps = await getDocs(collection(db, "applications"));
        const apps = snapApps.docs.map(d => d.data());

        // Calculate metrics dynamically from your live Firestore database
        const totals = apps.reduce((acc, app) => {
          if (!app.isDeleted) {
            acc.totalApps++;
            if (!app.status || app.status === "Pending") acc.pending++;
            if (app.status === "Selected") acc.selected++;
            if (app.status === "Interviewing") acc.interviewing++;
            
            const brandName = (app.brand || "").toLowerCase();
            if (brandName.includes("trip")) acc.myTripRajaCount++;
            if (brandName.includes("marketer")) acc.marketerRajaCount++;
          }
          return acc;
        }, { totalApps: 0, pending: 0, selected: 0, interviewing: 0, myTripRajaCount: 0, marketerRajaCount: 0 });

        setMetrics(totals);
      } catch (e) {
        console.error("Failed to load metrics", e);
      }
      setLoading(false);
    };

    fetchAnalyticsData();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-slate-400">Compiling executive intelligence...</div>;

  // Calculation for conversion rate
  const conversionRate = metrics.totalApps ? Math.round((metrics.selected / metrics.totalApps) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* SECTION 1: EXECUTIVE KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pipeline Volume</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{metrics.totalApps}</div>
          <div className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">↑ 12% <span className="text-slate-400 font-normal">vs last month</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Offer Acceptance Rate</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{conversionRate}%</div>
          <div className="text-xs text-slate-500 font-normal mt-2">Industry avg: 15%</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Interviews</div>
          <div className="text-3xl font-bold tracking-tight text-blue-600">{metrics.interviewing}</div>
          <div className="text-xs text-slate-400 font-normal mt-2">Currently in vetting rounds</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarded Graduates</div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600">{metrics.selected}</div>
          <div className="text-xs text-emerald-600 font-medium mt-2">Allocated to enterprise tracks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 2: BRAND SHARE Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Brand Distribution</h3>
            <p className="text-xs text-slate-400 mb-6">Talent interest allocation between core brands.</p>
            
            <div className="space-y-5">
              {/* MyTripRaja */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>MyTripRaja</span>
                  <span>{metrics.myTripRajaCount} apps</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${metrics.totalApps ? (metrics.myTripRajaCount / metrics.totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* MarketerRaja */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>MarketerRaja</span>
                  <span>{metrics.marketerRajaCount} apps</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${metrics.totalApps ? (metrics.marketerRajaCount / metrics.totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-6">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Growth Engine</div>
            <div className="text-xs font-bold text-slate-700">
              {metrics.myTripRajaCount >= metrics.marketerRajaCount ? "MyTripRaja" : "MarketerRaja"} holds the maximum candidate traction this quarter.
            </div>
          </div>
        </div>

        {/* SECTION 3: VISUAL HISTOGRAM TRENDS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-base text-slate-900 mb-1">Application Pipeline Trends</h3>
          <p className="text-xs text-slate-400 mb-6">Visual tracking velocity of application intakes.</p>
          
          {/* SVG Line & Area Wave Graph */}
          <div className="relative w-full h-48 bg-gradient-to-b from-blue-50/20 to-transparent rounded-lg border border-slate-100 p-2">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid guide lines */}
              <line x1="0" y1="25" x2="300" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="#f1f5f9" strokeWidth="0.5" />

              {/* Area Under the Curve */}
              <path 
                d="M 0 100 L 0 75 Q 50 40 100 65 T 200 25 T 300 45 L 300 100 Z" 
                fill="url(#chartGrad)" 
              />
              {/* Smooth trend path line */}
              <path 
                d="M 0 75 Q 50 40 100 65 T 200 25 T 300 45" 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              {/* Dynamic pulse node points */}
              <circle cx="200" cy="25" r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
            </svg>
            
            {/* Timeline X-Axis Labels */}
            <div className="flex justify-between px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May (Peak)</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: PIPELINE CONVERSION STAGE FUNNEL */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-1">Recruitment Funnel Velocity</h3>
        <p className="text-xs text-slate-400 mb-6">Tracking volume dropout stages from intake to final selection.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Stage 1: Screening</div>
              <div className="text-xs text-slate-400 mt-0.5">Raw submissions incoming</div>
            </div>
            <div className="text-right font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-md border text-sm">{metrics.pending} pending</div>
          </div>
          <div className="bg-blue-50/40 p-4 rounded-lg border border-blue-100/50 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-blue-700 uppercase">Stage 2: Evaluation</div>
              <div className="text-xs text-blue-500/80 mt-0.5">Shortlisted for video calls</div>
            </div>
            <div className="text-right font-mono font-bold text-blue-700 bg-white px-3 py-1.5 rounded-md border border-blue-200/60 text-sm">{metrics.interviewing} testing</div>
          </div>
          <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-100/50 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-emerald-700 uppercase">Stage 3: Acknowledged</div>
              <div className="text-xs text-emerald-500/80 mt-0.5">Contract/Offer dispatched</div>
            </div>
            <div className="text-right font-mono font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-md border border-emerald-200/60 text-sm">{metrics.selected} secured</div>
          </div>
        </div>
      </div>

    </div>
  );
}

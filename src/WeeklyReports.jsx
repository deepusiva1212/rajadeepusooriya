import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc } from "firebase/firestore";

export default function WeeklyReports({ userName, userEmail, role }) {
  const [reports, setReports] = useState([]);
  const [achievements, setAchievements] = useState("");
  const [blockers, setBlockers] = useState("");
  const [loading, setLoading] = useState(true);

  const isDirector = role === "Super Admin" || role === "Admin";

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let q = isDirector 
          ? query(collection(db, "weekly_reports"), orderBy("createdAt", "desc"))
          : query(collection(db, "weekly_reports"), where("email", "==", userEmail), orderBy("createdAt", "desc"));
        
        const snap = await getDocs(q);
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to fetch reports", e);
      }
      setLoading(false);
    };
    fetchReports();
  }, [userEmail, isDirector]);

  const submitReport = async (e) => {
    e.preventDefault();
    if (!achievements.trim()) return;
    
    try {
      const newReport = {
        name: userName, email: userEmail, achievements, blockers, rating: 0,
        createdAt: serverTimestamp(),
        week: `Week of ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
      };
      const docRef = await addDoc(collection(db, "weekly_reports"), newReport);
      setReports([{ id: docRef.id, ...newReport, createdAt: { toDate: () => new Date() } }, ...reports]);
      setAchievements(""); setBlockers("");
      alert("Weekly report submitted successfully!");
    } catch (e) { alert("Failed to submit report."); }
  };

  const rateReport = async (id, stars) => {
    try {
      await updateDoc(doc(db, "weekly_reports", id), { rating: stars });
      setReports(reports.map(r => r.id === id ? { ...r, rating: stars } : r));
    } catch (e) { alert("Failed to rate report."); }
  };

  if (loading) return <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading records...</div>;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-900">{isDirector ? "Intern Performance Dashboard" : "My Weekly OKRs"}</h3>
        <p className="text-xs text-slate-500 mt-1">{isDirector ? "Review and rate weekly progress submissions." : "Submit your end-of-week progress and blockers."}</p>
      </div>

      {!isDirector && (
        <form onSubmit={submitReport} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">What did you achieve this week?</label>
            <textarea required rows="3" value={achievements} onChange={e => setAchievements(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Any blockers or challenges? (Optional)</label>
            <textarea rows="2" value={blockers} onChange={e => setBlockers(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50 focus:bg-white" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm w-full md:w-auto">Submit Weekly Report</button>
        </form>
      )}

      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{report.week}</div>
                <div className="font-bold text-slate-900">{report.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Director Rating</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} disabled={!isDirector} onClick={() => rateReport(report.id, star)} className={`text-lg transition-transform ${isDirector ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${star <= report.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Achievements:</span><p className="text-sm text-slate-700">{report.achievements}</p></div>
              {report.blockers && <div className="bg-rose-50 p-3 rounded border border-rose-100"><span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 block mb-1">Blockers:</span><p className="text-sm text-rose-800">{report.blockers}</p></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

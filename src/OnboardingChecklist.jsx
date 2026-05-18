import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function OnboardingChecklist({ userEmail }) {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const onboardingTasks = [
    { id: "setup_email", title: "Set up Corporate Email Account", desc: "Ensure your @rajadeepusooriya.com email is active." },
    { id: "sign_nda", title: "Digitally Sign NDA & Policies", desc: "Visit the Handbooks tab to sign your legal documents." },
    { id: "read_brand", title: "Review Brand Assets", desc: "Familiarize yourself with the colors for MyTripRaja & MarketerRaja." },
    { id: "profile_pic", title: "Upload Profile Photo", desc: "Go to your workspace and add a professional headshot." }
  ];

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const docRef = doc(db, "onboarding", safeEmail);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) setCompletedTasks(docSnap.data().completed || []);
        else await setDoc(docRef, { completed: [] });
      } catch (e) { console.error("Error fetching onboarding data"); }
      setLoading(false);
    };
    fetchProgress();
  }, [userEmail]);

  const toggleTask = async (taskId) => {
    try {
      const isCompleted = completedTasks.includes(taskId);
      const newTasks = isCompleted ? completedTasks.filter(id => id !== taskId) : [...completedTasks, taskId];
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      await updateDoc(doc(db, "onboarding", safeEmail), { completed: newTasks });
      setCompletedTasks(newTasks);
    } catch (e) { alert("Failed to save progress."); }
  };

  const progressPercentage = Math.round((completedTasks.length / onboardingTasks.length) * 100);

  if (loading) return null;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-900">Day-1 Onboarding</h3>
        <p className="text-xs text-slate-500 mt-1">Complete these mandatory setup steps to begin your internship.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Progress</div>
          <div className="text-lg font-black text-indigo-600">{progressPercentage}%</div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <div className="space-y-3">
        {onboardingTasks.map(task => {
          const isDone = completedTasks.includes(task.id);
          return (
            <div key={task.id} className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${isDone ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 shadow-sm'}`}>
              <button onClick={() => toggleTask(task.id)} className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-400'}`}>
                {isDone && <span className="text-xs">✓</span>}
              </button>
              <div>
                <h4 className={`font-bold text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h4>
                <p className={`text-xs mt-1 ${isDone ? 'text-slate-400' : 'text-slate-500'}`}>{task.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SystemTour({ userEmail, forceStart, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to RDS Enterprise 🚀",
      desc: "Welcome to Raja Deepu Sooriya Private Limited. This portal is your central hub for all corporate operations, tasks, and communications.",
      icon: "🏢"
    },
    {
      title: "My Workspace ✅",
      desc: "Here you will find your daily assigned Tasks, your Private Notepad, and the Request Leave system. Always check your Kanban board first thing in the morning.",
      icon: "📋"
    },
    {
      title: "Company & Culture 🔥",
      desc: "Stay updated! Read the latest News, sign your mandatory Handbooks & NDAs, and give Kudos to your teammates.",
      icon: "🤝"
    },
    {
      title: "Operations & Tools ⏱️",
      desc: "Track your Attendance via the heatmap, submit your Weekly OKR Reports, and complete your Day-1 Onboarding Checklist.",
      icon: "⚙️"
    },
    {
      title: "Global Chat Widget 💬",
      desc: "Look at the bottom right of your screen. You can use this floating chat bubble to instantly communicate with the Director and other team members at any time.",
      icon: "💬"
    }
  ];

  useEffect(() => {
    const checkTourStatus = async () => {
      if (forceStart) {
        setIsVisible(true);
        setCurrentStep(0);
        return;
      }

      try {
        const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const docRef = doc(db, "user_preferences", safeEmail);
        const docSnap = await getDoc(docRef);
        
        // If the document doesn't exist or tour is not completed, show it
        if (!docSnap.exists() || !docSnap.data().tourCompleted) {
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Failed to check tour status");
      }
    };

    if (userEmail) checkTourStatus();
  }, [userEmail, forceStart]);

  const finishTour = async () => {
    setIsVisible(false);
    if (onClose) onClose();
    
    try {
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      await setDoc(doc(db, "user_preferences", safeEmail), { tourCompleted: true }, { merge: true });
    } catch (e) {
      console.error("Failed to save tour completion");
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else finishTour();
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Progress Bar Header */}
        <div className="w-full bg-slate-100 h-2">
          <div 
            className="bg-indigo-600 h-2 transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-8 text-center flex-1">
          <div className="text-6xl mb-4 animate-bounce">{steps[currentStep].icon}</div>
          <h2 className="font-display text-2xl font-black text-slate-900 mb-3">{steps[currentStep].title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed min-h-[80px]">
            {steps[currentStep].desc}
          </p>
        </div>

        {/* Controls Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={finishTour}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={nextStep}
              className="px-6 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next ➔"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

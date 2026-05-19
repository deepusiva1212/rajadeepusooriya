import { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SystemTour({ userEmail, forceStart, onClose }) {
  const [run, setRun] = useState(false);

  // 🎯 THE TOUR STEPS
  // "target" looks for a specific CSS class name on your website
  const steps = [
    {
      target: "body", // Highlights the center of the screen
      title: "Welcome to RDS Enterprise 🚀",
      content: "This portal is your central hub for all corporate operations. Let's take a quick 4-step tour to show you how things work.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".tour-my-tasks", // We will add this class to the Tasks button next!
      title: "Your Workspace ✅",
      content: "Start your day here. You can view your assigned tasks, drag-and-drop them to update their status, and manage your private notepad.",
      placement: "right",
    },
    {
      target: ".tour-culture",
      title: "Company & Culture 🔥",
      content: "Stay connected. Check this section to read company news, sign your mandatory NDAs, and give Kudos to your teammates.",
      placement: "right",
    },
    {
      target: ".tour-tools",
      title: "Operations & Tools ⏱️",
      content: "This is for HR tracking. View your attendance heatmap, submit your Weekly OKR progress, and access IT software credentials.",
      placement: "right",
    },
    {
      target: ".tour-chat-widget", // We will add this to the floating chat bubble!
      title: "Global Chat 💬",
      content: "Look down here! You can use this floating chat bubble to instantly message the Director and other team members at any time.",
      placement: "top-end",
    }
  ];

  // Check Firebase to see if they already completed the tour
  useEffect(() => {
    const checkTourStatus = async () => {
      if (forceStart) {
        setRun(true);
        return;
      }
      try {
        const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const docRef = doc(db, "user_preferences", safeEmail);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists() || !docSnap.data().tourCompleted) {
          setRun(true); // Start the tour!
        }
      } catch (e) {
        console.error("Failed to check tour status");
      }
    };
    if (userEmail) checkTourStatus();
  }, [userEmail, forceStart]);

  // Handle when the user clicks "Skip" or finishes the last step
  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (onClose) onClose();
      
      // Save to Firebase so it doesn't bother them again
      try {
        const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        await setDoc(doc(db, "user_preferences", safeEmail), { tourCompleted: true }, { merge: true });
      } catch (e) {
        console.error("Failed to save tour completion");
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true} // Shows a "Next" button instead of closing
      showSkipButton={true} // Allows them to skip the tour
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4f46e5', // Indigo-600 to match your brand
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          overlayColor: 'rgba(15, 23, 42, 0.7)', // Dark slate blur
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '12px',
          fontFamily: '"Inter", sans-serif',
          padding: '20px',
        },
        buttonNext: {
          fontWeight: 'bold',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }
      }}
    />
  );
}

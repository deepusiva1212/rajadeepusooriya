import { useState, useEffect } from 'react';

export default function PageTransitionBar() {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // This smart listener watches for ANY click on a button or link globally
    const handleGlobalClick = (e) => {
      const isInteractive = e.target.closest('button, a, select');
      if (!isInteractive) return;

      // 1. Instantly show the bar and shoot to 20%
      setOpacity(1);
      setProgress(20);

      // 2. Simulate the "processing" phase
      setTimeout(() => setProgress(65), 150);
      setTimeout(() => setProgress(85), 300);

      // 3. Complete the loading and smoothly fade away
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setOpacity(0);
          // Reset the bar width secretly after it turns invisible
          setTimeout(() => setProgress(0), 300); 
        }, 300);
      }, 500);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-blue-600 z-[9999] pointer-events-none transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: opacity,
        boxShadow: "0 0 15px #2563eb, 0 0 8px #3b82f6" // Gives it that glowing neon "GitHub" look
      }}
    />
  );
}

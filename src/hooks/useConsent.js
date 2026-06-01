import { useState, useEffect } from "react";
import { initAnalytics } from "../firebase";

export function useConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    // Check local storage on initial load
    const stored = localStorage.getItem("rds_cookie_consent");
    if (stored) {
      setConsent(stored);
      // If previously accepted, boot up Analytics immediately
      if (stored === "accepted") {
        initAnalytics();
      }
    } else {
      setConsent("pending");
    }
  }, []);

  const accept = () => {
    localStorage.setItem("rds_cookie_consent", "accepted");
    setConsent("accepted");
    initAnalytics(); // Boot up Analytics now!
  };

  const decline = () => {
    localStorage.setItem("rds_cookie_consent", "declined");
    setConsent("declined");
  };

  return { consent, accept, decline };
}

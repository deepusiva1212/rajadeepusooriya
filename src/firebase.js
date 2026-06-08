/**
 * src/firebase.js  ← FIXED
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG FIXED: Previously hardcoded the API keys directly in the file.
 * Those hardcoded values were DIFFERENT from the .env values (note the
 * capital 'F' vs lowercase 'f' in the apiKey). This caused auth to initialise
 * with a mismatched config, making signInWithPopup silently fail.
 *
 * NOW: reads all values from .env via import.meta.env.VITE_* as intended.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp }              from "firebase/app";
import { getFirestore }               from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported }  from "firebase/analytics";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate config on startup so you get a clear error instead of silent auth failure
if (!firebaseConfig.apiKey) {
  console.error(
    "[RDS] Firebase config missing! Check your .env file — " +
    "all VITE_FIREBASE_* variables must be set."
  );
}

const app = initializeApp(firebaseConfig);

export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();

// Lazy analytics — only after cookie consent
let analyticsInstance    = null;
let analyticsInitialised = false;

export async function initAnalytics() {
  if (analyticsInitialised) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance    = getAnalytics(app);
      analyticsInitialised = true;
    }
  } catch (e) {
    console.warn("[RDS] Analytics init failed:", e);
  }
  return analyticsInstance;
}

export function getAnalyticsInstance() {
  return analyticsInstance;
}

/**
 * src/firebase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXED: reads ALL config values from .env via import.meta.env.VITE_*
 * No hardcoded keys anywhere — eliminates the typo/mismatch bug for good.
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

// Fail loudly if .env isn't loaded — better than silent auth failures
if (!firebaseConfig.apiKey) {
  console.error(
    "[RDS] Firebase apiKey is undefined! Check that .env exists in the " +
    "project root and all VITE_FIREBASE_* variables are set correctly. " +
    "Also confirm these are added in Vercel → Settings → Environment Variables."
  );
}

const app = initializeApp(firebaseConfig);

export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();

// ── Analytics (lazy — only initialised after cookie consent) ─────────────────
let analyticsInstance    = null;
let analyticsInitialised = false;

export async function initAnalytics() {
  if (analyticsInitialised) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance    = getAnalytics(app);
      analyticsInitialised = true;
      console.info("[RDS] Firebase Analytics initialised with user consent.");
    }
  } catch (e) {
    console.warn("[RDS] Analytics could not be initialised:", e);
  }
  return analyticsInstance;
}

export function getAnalyticsInstance() {
  return analyticsInstance;
}

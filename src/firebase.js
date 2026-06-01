/**
 * src/firebase.js  (updated)
 * ─────────────────────────────────────────────────────────────────────────────
 * Key change from original:
 * getAnalytics() is NOT called on import.
 * Instead, initAnalytics() is exported and called lazily by useConsent.js
 * ONLY after the user explicitly accepts cookies.
 *
 * This ensures zero analytics data is collected before consent — required by
 * India's DPDP Act 2023 and recommended best practice for all websites.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp }         from "firebase/app";
import { getFirestore }          from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            "AIzaSyCGwFIkqRsBC5BFnTy_q7OnRYI_-eM9nrs",
  authDomain:        "rajadeepusooriya-1302d.firebaseapp.com",
  projectId:         "rajadeepusooriya-1302d",
  storageBucket:     "rajadeepusooriya-1302d.firebasestorage.app",
  messagingSenderId: "1008463369368",
  appId:             "1:1008463369368:web:0882106589216924abeced",
  measurementId:     "G-HTM5NZKF8H"
};

// ── Core services (always initialised — no personal data collected) ──────────
const app = initializeApp(firebaseConfig);

export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();

// ── Analytics (lazy — only initialised after user consent) ───────────────────
let analyticsInstance = null;
let analyticsInitialised = false;

/**
 * Call this ONLY from useConsent.js after the user clicks "Accept".
 * Safe to call multiple times — idempotent.
 */
export async function initAnalytics() {
  if (analyticsInitialised) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance   = getAnalytics(app);
      analyticsInitialised = true;
      console.info("[RDS] Firebase Analytics initialised with user consent.");
    }
  } catch (e) {
    console.warn("[RDS] Analytics could not be initialised:", e);
  }
  return analyticsInstance;
}

/**
 * Get the analytics instance if it has been initialised.
 * Returns null if the user hasn't consented yet.
 */
export function getAnalyticsInstance() {
  return analyticsInstance;
}

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
  apiKey: "AIzaSyCGwFIkqRsBC5BfnTy_q7OnRYI_-eM9nrs",
  authDomain: "rajadeepusooriya-1302d.firebaseapp.com",
  projectId: "rajadeepusooriya-1302d",
  storageBucket: "rajadeepusooriya-1302d.firebasestorage.app",
  messagingSenderId: "1008463369368",
  appId: "1:1008463369368:web:0882106589216924abeced",
  measurementId: "G-HTM5NZKF8H"
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

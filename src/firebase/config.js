// Firebase setup

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// pull from env vars or use defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app = null;
let auth = null;
let db = null;
let isFirebaseEnabled = false;
let isAuthenticating = false;
let authenticationPromise = null;

// Validate Firebase config
function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !config[key] || config[key] === 'undefined' || config[key] === 'null');
  return missing.length === 0;
}

// try to init firebase, fall back to local storage if it fails
try {
  if (!validateFirebaseConfig(firebaseConfig)) {
    throw new Error('Invalid Firebase configuration - missing required values');
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseEnabled = true;

  isAuthenticating = true;
  const authStartTime = Date.now();

  authenticationPromise = signInAnonymously(auth)
    .then(() => {
      isAuthenticating = false;
      return true;
    })
    .catch(() => {
      isAuthenticating = false;
      isFirebaseEnabled = false;
      return false;
    });
} catch (error) {
  isFirebaseEnabled = false;
}

/**
 * Ensure Firebase anonymous authentication is complete before proceeding
 * This is separate from the custom username/password auth in simpleAuth.js
 * @returns {Promise<boolean>} True if authenticated, false if Firebase is disabled
 */
export async function ensureFirebaseAuth() {
  if (!isFirebaseEnabled) {
    return false;
  }

  if (auth.currentUser) {
    return true;
  }

  if (isAuthenticating && authenticationPromise) {
    const result = await authenticationPromise;
    if (result && auth.currentUser) {
      return true;
    }
  }

  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      return true;
    } catch (error) {
      isFirebaseEnabled = false;
      return false;
    }
  }

  return !!auth.currentUser;
}

/**
 * Get current user ID
 * @returns {string|null}
 */
export function getCurrentUserId() {
  if (!isFirebaseEnabled || !auth.currentUser) {
    return null;
  }
  return auth.currentUser.uid;
}

// Export for debugging in browser console
if (typeof window !== 'undefined') {
  window.auth = auth;
  window.db = db;
  window.isFirebaseEnabled = isFirebaseEnabled;
}

export { app, auth, db, isFirebaseEnabled };
